import { useState } from "react"
import axios from "axios"

import Navbar from "./Navbar"

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material"

function App() {

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    city: "",
    serviceId: "",
    description: "",
  })

  const [loading, setLoading] = useState(false)

  const [message, setMessage] = useState("")

  const [error, setError] = useState("")

  function handleChange(e) {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const validateForm = () => {

   
    const nameRegex = /^[A-Za-z ]+$/

    if (!nameRegex.test(formData.customerName.trim())) {
      return "Name should contain only letters"
    }

    const cityRegex = /^[A-Za-z ]+$/

    if (!cityRegex.test(formData.city.trim())) {
      return "City should contain only letters"
    }

    const phoneRegex = /^[0-9]{10}$/

    if (!phoneRegex.test(formData.phone)) {
      return "Phone number must be exactly 10 digits"
    }

    return null
  }

  async function handleSubmit(e) {

    e.preventDefault()

    setLoading(true)

    setMessage("")

    setError("")


    const validationError = validateForm()

    if (validationError) {

      setError(validationError)

      setLoading(false)

      return
    }

    try {

      const response = await axios.post(
        "https://provider-mini-lead-distribution-system.onrender.com/api/leads/create",
        formData
      )

      console.log(response.data)

      setMessage(
        "Lead submitted successfully!"
      )

      setFormData({
        customerName: "",
        phone: "",
        city: "",
        serviceId: "",
        description: "",
      })

    } catch (err) {

      setError(
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
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 3,
        }}
      >

        <Paper
          elevation={6}
          sx={{
            width: "100%",
            maxWidth: 600,
            p: 5,
            borderRadius: 5,
          }}
        >

          <Typography
            variant="h4"
            fontWeight="bold"
            mb={1}
          >
            Request Service
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            mb={4}
          >
            Submit your service request and get
            connected with providers instantly.
          </Typography>


          {message && (
            <Alert
              severity="success"
              sx={{ mb: 3 }}
            >
              {message}
            </Alert>
          )}

     

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
            >
              {error}
            </Alert>
          )}

        

          <form onSubmit={handleSubmit}>

            <TextField
              fullWidth
              label="Customer Name"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              margin="normal"
              required
            />

            <TextField
              select
              fullWidth
              label="Select Service"
              name="serviceId"
              value={formData.serviceId}
              onChange={handleChange}
              margin="normal"
              required
            >
              <MenuItem value="1">
                Service 1
              </MenuItem>

              <MenuItem value="2">
                Service 2
              </MenuItem>

              <MenuItem value="3">
                Service 3
              </MenuItem>
            </TextField>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: 3,
                fontSize: "1rem",
                textTransform: "none",
              }}
            >

              {loading ? (
                <CircularProgress
                  size={24}
                  color="inherit"
                />
              ) : (
                "Submit Request"
              )}

            </Button>

          </form>

        </Paper>

      </Box>
    </>
  )
}

export default App