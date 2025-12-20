import { useEffect, useState } from "react";
import { listAvailability, addAvailability, deleteAvailability } from "../api/user";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";

export default function DoctorAvailability() {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [newSlot, setNewSlot] = useState({
    day_of_week: "",
    start_time: "",
    end_time: "",
    timezone: "UTC"
  });

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const token = sessionStorage.getItem("access");
      if (!token) {
        console.error("No JWT token found");
        setError("Authentication required");
        setLoading(false);
        return;
      }

      // Decode JWT
      const decoded = jwtDecode(token);
      const userId = decoded.user_id;

      // Fetch availability from USER SERVICE
      const res = await listAvailability(userId);
      setAvailability(res.data);
      setError(null);
    } catch (err) {
      console.error("Failed to load availability:", err);
      
      // Handle different error types
      if (err.response?.status === 403) {
        setError("Access denied. Please log in again.");
        toast.error("Access denied. Please log in again.");
      } else if (err.response?.status === 404) {
        setError("Availability service temporarily unavailable.");
        toast.error("Availability service temporarily unavailable.");
      } else if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        toast.error("Session expired. Please log in again.");
      } else {
        setError("Failed to load availability slots. Please try again.");
        toast.error("Failed to load availability slots. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSlot(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = sessionStorage.getItem("access");
      const decoded = jwtDecode(token);
      const userId = decoded.user_id;
      
      // Validate inputs
      if (!newSlot.day_of_week || !newSlot.start_time || !newSlot.end_time) {
        toast.error("Please fill all fields");
        setSaving(false);
        return;
      }
      
      // Add new availability slot
      const slotData = {
        ...newSlot,
        day_of_week: parseInt(newSlot.day_of_week, 10)
      };
      await addAvailability(userId, slotData);
      toast.success("Availability slot added successfully!");
      
      // Reset form and reload data
      setNewSlot({
        day_of_week: "",
        start_time: "",
        end_time: ""
      });
      
      loadAvailability();
    } catch (err) {
      console.error("Failed to add availability slot:", err);
      
      // Handle different error types
      if (err.response?.status === 403) {
        toast.error("Access denied. Please log in again.");
      } else if (err.response?.status === 404) {
        toast.error("Availability service temporarily unavailable.");
      } else if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error("Failed to add availability slot. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await deleteAvailability(slotId);
      toast.success("Availability slot deleted!");
      loadAvailability();
    } catch (err) {
      console.error("Failed to delete availability slot:", err);
      
      // Handle different error types
      if (err.response?.status === 403) {
        toast.error("Access denied. Please log in again.");
      } else if (err.response?.status === 404) {
        toast.error("Availability service temporarily unavailable.");
      } else if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else {
        toast.error("Failed to delete availability slot. Please try again.");
      }
    }
  };

  const getDayName = (dayIndex) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayIndex] || "";
  };

  const formatTime = (timeString) => {
    // Convert "HH:MM:SS" to "HH:MM AM/PM"
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  if (loading) return <div className="p-10 text-center">Loading availability...</div>;
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Availability</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={loadAvailability}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Availability</h1>
          <p className="mt-2 text-gray-600">
            Set your weekly availability for patient appointments
          </p>
        </div>
        
        {/* Add New Slot Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Time Slot</h2>
          
          <form onSubmit={handleAddSlot} className="grid grid-cols-1 gap-y-4 sm:grid-cols-12 sm:gap-x-6">
            <div className="sm:col-span-4">
              <label htmlFor="day_of_week" className="block text-sm font-medium text-gray-700">
                Day of Week
              </label>
              <select
                id="day_of_week"
                name="day_of_week"
                value={newSlot.day_of_week}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Select a day</option>
                <option value="0">Sunday</option>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
              </select>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                Start Time
              </label>
              <input
                type="time"
                name="start_time"
                id="start_time"
                value={newSlot.start_time}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
              />
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
                End Time
              </label>
              <input
                type="time"
                name="end_time"
                id="end_time"
                value={newSlot.end_time}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
              />
            </div>
            
            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add Slot"}
              </button>
            </div>
          </form>
        </div>
        
        {/* Availability List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Current Availability</h2>
            <p className="mt-1 text-sm text-gray-500">
              Your scheduled time slots for patient appointments
            </p>
          </div>
          
          {availability.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No availability slots</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first availability slot.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {availability.map((slot) => (
                <li key={slot.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-800 font-medium">
                          {getDayName(slot.day_of_week).substring(0, 1)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">
                          {getDayName(slot.day_of_week)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}