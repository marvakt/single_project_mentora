import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function ProtectedRoute({ children, allowed }) {
  const token = localStorage.getItem("access");

  // 1. No token → straight to login
  if (!token) return <Navigate to="/login" />;

  let decoded;
  try {
    decoded = jwtDecode(token);
  } catch (err) {
    console.error("Invalid JWT:", err);
    localStorage.clear();
    return <Navigate to="/login" />;
  }

  const role = decoded.role;
  const exp = decoded.exp;
  const now = Math.floor(Date.now() / 1000);

  // 2. Token expired
  if (exp < now) {
    localStorage.clear();
    return <Navigate to="/login" />;
  }

  // 3. Role mismatch
  if (allowed && !allowed.includes(role)) {
    return <Navigate to="/login" />;
  }

  // 4. Passed all checks → allow entry
  return children;
}
