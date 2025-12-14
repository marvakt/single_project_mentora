import { useEffect, useState } from "react";
import { getProfile } from "../api/user";
import {jwtDecode} from "jwt-decode";

export default function DashboardUser() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = sessionStorage.getItem("access");
      if (!token) {
        console.error("No JWT token found");
        return;
      }

      // Decode JWT
      const decoded = jwtDecode(token);
      const userId = decoded.user_id;

      // Fetch profile from USER SERVICE
      const res = await getProfile(userId);
      setProfile(res.data);

    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };

  if (!profile) return <p>Loading profile...</p>;

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
