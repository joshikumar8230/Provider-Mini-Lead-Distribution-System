import { useEffect, useState } from "react"
import axios from "axios"
import { io } from "socket.io-client"

import Navbar from "./Navbar"

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Chip,
  Divider,
} from "@mui/material"

const socket = io("http://localhost:5000")

function Dashboard() {

  const [providers, setProviders] = useState([])
  const [selected, setSelected] = useState(null)
  const [details, setDetails] = useState(null)

  // =========================
  // LOAD PROVIDERS
  // =========================
  const loadProviders = async () => {

    const res = await axios.get(
      "http://localhost:5000/api/providers"
    )

    setProviders(res.data)
  }

  useEffect(() => {
    loadProviders()
  }, [])

  // =========================
  // CLICK PROVIDER
  // =========================
  const handleClick = async (id) => {

    setSelected(id)

    const res = await axios.get(
      `http://localhost:5000/api/providers/${id}`
    )

    setDetails(res.data)
  }

  // =========================
  // SOCKET EVENTS
  // =========================
  useEffect(() => {

    socket.on("new-lead", () => {

      loadProviders()

      if (selected) {
        handleClick(selected)
      }
    })

    socket.on("lead-assigned", () => {

      loadProviders()

      if (selected) {
        handleClick(selected)
      }
    })

    return () => {

      socket.off("new-lead")
      socket.off("lead-assigned")
    }

  }, [selected])
return (
  <>
    <Navbar />

    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(to right, #f5f7fa, #e4ecf7)",
        p: 4,
      }}
    >

      <Typography
        variant="h4"
        fontWeight="bold"
        mb={4}
      >
        Provider Dashboard
      </Typography>

      {/* =========================
          PROVIDERS SECTION
      ========================= */}

      <Paper
        elevation={4}
        sx={{
          p: 3,
          borderRadius: 4,
          mb: 4,
        }}
      >

        <Typography
          variant="h5"
          fontWeight="bold"
          mb={3}
        >
          Providers
        </Typography>

        <Grid container spacing={2}>

          {providers.map((p) => (

            <Grid
              item
              xs={12}
              sm={6}
              md={3}
              key={p.id}
            >

              <Card
                onClick={() => handleClick(p.id)}
                sx={{
                  cursor: "pointer",
                  borderRadius: 3,
                  transition: "0.3s",

                  background:
                    selected === p.id
                      ? "#dcedc8"
                      : "#fff",

                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 6,
                  },
                }}
              >

                <CardContent>

                  <Typography
                    variant="h6"
                    fontWeight="bold"
                  >
                    {p.name}
                  </Typography>

                  <Chip
                    label={`Quota: ${p.remaining_quota}`}
                    color={
                      p.remaining_quota > 0
                        ? "success"
                        : "error"
                    }
                    sx={{
                      mt: 2,
                    }}
                  />

                </CardContent>

              </Card>

            </Grid>
          ))}

        </Grid>

      </Paper>

      {/* =========================
          PROVIDER DETAILS SECTION
      ========================= */}

      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 4,
        }}
      >

        <Typography
          variant="h5"
          fontWeight="bold"
          mb={3}
        >
          Provider Details
        </Typography>

        {!details && (

          <Typography
            variant="body1"
            color="text.secondary"
          >
            Select a provider to view details
          </Typography>
        )}

        {details && (
          <>
            {/* PROVIDER INFO */}

            <Box mb={4}>

              <Typography
                variant="h4"
                fontWeight="bold"
              >
                {details.provider.name}
              </Typography>

              <Chip
                label={`Remaining Quota: ${details.provider.remaining_quota}`}
                color={
                  details.provider.remaining_quota > 0
                    ? "primary"
                    : "error"
                }
                sx={{
                  mt: 2,
                  fontSize: "1rem",
                  p: 2,
                }}
              />

            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* LEADS */}

            <Typography
              variant="h5"
              fontWeight="bold"
              mb={3}
            >
              Assigned Leads
            </Typography>

            {details.leads.length === 0 ? (

              <Typography
                color="text.secondary"
              >
                No leads assigned
              </Typography>

            ) : (

              <Grid container spacing={2}>

                {details.leads.map((a) => (

                  <Grid
                    item
                    xs={12}
                    md={4}
                    key={a.id}
                  >

                    <Card
                      elevation={3}
                      sx={{
                        borderRadius: 3,
                        height: "100%",
                        transition: "0.3s",

                        "&:hover": {
                          boxShadow: 8,
                          transform:
                            "translateY(-2px)",
                        },
                      }}
                    >

                      <CardContent>

                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          mb={2}
                        >
                          {a.leads.customer_name}
                        </Typography>

                        <Typography mb={1}>
                          <b>Phone:</b>{" "}
                          {a.leads.phone}
                        </Typography>

                        <Typography mb={1}>
                          <b>City:</b>{" "}
                          {a.leads.city}
                        </Typography>

                        <Chip
                          label={`Service ${a.leads.service_id}`}
                          color="secondary"
                        />

                      </CardContent>

                    </Card>

                  </Grid>
                ))}

              </Grid>
            )}
          </>
        )}

      </Paper>

    </Box>
  </>
)}
export default Dashboard