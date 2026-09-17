import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { EventDetail } from "./pages/EventDetail";
import { MyBookings } from "./pages/MyBookings";
import { CreateEvent } from "./pages/CreateEvent";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-event"
            element={
              <ProtectedRoute roles={["organizer", "admin"]}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
}
