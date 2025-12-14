import { useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (loading) return;
    
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    
    try {
      setLoading(true);
      await api.post("/api/accounts/forgot-password/", { email });
      sessionStorage.setItem("reset_email", email);
      toast.success("OTP sent successfully! Check your email.");
      window.location.href = "/reset-password";
    } catch (err) {
      console.error("Failed to send OTP:", err);
      
      if (err.response?.status === 404) {
        toast.error("Email not found. Please check your email address.");
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
      <p className="text-gray-600 mb-6">
        Enter your email address and we'll send you a code to reset your password.
      </p>

      <input
        className="border p-3 rounded-md w-full mb-4"
        placeholder="Enter your email"
        onChange={(e) => setEmail(e.target.value)}
        value={email}
      />

      <button 
        onClick={sendOtp} 
        disabled={loading}
        className={`w-full py-3 rounded-md font-semibold text-white ${
          loading ? "bg-gray-400" : "bg-cyan-500 hover:bg-cyan-600"
        }`}
      >
        {loading ? "Sending..." : "Send Reset Code"}
      </button>
      
      <div className="text-center mt-4">
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