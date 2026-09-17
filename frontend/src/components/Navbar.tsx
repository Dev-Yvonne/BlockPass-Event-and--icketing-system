import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        BlockPass
      </Link>
      <nav>
        <Link to="/">Events</Link>
        {user && <Link to="/my-bookings">My Bookings</Link>}
        {user && (user.role === "organizer" || user.role === "admin") && (
          <Link to="/create-event">Create Event</Link>
        )}
        {user ? (
          <button onClick={handleLogout}>Logout ({user.name})</button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}
