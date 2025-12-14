import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../../api/user";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function DoctorBasic() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    specialization: "",
    license_number: "",
    experience_years: "",
  });

  // Prefill if profile exists
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getProfile(userId);
        const profile = res.data;

        setForm({
          name: profile.name || "",
          specialization: profile.specialization || "",
          license_number: profile.license_number || "",
          experience_years: profile.experience_years || "",
        });
      } catch (err) {
        console.log("No existing profile");
      }
    };

    loadProfile();
  }, [userId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await updateProfile(userId, {
        ...form,
        onboarding_status: 50,
      });

      localStorage.setItem("onboarding_status", 50);

      toast.success("Basic info saved!");
      navigate(`/onboarding/doctor/docs/${userId}`);
    } catch (err) {
      toast.error("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 bg-white rounded-xl shadow-xl p-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Doctor Onboarding — Basic Info
      </h1>

      <p className="text-gray-500 mb-8">
        Please provide your professional details to get started.
      </p>

      {/* Form Fields */}
      <div className="space-y-6">
        <InputField
          label="Full Name"
          name="name"
          value={form.name}
          onChange={handleChange}
        />

        <InputField
          label="Specialization"
          name="specialization"
          value={form.specialization}
          onChange={handleChange}
        />

        <InputField
          label="License Number"
          name="license_number"
          value={form.license_number}
          onChange={handleChange}
        />

        <InputField
          label="Years of Experience"
          name="experience_years"
          type="number"
          value={form.experience_years}
          onChange={handleChange}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-10 w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary-dark transition"
      >
        {loading ? "Saving..." : "Save & Continue →"}
      </button>
    </div>
  );
}

/* ------------------------------
   Extracted Input Component
--------------------------------*/
function InputField({ label, name, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block text-lg font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
      />
    </div>
  );
}