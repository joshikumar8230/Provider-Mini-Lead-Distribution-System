import { BrowserRouter,Routes, Route } from "react-router-dom"
import App from './App.jsx'
import Dashboard from "./Dashboard.jsx"
import Testtools from "./Testtools.jsx"

function Routers() {
  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/dashboard" element={<Dashboard />} />
         <Route path="/Testtools" element={<Testtools />} />
      </Routes>
      </BrowserRouter>
    </>
  )
}

export default Routers