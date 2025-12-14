import { useEffect, useState } from "react";
import { getProfile } from "../api/user";
import { jwtDecode } from "jwt-decode";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function UserDashboard() {
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

  if (loading) return <div className="p-10 text-center">Loading dashboard...</div>;
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={loadProfile}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return <div className="p-10 text-center">Failed to load profile. Please try again later.</div>;

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    const fields = ['name', 'gender', 'phone', 'address'];
    let filled = 0;
    
    fields.forEach(field => {
      if (profile[field] && profile[field].trim() !== '') {
        filled++;
      }
    });
    
    return Math.round((filled / fields.length) * 100);
  };

  const completionPercentage = calculateCompletion();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile.name || 'User'}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's what's happening with your account today.
          </p>
        </div>

        {/* Profile Completion Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Profile Completion</h2>
            <span className="text-lg font-medium text-blue-600">{completionPercentage}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-in-out" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          
          <p className="text-gray-600 mb-4">
            {completionPercentage < 100 
              ? "Complete your profile to unlock all features." 
              : "Your profile is complete!"}
          </p>
          
          <Link 
            to="/profile" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {completionPercentage < 100 ? "Complete Profile" : "View Profile"}
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">View Profile</h3>
            <p className="text-gray-600 mb-4">Manage your personal information and preferences.</p>
            <Link 
              to="/profile" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Go to Profile →
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Notifications</h3>
            <p className="text-gray-600 mb-4">Check your latest alerts and updates.</p>
            <Link 
              to="/notifications" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View Notifications →
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Appointments</h3>
            <p className="text-gray-600 mb-4">Schedule and manage your appointments.</p>
            <button 
              disabled 
              className="text-gray-400 font-medium cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}