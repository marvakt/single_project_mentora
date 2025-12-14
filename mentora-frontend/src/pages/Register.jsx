import { useState } from "react";
import AuthLayout from "./AuthLayout";
import api from "../api/axios";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const register = async () => {
    if (loading) return;

    setError("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/accounts/register/", {
        email: form.email,
        password: form.password,
        role: "user",
        full_name: form.name,
      });

      sessionStorage.setItem("temp_email", form.email);

      window.location.href = "/verify-otp";

    } catch (e) {
      console.error(e);

      if (e.response?.data?.detail) {
        setError(e.response.data.detail);
      } else {
        setError("Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-3xl font-bold mb-2">Begin Your Journey</h1>
      <p className="text-gray-500 mb-6">Create an account to start with Mentora.</p>

      <div className="flex w-full mb-6 bg-gray-100 rounded-md overflow-hidden">
        <button className="w-1/2 py-2 bg-white font-medium border-r">
          Register
        </button>
        <button
          onClick={() => (window.location.href = "/login")}
          className="w-1/2 py-2 text-gray-500"
        >
          Login
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* NAME */}
      <label className="text-sm font-medium">Name</label>
      <input
        type="text"
        placeholder="Enter your full name"
        className="border p-3 rounded-md w-full mb-4"
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

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
      <div className="relative mb-6">
        <input
          type="password"
          placeholder="Enter your password"
          className="border p-3 rounded-md w-full"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </div>

      <button
        onClick={register}
        disabled={loading}
        className={`w-full py-3 rounded-md font-semibold mb-6 text-white 
          ${loading ? "bg-gray-400" : "bg-cyan-400"}`}
      >
        {loading ? "Creating..." : "Create Account"}
      </button>
    </AuthLayout>
  );
}
