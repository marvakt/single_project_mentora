import { useState } from "react";
import api from "../api/axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const sendOtp = async () => {
    await api.post("/api/accounts/forgot-password/", { email });
    sessionStorage.setItem("reset_email", email);
    window.location.href = "/reset-password";
  };

  return (
    <div className="p-10">
      <h1 className="text-xl">Forgot Password</h1>

      <input
        className="border p-2 block my-2"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={sendOtp} className="bg-blue-500 text-white px-4 py-2">
        Send OTP
      </button>
    </div>
  );
}
