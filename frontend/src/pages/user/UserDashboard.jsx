
import React, { useState, useEffect } from 'react';
import { Heart, Calendar, Clock, Bell, User, LogOut } from 'lucide-react';
import { USER_API } from '../../config/api'

const UserDashboard = ({ user, token, handleLogout, setCurrentView }) => {
  const [profile, setProfile] = useState(null);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchDoctors();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${USER_API}/profile/${user.user_id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${USER_API}/doctors/`);
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      }
    } catch (err) {
      console.error('Failed to fetch doctors', err);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Heart className="w-8 h-8 text-purple-600" />
              <span className="text-xl font-bold text-gray-800">Mentora</span>
            </div>
            <div className="flex items-center space-x-4">
              <Bell className="w-6 h-6 text-gray-600 cursor-pointer hover:text-purple-600" />
              <button 
                onClick={() => setCurrentView('user-profile')} 
                className="flex items-center space-x-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
              >
                <User className="w-5 h-5" />
                <span className="hidden md:inline">{profile?.name || 'Profile'}</span>
              </button>
              <button 
                onClick={handleLogout} 
                className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.name || 'User'}!</h1>
          <p className="text-purple-100">Continue your wellness journey with Mentora</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Sessions</p>
                <p className="text-3xl font-bold text-purple-600">0</p>
              </div>
              <Calendar className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Mood Score</p>
                <p className="text-3xl font-bold text-green-600">--</p>
              </div>
              <Heart className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Next Appointment</p>
                <p className="text-lg font-bold text-gray-800">No upcoming</p>
              </div>
              <Clock className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Available Doctors */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Available Doctors</h2>
          {doctors.length === 0 ? (
            <p className="text-gray-600">No doctors available at the moment.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {doctors.map((doctor, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <h3 className="font-bold text-lg text-gray-800">{doctor.name}</h3>
                  <p className="text-purple-600">{doctor.specialization}</p>
                  <p className="text-gray-600 text-sm mt-2">{doctor.experience} years experience</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-green-600 font-semibold">₹{doctor.consultation_fee}</span>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;