import React, { useState, useEffect } from 'react';
import { Heart, Calendar, Users, CheckCircle, DollarSign, Bell, User, LogOut } from 'lucide-react';
import { USER_API } from '../../config/api';

const DoctorDashboard = ({ user, token, handleLogout, setCurrentView }) => {
  const [profile, setProfile] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${USER_API}/profile/${user.user_id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setDoctorProfile(data.doctor);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
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
              <span className="text-xl font-bold text-gray-800">Mentora - Doctor Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <Bell className="w-6 h-6 text-gray-600 cursor-pointer hover:text-purple-600" />
              <button 
                onClick={() => setCurrentView('doctor-profile')} 
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
        {/* Status Alert */}
        {doctorProfile?.doctor_status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-xl mb-8">
            <p className="font-semibold">⏳ Your account is pending admin approval</p>
            <p className="text-sm mt-1">Please complete your profile while waiting for verification.</p>
          </div>
        )}

        {doctorProfile?.doctor_status === 'approved' && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl mb-8">
            <p className="font-semibold">✅ Your account has been approved!</p>
            <p className="text-sm mt-1">You can now start accepting appointments.</p>
          </div>
        )}

        {doctorProfile?.doctor_status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl mb-8">
            <p className="font-semibold">❌ Your account was rejected</p>
            <p className="text-sm mt-1">Please contact support for more information.</p>
          </div>
        )}

        {/* Welcome Section */}
        <div className="bg-linear-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, Dr. {profile?.name || 'Doctor'}!</h1>
          <p className="text-purple-100">Manage your appointments and patients</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today's Appointments</p>
                <p className="text-3xl font-bold text-purple-600">0</p>
              </div>
              <Calendar className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Patients</p>
                <p className="text-3xl font-bold text-blue-600">0</p>
              </div>
              <Users className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed Sessions</p>
                <p className="text-3xl font-bold text-green-600">0</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Earnings</p>
                <p className="text-3xl font-bold text-orange-600">₹0</p>
              </div>
              <DollarSign className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Upcoming Appointments</h2>
          <p className="text-gray-600">No appointments scheduled yet.</p>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;

