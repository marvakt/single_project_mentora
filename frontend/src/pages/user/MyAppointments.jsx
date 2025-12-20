
// ------------------------------
// 3. src/pages/user/MyAppointments.jsx
// ------------------------------
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, ArrowLeft, XCircle, CheckCircle } from 'lucide-react';
import { APPOINTMENT_API, apiCall } from '../../config/api';

const MyAppointments = ({ user, token, setCurrentView }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await apiCall(`${APPOINTMENT_API}/appointments/`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      const response = await apiCall(
        `${APPOINTMENT_API}/appointments/${appointmentId}/cancel/`,
        { method: 'POST' }
      );

      if (response.ok) {
        alert('Appointment cancelled successfully');
        fetchAppointments();
      } else {
        alert('Failed to cancel appointment');
      }
    } catch (err) {
      console.error('Cancel error:', err);
      alert('Something went wrong');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button 
            onClick={() => setCurrentView('user-dashboard')}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">My Appointments</h2>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No appointments yet</p>
            <button 
              onClick={() => setCurrentView('book-appointment')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Book Your First Appointment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div key={apt.id} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                      D
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">Doctor ID: {apt.doctor_id}</h3>
                      <p className="text-gray-600 text-sm">Patient ID: {apt.user_id}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(apt.status)}`}>
                    {apt.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span>{new Date(apt.scheduled_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span>{new Date(apt.scheduled_at).toLocaleTimeString()}</span>
                  </div>
                  {apt.severity_level && (
                    <div className="flex items-center space-x-2 text-gray-700">
                      <span className="text-sm">Severity: <span className="font-semibold">{apt.severity_level}</span></span>
                    </div>
                  )}
                </div>

                {apt.status === 'pending' && (
                  <button 
                    onClick={() => cancelAppointment(apt.id)}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-800 font-semibold"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Cancel Appointment</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAppointments;
