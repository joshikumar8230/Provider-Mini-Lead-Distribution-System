import express from "express"
import cors from "cors"
import http from "http"
import { Server } from "socket.io"
import { createClient } from "@supabase/supabase-js"

const app = express()

// =========================
// CREATE HTTP SERVER
// =========================
const server = http.createServer(app)

// =========================
// SOCKET.IO SETUP
// =========================
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

// =========================
// MIDDLEWARE
// =========================
app.use(cors())
app.use(express.json())

// =========================
// SUPABASE SETUP
// =========================
const supabaseUrl =
  "https://sgykoitfkyalltcgjpkq.supabase.co"

const supabaseKey =
  "sb_secret_D92kbD0IkRy6Mp6pXNjpKQ_L0GMWT7s"

const supabase = createClient(supabaseUrl, supabaseKey)

// =========================
// SOCKET CONNECTION
// =========================
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id)

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id)
  })
})

// =========================
// CREATE LEAD + ALLOCATION + WEBSOCKET
// =========================
// =========================
// CREATE LEAD + ALLOCATION + WEBSOCKET
// =========================
app.post("/api/leads/create", async (req, res) => {

  try {

    const {
      customerName,
      phone,
      city,
      serviceId,
      description,
    } = req.body

    // =========================
    // 1. INSERT LEAD
    // =========================
    const { data: lead, error: leadError } =
      await supabase
        .from("leads")
        .insert([
          {
            customer_name:
              customerName,

            phone,

            city,

            service_id:
              serviceId,

            description,
          },
        ])
        .select()
        .single()

    // duplicate lead
    if (leadError) {

      if (leadError.code === "23505") {

        return res.status(400).json({
          error:
            "Lead already exists for this service",
        })
      }

      throw leadError
    }

    const leadId = lead.id

    // =========================
    // 2. RULES
    // =========================
    const RULES = {

      1: {
        mandatory: [1],
        pool: [2, 3, 4],
      },

      2: {
        mandatory: [5],
        pool: [6, 7, 8],
      },

      3: {
        mandatory: [1, 4],
        pool: [2, 3, 5, 6, 7, 8],
      },
    }

    const rule = RULES[serviceId]

    if (!rule) {

      // rollback lead
      await supabase
        .from("leads")
        .delete()
        .eq("id", leadId)

      return res.status(400).json({
        error: "Invalid serviceId",
      })
    }

    // =========================
    // 3. GET PROVIDERS
    // =========================
    const {
      data: providers,
      error: providerError,
    } = await supabase
      .from("providers")
      .select("*")

    if (providerError) {

      // rollback lead
      await supabase
        .from("leads")
        .delete()
        .eq("id", leadId)

      throw providerError
    }

    const getProvider = (id) =>
      providers.find(
        (p) => p.id === id
      ) || null

    // =========================
    // 4. CHECK AVAILABLE
    // =========================
    const allPossibleProviders = [

      ...rule.mandatory,

      ...rule.pool,
    ]

    const availableProviders =
      allPossibleProviders.filter((pid) => {

        const provider =
          getProvider(pid)

        return (
          provider &&
          provider.remaining_quota > 0
        )
      })

    const uniqueAvailable =
      [...new Set(availableProviders)]

    // =========================
    // NOT ENOUGH PROVIDERS
    // =========================
    if (uniqueAvailable.length < 3) {

      // rollback lead
      await supabase
        .from("leads")
        .delete()
        .eq("id", leadId)

      return res.status(400).json({
        error:
          "Not enough providers available",
      })
    }

    // =========================
    // 5. ASSIGNMENT LOGIC
    // =========================
    let assigned = []

    // mandatory first
    for (let pid of rule.mandatory) {

      const provider =
        getProvider(pid)

      if (
        provider &&
        provider.remaining_quota > 0 &&
        !assigned.includes(pid)
      ) {

        assigned.push(pid)
      }
    }

    // =========================
    // 6. ROUND ROBIN
    // =========================
    const { data: state } =
      await supabase
        .from("allocation_state")
        .select("*")
        .eq(
          "service_id",
          serviceId
        )
        .single()

    let index =
      state?.current_index ?? 0

    const pool = rule.pool

    let attempts = 0

    while (
      assigned.length < 3 &&
      attempts < pool.length * 2
    ) {

      const pid =
        pool[
          index % pool.length
        ]

      index++

      attempts++

      const provider =
        getProvider(pid)

      if (
        provider &&
        provider.remaining_quota > 0 &&
        !assigned.includes(pid)
      ) {

        assigned.push(pid)
      }
    }

    // =========================
    // FAILED ASSIGNMENT
    // =========================
    if (assigned.length < 3) {

      // rollback lead
      await supabase
        .from("leads")
        .delete()
        .eq("id", leadId)

      return res.status(400).json({
        error:
          "Unable to assign 3 providers",
      })
    }

    // =========================
    // 7. SAVE ASSIGNMENTS
    // =========================
    for (let pid of assigned) {

      // save assignment
      const {
        error: assignmentError
      } = await supabase
        .from("lead_assignments")
        .insert([
          {
            lead_id: leadId,
            provider_id: pid,
          },
        ])

      // assignment failed
      if (assignmentError) {

        // rollback assignments
        await supabase
          .from("lead_assignments")
          .delete()
          .eq("lead_id", leadId)

        // rollback lead
        await supabase
          .from("leads")
          .delete()
          .eq("id", leadId)

        throw assignmentError
      }

      // =========================
      // ATOMIC QUOTA DECREMENT
      // =========================
      const {
        error: quotaError
      } = await supabase.rpc(
        "decrement_quota",
        {
          p_provider_id: pid,
        }
      )

      // quota failed
      if (quotaError) {

        // rollback assignments
        await supabase
          .from("lead_assignments")
          .delete()
          .eq("lead_id", leadId)

        // rollback lead
        await supabase
          .from("leads")
          .delete()
          .eq("id", leadId)

        throw quotaError
      }
    }

    // =========================
    // 8. UPDATE ROUND ROBIN
    // =========================
    const {
      error: stateError
    } = await supabase
      .from("allocation_state")
      .upsert({
        service_id:
          serviceId,

        current_index:
          index % pool.length,
      })

    if (stateError) {

      // rollback assignments
      await supabase
        .from("lead_assignments")
        .delete()
        .eq("lead_id", leadId)

      // rollback lead
      await supabase
        .from("leads")
        .delete()
        .eq("id", leadId)

      throw stateError
    }

    // =========================
    // 9. SOCKET EVENTS
    // =========================
    io.emit("new-lead", {
      lead,
      assignedProviders:
        assigned,
    })

    io.emit("lead-assigned", {
      leadId,
      assignedProviders:
        assigned,
    })

    // =========================
    // SUCCESS
    // =========================
    return res.status(201).json({

      success: true,

      lead,

      assignedProviders:
        assigned,
    })

  } catch (err) {

    return res.status(500).json({

      error:
        err.message,
    })
  }
})
// =========================
// GET ALL PROVIDERS
// =========================
app.get("/api/providers", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("providers")
      .select("*")

    if (error) throw error

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// =========================
// GET PROVIDER DETAILS
// =========================
app.get("/api/providers/:id", async (req, res) => {
  try {
    const providerId = req.params.id

    const { data: provider } = await supabase
      .from("providers")
      .select("*")
      .eq("id", providerId)
      .single()

    const { data: assignments } = await supabase
      .from("lead_assignments")
      .select(`
        id,
        leads (
          id,
          customer_name,
          phone,
          city,
          service_id,
          description
        )
      `)
      .eq("provider_id", providerId)

    res.json({
      provider,
      leads: assignments,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/api/webhook/reset-quota", async (req, res) => {
  try {
    const { eventId } = req.body

    // =========================
    // CHECK EXISTING EVENT
    // =========================
    const { data: existing, error: existingError } =
      await supabase
        .from("webhook_events")
        .select("*")
        .eq("event_id", eventId)
        .maybeSingle()

    if (existingError) {
      throw existingError
    }

    // =========================
    // IDEMPOTENCY
    // =========================
    if (existing) {
      return res.json({
        message:
          "Webhook already processed (ignored)",
      })
    }

    // =========================
    // INSERT EVENT
    // =========================
    const { error: insertError } =
      await supabase
        .from("webhook_events")
        .insert([
          {
            event_id: eventId,
            processed: true,
          },
        ])

    if (insertError) {
      throw insertError
    }

    // =========================
    // RESET QUOTA
    // IMPORTANT FIX
    // =========================
    const { data, error: updateError } =
      await supabase
        .from("providers")
        .update({
          remaining_quota: 10,
        })
        .gt("id", 0) // update all rows

    if (updateError) {
      throw updateError
    }

    return res.json({
      success: true,
      message:
        "Quota reset successfully",
    })

  } catch (err) {

    console.log(err)

    return res.status(500).json({
      error: err.message,
    })
  }
})

app.post(
  "/api/test/generate-leads",
  async (req, res) => {

    try {

      // =========================
      // CREATE 10 REQUESTS
      // =========================
      const requests = []

      for (let i = 0; i < 10; i++) {

        const unique =
          Date.now() + i

        const body = {

          customerName:
            `Test User ${i}`,

          // UNIQUE PHONE
          phone:
            `9${unique}`,

          city:
            "Test City",

          // rotates 1,2,3
          serviceId:
            1,

          description:
            "Auto generated lead",
        }

        // =========================
        // CALL REAL API
        // =========================
        requests.push(

          fetch(
            "http://localhost:5000/api/leads/create",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(body),
            }
          )
        )
      }

      // =========================
      // RUN SIMULTANEOUSLY
      // =========================
      const responses =
        await Promise.all(requests)

      // =========================
      // PARSE RESULTS
      // =========================
      const results =
        await Promise.all(

          responses.map(
            async (r) => {

              const data =
                await r.json()

              return {

                status:
                  r.status,

                success:
                  r.ok,

                data,
              }
            }
          )
        )

      // =========================
      // COUNT SUCCESS / FAIL
      // =========================
      const successCount =
        results.filter(
          (r) => r.success
        ).length

      const failedCount =
        results.filter(
          (r) => !r.success
        ).length

      // =========================
      // RESPONSE
      // =========================
      return res.json({

        success: true,

        total:
          results.length,

        successCount,

        failedCount,

        results,

      })

    } catch (err) {

      return res.status(500).json({

        error:
          err.message,

      })
    }
  }
)

server.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000")
})