import axios from "axios"
import { useState } from "react"

import Navbar from "./Navbar"

import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Card,
  CardContent,
} from "@mui/material"

import AutorenewIcon from "@mui/icons-material/Autorenew"
import BoltIcon from "@mui/icons-material/Bolt"
import RefreshIcon from "@mui/icons-material/Refresh"

function Testtools() {

  const [message, setMessage] = useState("")

  const [loading, setLoading] = useState(false)

  // =========================
  // RESET QUOTA
  // =========================
  const resetQuota = async () => {

    try {

      setLoading(true)

      const eventId =
        "reset-" + Date.now()

      const res = await axios.post(
        "http://localhost:5000/api/webhook/reset-quota",
        {
          eventId,
        }
      )

      setMessage(
        res.data.message
      )

    } catch (err) {

      setMessage(
        err.response?.data?.error ||
        err.message
      )

    } finally {

      setLoading(false)
    }
  }

  // =========================
  // WEBHOOK IDEMPOTENCY TEST
  // =========================
  const spamWebhook = async () => {

    try {

      setLoading(true)

      // SAME EVENT ID
      const eventId =
        "spam-reset-001"

      const results = []

      for (let i = 0; i < 5; i++) {

        const res = await axios.post(
          "http://localhost:5000/api/webhook/reset-quota",
          {
            eventId,
          }
        )

        results.push(
          `Call ${i + 1}: ${res.data.message}`
        )
      }

      setMessage(
        results.join(" | ")
      )

    } catch (err) {

      setMessage(
        err.response?.data?.error ||
        err.message
      )

    } finally {

      setLoading(false)
    }
  }

  // =========================
  // GENERATE LEADS
  // =========================
  const generateLeads = async () => {

    try {

      setLoading(true)

      const res = await axios.post(
        "http://localhost:5000/api/test/generate-leads"
      )

      setMessage(
`
Generated: ${res.data.successCount}
Failed: ${res.data.failedCount}
`
      )

      console.log(
        res.data.results
      )

    } catch (err) {

      setMessage(
        err.response?.data?.error ||
        err.message
      )

    } finally {

      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />

      <Box
        sx={{
          minHeight: "100vh",
          background:
            "linear-gradient(to right, #eef2f3, #dfe9f3)",
          p: 4,
        }}
      >

        <Typography
          variant="h4"
          fontWeight="bold"
          mb={1}
        >
          Testing Panel
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          mb={4}
        >
          Simulate webhook events and
          concurrency testing.
        </Typography>

        <Stack
          spacing={3}
          maxWidth={700}
        >

          {/* RESET QUOTA */}

          <Card
            elevation={4}
            sx={{
              borderRadius: 4,
            }}
          >

            <CardContent>

              <Typography
                variant="h6"
                fontWeight="bold"
                mb={1}
              >
                Reset Provider Quota
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                mb={3}
              >
                Simulate successful payment
                webhook to reset provider
                quota to 10.
              </Typography>

              <Button
                variant="contained"
                startIcon={
                  <RefreshIcon />
                }
                onClick={resetQuota}
                disabled={loading}
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1.2,
                  textTransform: "none",
                }}
              >
                Reset Quota
              </Button>

            </CardContent>

          </Card>

          {/* WEBHOOK SPAM */}

          <Card
            elevation={4}
            sx={{
              borderRadius: 4,
            }}
          >

            <CardContent>

              <Typography
                variant="h6"
                fontWeight="bold"
                mb={1}
              >
                Webhook Idempotency Test
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                mb={3}
              >
                Call the same webhook event
                multiple times to ensure
                duplicate events are ignored.
              </Typography>

              <Button
                variant="contained"
                color="secondary"
                startIcon={
                  <AutorenewIcon />
                }
                onClick={spamWebhook}
                disabled={loading}
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1.2,
                  textTransform: "none",
                }}
              >
                Spam Webhook
              </Button>

            </CardContent>

          </Card>

          {/* GENERATE LEADS */}

          <Card
            elevation={4}
            sx={{
              borderRadius: 4,
            }}
          >

            <CardContent>

              <Typography
                variant="h6"
                fontWeight="bold"
                mb={1}
              >
                Concurrency Test
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                mb={3}
              >
                Generate 10 simultaneous
                leads to test race conditions
                and provider allocation logic.
              </Typography>

              <Button
                variant="contained"
                color="success"
                startIcon={
                  <BoltIcon />
                }
                onClick={generateLeads}
                disabled={loading}
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1.2,
                  textTransform: "none",
                }}
              >
                Generate 10 Leads
              </Button>

            </CardContent>

          </Card>

          {/* LOADING */}

          {loading && (

            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >

              <CircularProgress
                size={28}
              />

              <Typography>
                Processing request...
              </Typography>

            </Paper>
          )}

          {/* MESSAGE */}

          {message && (

            <Alert
              severity="info"
              sx={{
                borderRadius: 3,
                whiteSpace: "pre-line",
                fontSize: "1rem",
              }}
            >
              {message}
            </Alert>
          )}

        </Stack>

      </Box>
    </>
  )
}

export default Testtools