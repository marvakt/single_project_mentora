import { useState } from "react";
import AuthLayout from "./AuthLayout";
import api from "../api/axios";
import { toast } from "react-toastify";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const login = async () => {
    try {
      const res = await api.post("/api/accounts/login/", form);
      toast.success("Login success!");

      // Save tokens
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      // redirect based on role
      const payload = JSON.parse(atob(res.data.access.split(".")[1]));
      if (payload.role === "user") window.location.href = "/dashboard/user";
      if (payload.role === "doctor") window.location.href = "/dashboard/doctor";
      if (payload.role === "admin") window.location.href = "/dashboard/admin";
    } catch (e) {
      toast.error("Invalid credentials.");
    }
  };

  return (
    <AuthLayout>
      {/* Title */}
      <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
      <p className="text-gray-500 mb-6">
        Login to continue your journey with Mentora.
      </p>

      {/* Register / Login Toggle */}
      <div className="flex w-full mb-6 bg-gray-100 rounded-md overflow-hidden">
        <button
          onClick={() => (window.location.href = "/register")}
          className="w-1/2 py-2 text-gray-500 border-r"
        >
          Register
        </button>
        <button className="w-1/2 py-2 bg-white font-medium">Login</button>
      </div>

      {/* EMAIL */}
      <label className="text-sm font-medium">Email Address</label>
      <input
        type="email"
        placeholder="you@example.com"
        className="border p-3 rounded-md w-full mb-4"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      {/* PASSWORD */}
      <label className="text-sm font-medium">Password</label>
      <div className="relative mb-2">
        <input
          type="password"
          placeholder="Enter your password"
          className="border p-3 rounded-md w-full"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <span className="absolute right-3 top-3 text-gray-400 cursor-pointer">
          👁️
        </span>
      </div>

      {/* Forgot Password */}
      <p
        className="text-right text-sm text-cyan-400 cursor-pointer mb-6"
        onClick={() => (window.location.href = "/forgot-password")}
      >
        Forgot Password?
      </p>

      {/* BUTTON */}
      <button
        onClick={login}
        className="w-full bg-cyan-400 text-white py-3 rounded-md font-semibold mb-6"
      >
        Login
      </button>

      {/* Divider */}
      <div className="flex items-center my-4">
        <div className="flex-1 h-px bg-gray-300"></div>
        <span className="px-3 text-gray-400 text-sm">OR</span>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>

      {/* GOOGLE BUTTON */}
      <button
        className="w-full border py-3 rounded-md flex items-center justify-center gap-3"
        onClick={() => toast.info("Google Login Coming Soon")}
      >
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
          alt="google"
          className="w-5 h-5"
        />
        Continue with Google
      </button>
    </AuthLayout>
  );
}