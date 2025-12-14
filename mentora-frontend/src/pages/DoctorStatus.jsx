import { useEffect, useState } from "react";
import { getProfile } from "../api/user";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function DoctorStatus() {
  const navigate = useNavigate();
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

  const getStatusMessage = () => {
    if (!profile) return "";
    
    switch (profile.onboarding_status) {
      case 0:
        return "Your application has not been submitted yet.";
      case 50:
        return "Your profile information has been saved. Please complete document upload.";
      case 80:
        return "Your application is under review. Please wait for admin approval.";
      case 100:
        return "Your application has been approved! You can now access the full doctor dashboard.";
      default:
        return "Unknown status.";
    }
  };

  const getStatusColor = () => {
    if (!profile) return "";
    
    switch (profile.onboarding_status) {
      case 0:
        return "bg-yellow-100 text-yellow-800";
      case 50:
        return "bg-yellow-100 text-yellow-800";
      case 80:
        return "bg-blue-100 text-blue-800";
      case 100:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getNextStep = () => {
    if (!profile) return "";
    
    switch (profile.onboarding_status) {
      case 0:
        return "Complete your profile information";
      case 50:
        return "Upload required documents";
      case 80:
        return "Wait for admin approval";
      case 100:
        return "Access your dashboard";
      default:
        return "";
    }
  };

  const handleAction = () => {
    if (!profile) return;
    
    switch (profile.onboarding_status) {
      case 0:
        navigate(`/onboarding/doctor/basic/${profile.user_id}`);
        break;
      case 50:
        navigate(`/onboarding/doctor/docs/${profile.user_id}`);
        break;
      case 80:
        // Already waiting for approval
        break;
      case 100:
        navigate("/dashboard/doctor");
        break;
      default:
        break;
    }
  };

  if (loading) return <div className="p-10 text-center">Loading status...</div>;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Status</h2>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Doctor Application Status</h1>
          <p className="mt-2 text-gray-600">
            Track the progress of your doctor account application
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex justify-center mb-6">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor()}`}>
                {profile.onboarding_status === 100 ? (
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : profile.onboarding_status === 80 ? (
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {profile.onboarding_status === 0 && "Not Started"}
                {profile.onboarding_status === 50 && "Profile Completed"}
                {profile.onboarding_status === 80 && "Under Review"}
                {profile.onboarding_status === 100 && "Approved"}
              </div>
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Status</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                {getStatusMessage()}
              </p>
            </div>
            
            {profile.onboarding_status < 100 && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Next Steps</h3>
                <p className="text-gray-600 mb-4">
                  {getNextStep()}
                </p>
                {profile.onboarding_status < 100 && (
                  <button
                    onClick={handleAction}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {profile.onboarding_status === 0 && "Complete Profile"}
                    {profile.onboarding_status === 50 && "Upload Documents"}
                    {profile.onboarding_status === 80 && "View Dashboard"}
                    {profile.onboarding_status === 100 && "Go to Dashboard"}
                  </button>
                )}
              </div>
            )}
            
            {profile.onboarding_status === 100 && (
              <div className="text-center">
                <button
                  onClick={() => navigate("/dashboard/doctor")}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Access Doctor Dashboard
                  <svg className="ml-2 -mr-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            )}
            
            <div className="mt-10 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Application Progress</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${profile.onboarding_status >= 0 ? 'bg-blue-600' : 'bg-gray-200'}`}>
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${profile.onboarding_status >= 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                      Profile Information
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${profile.onboarding_status >= 50 ? 'bg-blue-600' : 'bg-gray-200'}`}>
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${profile.onboarding_status >= 50 ? 'text-blue-600' : 'text-gray-500'}`}>
                      Document Upload
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${profile.onboarding_status >= 80 ? 'bg-blue-600' : 'bg-gray-200'}`}>
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${profile.onboarding_status >= 80 ? 'text-blue-600' : 'text-gray-500'}`}>
                      Admin Review
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${profile.onboarding_status >= 100 ? 'bg-blue-600' : 'bg-gray-200'}`}>
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${profile.onboarding_status >= 100 ? 'text-blue-600' : 'text-gray-500'}`}>
                      Approved
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}