import { useState } from "react";
import { jwtDecode } from "jwt-decode";  // ← FIXED
import api from "../api/axios";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");

  const handleVerify = async () => {
    const email = sessionStorage.getItem("temp_email");

    const res = await api.post("/api/accounts/verify-otp/", {
      email,
      otp,
    });

    const access = res.data.access;
    sessionStorage.setItem("access", access);
    sessionStorage.setItem("refresh", res.data.refresh);

    // Decode user info
    const payload = jwtDecode(access);
    const userId = payload.user_id;
    const userEmail = payload.email;
    const role = payload.role;

    // Create profile in user-service
    await fetch("http://localhost:8001/api/internal/profile/create/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        email: userEmail,
        role,
      }),
    });

    window.location.href = `/dashboard/${role}`;
  };

  return (
    <div className="p-10">
      <h1 className="text-xl font-bold">Verify OTP</h1>
      <input
        className="border p-2 block my-2"
        placeholder="OTP"
        onChange={(e) => setOtp(e.target.value)}
      />
      <button
        className="bg-green-500 text-white px-4 py-2"
        onClick={handleVerify}
      >
        Verify
      </button>
    </div>
  );
}
