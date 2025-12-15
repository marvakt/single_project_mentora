import { useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";

export default function ResetPassword() {
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = async () => {
    if (loading) return;
    
    const email = sessionStorage.getItem("reset_email");
    
    if (!email) {
      toast.error("Session expired. Please try again.");
      return;
    }
    
    if (!otp || !newPass) {
      toast.error("Please enter both OTP and new password.");
      return;
    }
    
    if (newPass.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    
    try {
      setLoading(true);
      
      await api.post("/api/accounts/reset-password/", {
        email,
        otp,
        new_password: newPass,
      });

      toast.success("Password reset successful!");
      window.location.href = "/login";
    } catch (err) {
      console.error("Password reset failed:", err);
      
      if (err.response?.status === 400) {
        toast.error("Invalid OTP or password. Please try again.");
      } else {
        toast.error("Password reset failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
      <p className="text-gray-600 mb-6">
        Enter the code sent to your email and your new password.
      </p>

      <input
        className="border p-3 rounded-md w-full mb-4"
        placeholder="Enter OTP code"
        onChange={(e) => setOtp(e.target.value)}
        value={otp}
      />

      <input
        className="border p-3 rounded-md w-full mb-6"
        placeholder="Enter new password"
        type="password"
        onChange={(e) => setNewPass(e.target.value)}
        value={newPass}
      />

      <button 
        onClick={reset} 
        disabled={loading}
        className={`w-full py-3 rounded-md font-semibold text-white mb-4 ${
          loading ? "bg-gray-400" : "bg-cyan-500 hover:bg-cyan-600"
        }`}
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>
      
      <div className="text-center">
        <button 
          onClick={() => window.location.href = "/login"}
          className="text-cyan-500 hover:underline"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}