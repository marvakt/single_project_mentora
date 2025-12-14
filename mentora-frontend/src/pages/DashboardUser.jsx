import { useEffect, useState } from "react";
import { getProfile } from "../api/user";
import {jwtDecode} from "jwt-decode";
import { toast } from "react-toastify";

export default function DashboardUser() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
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

      // Fetch profile from USER SERVICE
      const res = await getProfile(userId);
      setProfile(res.data);
      setError(null);

    } catch (err) {
      console.error("Failed to load profile:", err);
      
      // Handle different error types
      if (err.response?.status === 403) {
        setError("Access denied. Please log in again.");
        toast.error("Access denied. Please log in again.");
      } else if (err.response?.status === 404) {
        setError("Profile service temporarily unavailable.");
        toast.error("Profile service temporarily unavailable.");
      } else if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        toast.error("Session expired. Please log in again.");
      } else {
        setError("Failed to load profile. Please try again.");
        toast.error("Failed to load profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading profile...</p>;
  
  if (error) {
    return (
      <div className="p-10">
        <h1 className="text-3xl font-bold">User Dashboard</h1>
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={loadProfile}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return <p>No profile data available</p>;

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">User Dashboard</h1>

      {/* SHOW EMAIL */}
      <p className="mt-4 text-lg">
        <strong>Email:</strong> {profile.email}
      </p>

      {/* SHOW NAME (if present) */}
      <p className="mt-2 text-lg">
        <strong>Name:</strong> {profile.name || "Not set"}
      </p>
    </div>
  );
}
