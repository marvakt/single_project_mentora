import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAppointment } from "../api/appointment";
import { toast } from "react-toastify";
import { Calendar, Clock } from "lucide-react";

export default function CreateAppointment() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    doctor_id: "",
    scheduled_at: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      if (!form.doctor_id || !form.scheduled_at) {
        toast.error("Please fill all fields");
        setLoading(false);
        return;
      }

      // Validate scheduled_at is in the future
      const selectedDate = new Date(form.scheduled_at);
      if (selectedDate <= new Date()) {
        toast.error("Appointment must be scheduled in the future");
        setLoading(false);
        return;
      }

      const res = await createAppointment({
        doctor_id: form.doctor_id,
        scheduled_at: form.scheduled_at,
      });

      toast.success("Appointment created successfully!");
      
      // Navigate to payment step
      navigate(`/appointments/${res.data.appointment_id}/payment`);
    } catch (err) {
      console.error("Failed to create appointment:", err);
      
      // Handle different error types
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        sessionStorage.clear();
        navigate("/login");
      } else if (err.response?.status === 400) {
        const errorMsg = err.response.data?.error || "Invalid request. Please check your inputs.";
        toast.error(errorMsg);
      } else if (err.response?.status === 422) {
        const errors = err.response.data;
        const errorMsg = Object.values(errors).flat().join(", ") || "Validation error";
        toast.error(errorMsg);
      } else {
        toast.error("Failed to create appointment. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Appointment</h1>
          <p className="text-gray-600 mb-6">
            Schedule an appointment with your doctor
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Doctor ID */}
            <div>
              <label htmlFor="doctor_id" className="block text-sm font-medium text-gray-700 mb-2">
                Doctor ID
              </label>
              <input
                type="text"
                id="doctor_id"
                placeholder="Enter doctor ID"
                className="border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.doctor_id}
                onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                required
              />
            </div>

            {/* Scheduled Date/Time */}
            <div>
              <label htmlFor="scheduled_at" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Appointment Date & Time
                </div>
              </label>
              <input
                type="datetime-local"
                id="scheduled_at"
                className="border p-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Select a date and time for your appointment
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Appointment"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

