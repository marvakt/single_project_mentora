// src/pages/onboarding/UserOnboarding.jsx
import { useState } from "react";
import { updateProfile } from "../../api/user";
import { useParams, useNavigate } from "react-router-dom";

export default function UserOnboarding() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    gender: "",
    address: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    await updateProfile(userId, {
      ...form,
      onboarding_status: 100
    });
    localStorage.setItem("onboarding_status", 100);
    navigate("/dashboard");
  };

  return (
    <div className="max-w-lg mx-auto p-6 mt-10 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Complete Your Profile</h1>

      <input name="name" onChange={handleChange} placeholder="Full Name"
        className="input" />
      <input name="phone" onChange={handleChange} placeholder="Phone"
        className="input mt-3" />
      <input name="gender" onChange={handleChange} placeholder="Gender"
        className="input mt-3" />
      <textarea name="address" onChange={handleChange} placeholder="Address"
        className="input mt-3" />

      <button onClick={handleSubmit}
        className="btn-primary mt-5">Save & Continue</button>
    </div>
  );
}