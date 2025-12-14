import { useState } from "react";
import api from "../api/axios";

export default function ResetPassword() {
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");

  const reset = async () => {
    const email = sessionStorage.getItem("reset_email");

    await api.post("/api/accounts/reset-password/", {
      email,
      otp,
      new_password: newPass,
    });

    alert("Password reset successful");
    window.location.href = "/login";
  };

  return (
    <div className="p-10">
      <h1 className="text-xl">Reset Password</h1>

      <input
        className="border p-2 block my-2"
        placeholder="OTP"
        onChange={(e) => setOtp(e.target.value)}
      />

      <input
        className="border p-2 block my-2"
        placeholder="New Password"
        type="password"
        onChange={(e) => setNewPass(e.target.value)}
      />

      <button onClick={reset} className="bg-green-500 text-white px-4 py-2">
        Reset
      </button>
    </div>
  );
}
