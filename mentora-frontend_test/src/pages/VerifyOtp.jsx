import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../api/axios";
import { toast } from "react-toastify";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (loading) return;
    
    const email = sessionStorage.getItem("temp_email");
    
    if (!email) {
      toast.error("Session expired. Please register again.");
      return;
    }
    
    if (!otp) {
      toast.error("Please enter the OTP.");
      return;
    }
    
    try {
      setLoading(true);
      
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
      const profileRes = await fetch("http://localhost:8001/api/internal/profile/create/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          email: userEmail,
          role,
        }),
      });
      
      if (!profileRes.ok) {
        throw new Error(`Profile creation failed: ${profileRes.status}`);
      }

      toast.success("Verification successful!");
      window.location.href = `/dashboard/${role}`;
    } catch (err) {
      console.error("OTP verification failed:", err);
      
      if (err.response?.status === 400) {
        toast.error("Invalid or expired OTP. Please try again.");
      } else if (err.response?.status === 404) {
        toast.error("User not found. Please register again.");
      } else {
        toast.error("Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const email = sessionStorage.getItem("temp_email");
    
    if (!email) {
      toast.error("Session expired. Please register again.");
      return;
    }
    
    try {
      await api.post("/api/accounts/resend-otp/", { email });
      toast.success("OTP resent successfully!");
    } catch (err) {
      console.error("Failed to resend OTP:", err);
      toast.error("Failed to resend OTP. Please try again.");
    }
  };

  return (
    <div className="p-10 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
      <p className="text-gray-600 mb-6">
        Enter the 6-digit code sent to your email address
      </p>
      
      <input
        className="border p-3 rounded-md w-full text-center text-xl tracking-widest mb-4"
        placeholder="0 0 0 0 0 0"
        maxLength="6"
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
        value={otp}
      />
      
      <button
        className={`w-full py-3 rounded-md font-semibold text-white mb-4 ${
          loading ? "bg-gray-400" : "bg-cyan-500 hover:bg-cyan-600"
        }`}
        onClick={handleVerify}
        disabled={loading}
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>
      
      <div className="text-center">
        <p className="text-gray-600">
          Didn't receive the code?{" "}
          <button 
            onClick={handleResend}
            className="text-cyan-500 font-medium hover:underline"
          >
            Resend OTP
          </button>
        </p>
      </div>
    </div>
  );
}