import React, { useState, useEffect } from 'react';
import { Shield, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { USER_API } from '../../config/api';

const AdminDashboard = ({ user, token, handleLogout, setCurrentView }) => {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingDoctors();
  }, []);

  const fetchPendingDoctors = async () => {
    try {
      const response = await fetch(`${USER_API}/admin/users/?status=pending&role=doctor`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const doctors = data.filter(u => u.role === 'doctor' && u.doctor?.doctor_status === 'pending');
        setPendingDoctors(doctors);
      }
    } catch (err) {
      console.error('Failed to fetch pending doctors', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      const response = await fetch(`${USER_API}/doctor/${userId}/approve/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert('Doctor approved successfully!');
        fetchPendingDoctors();
      }
    } catch (err) {
      alert('Failed to approve doctor');
    }
  };

  const handleReject = async (userId) => {
    try {
      const response = await fetch(`${USER_API}/doctor/${userId}/reject/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert('Doctor rejected');
        fetchPendingDoctors();
      }
    } catch (err) {
      alert('Failed to reject doctor');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-purple-600" />
              <span className="text-xl font-bold text-gray-800">Mentora - Admin Panel</span>
            </div>
            <div className="flex items-center space-x-4">
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
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <p className="text-gray-600 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-blue-600">--</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <p className="text-gray-600 text-sm">Active Doctors</p>
            <p className="text-3xl font-bold text-green-600">--</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <p className="text-gray-600 text-sm">Pending Approvals</p>
            <p className="text-3xl font-bold text-yellow-600">{pendingDoctors.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <p className="text-gray-600 text-sm">Total Appointments</p>
            <p className="text-3xl font-bold text-purple-600">--</p>
          </div>
        </div>

        {/* Pending Doctor Approvals */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Pending Doctor Approvals</h2>
          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : pendingDoctors.length === 0 ? (
            <p className="text-gray-600">No pending approvals</p>
          ) : (
            <div className="space-y-4">
              {pendingDoctors.map((doctor, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{doctor.name || doctor.email}</h3>
                    <p className="text-gray-600 text-sm">{doctor.email}</p>
                    <p className="text-purple-600">{doctor.doctor?.specialization || 'Not specified'}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleApprove(doctor.user_id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(doctor.user_id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
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

export default AdminDashboard;
