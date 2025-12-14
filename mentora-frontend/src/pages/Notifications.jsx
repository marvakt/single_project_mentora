import { useEffect, useState } from "react";
import { getNotifications } from "../api/user";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
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

      // Fetch notifications from USER SERVICE
      const res = await getNotifications(userId);
      setNotifications(res.data);
      setError(null);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      
      // Handle different error types
      if (err.response?.status === 403) {
        setError("Access denied. Please log in again.");
        toast.error("Access denied. Please log in again.");
      } else if (err.response?.status === 404) {
        setError("Notifications service temporarily unavailable.");
        toast.error("Notifications service temporarily unavailable.");
      } else if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        toast.error("Session expired. Please log in again.");
      } else {
        setError("Failed to load notifications. Please try again.");
        toast.error("Failed to load notifications. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) return <div className="p-10 text-center">Loading notifications...</div>;
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Notifications</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={loadNotifications}
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
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="mt-1 text-sm text-gray-500">
              Your alerts and system notifications
            </p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You don't have any notifications yet.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start">
                    <div className="shrink-0 pt-1">
                      {notification.type === "approval" ? (
                        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium ${notification.is_read ? 'text-gray-900' : 'text-gray-900 font-semibold'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        <p>{notification.message}</p>
                      </div>
                      {!notification.is_read && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            New
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}