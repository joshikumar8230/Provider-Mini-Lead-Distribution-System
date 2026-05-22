import { Link } from "react-router-dom"

function Navbar() {
  return (
    <nav style={styles.nav}>
      <h3>My App</h3>

      <div style={styles.links}>
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
         <Link to="/Testtools">Test tools</Link>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 20px",
    background: "#222",
    color: "white",
  },
  links: {
    display: "flex",
    gap: "15px",
  },
}

export default Navbar