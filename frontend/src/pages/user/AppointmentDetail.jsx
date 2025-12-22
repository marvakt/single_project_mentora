// src/pages/user/AppointmentDetail.jsx - Complete Appointment Detail with Chat
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, ArrowLeft, Video, FileText, 
  DollarSign, Activity, MessageSquare, Phone, Mail,
  CheckCircle, AlertCircle, XCircle, Heart
} from 'lucide-react';
import { APPOINTMENT_API, USER_API, apiCall } from '../../config/api';

const AppointmentDetail = ({ 
  appointmentId, 
  token, 
  setCurrentView,
  onProcessPayment,
  onJoinVideo,
  onViewChat
}) => {
  const [appointment, setAppointment] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetail();
    }
  }, [appointmentId]);

  const fetchAppointmentDetail = async () => {
    setLoading(true);
    try {
      // Fetch appointment details
      const response = await apiCall(
        `${APPOINTMENT_API}/appointments/${appointmentId}/`
      );

      if (response.ok) {
        const data = await response.json();
        setAppointment(data);
        
        // Fetch doctor details
        if (data.doctor_id) {
          fetchDoctorDetails(data.doctor_id);
        }
      } else {
        setError('Failed to load appointment details');
      }
    } catch (err) {
      console.error('Error fetching appointment:', err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorDetails = async (doctorId) => {
    try {
      const response = await apiCall(`${USER_API}/profile/${doctorId}/`);
      if (response.ok) {
        const data = await response.json();
        setDoctor(data);
      }
    } catch (err) {
      console.error('Error fetching doctor details:', err);
    }
  };

  const cancelAppointment = async () => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    setCancelling(true);
    try {
      const response = await apiCall(
        `${APPOINTMENT_API}/appointments/${appointmentId}/cancel/`,
        { method: 'POST' }
      );

      if (response.ok) {
        alert('Appointment cancelled successfully');
        fetchAppointmentDetail(); // Refresh the appointment details
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to cancel appointment');
      }
    } catch (err) {
      console.error('Cancel error:', err);
      alert('Something went wrong');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      confirmed: { class: 'bg-blue-100 text-blue-800', text: 'Confirmed' },
      completed: { class: 'bg-green-100 text-green-800', text: 'Completed' },
      cancelled: { class: 'bg-red-100 text-red-800', text: 'Cancelled' },
    };
    return badges[status] || badges.pending;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: { class: 'bg-red-100 text-red-800', text: 'High Priority' },
      medium: { class: 'bg-orange-100 text-orange-800', text: 'Medium Priority' },
      normal: { class: 'bg-green-100 text-green-800', text: 'Normal Priority' },
    };
    return badges[priority] || badges.normal;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button 
              onClick={() => setCurrentView('my-appointments')}
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Appointments</span>
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading appointment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button 
              onClick={() => setCurrentView('my-appointments')}
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Appointments</span>
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Appointment</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => setCurrentView('my-appointments')}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Back to Appointments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button 
            onClick={() => setCurrentView('my-appointments')}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Appointments</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Appointment Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Appointment Details</h1>
                <p className="text-purple-100">View and manage your appointment</p>
              </div>
              <div className="mt-4 md:mt-0">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(appointment.status).class}`}>
                  {getStatusBadge(appointment.status).text}
                </span>
                {appointment.priority_level && (
                  <span className={`ml-2 px-4 py-2 rounded-full text-sm font-semibold ${getPriorityBadge(appointment.priority_level).class}`}>
                    {getPriorityBadge(appointment.priority_level).text}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Doctor Information */}
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Doctor Information</h2>
                
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
                      {doctor?.name?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{doctor?.name || 'Doctor'}</h3>
                      <p className="text-purple-600 font-semibold">{doctor?.specialization || 'Mental Health Specialist'}</p>
                      {doctor?.experience_years && (
                        <p className="text-gray-600">{doctor.experience_years} years of experience</p>
                      )}
                    </div>
                  </div>
                  
                  {doctor?.bio && (
                    <p className="text-gray-700 mt-4">{doctor.bio}</p>
                  )}
                </div>

                {/* Appointment Details */}
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Appointment Details</h2>
                
                <div className="bg-gray-50 rounded-xl p-6 grid md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-semibold">{new Date(appointment.scheduled_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Time</p>
                      <p className="font-semibold">{new Date(appointment.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Consultation Fee</p>
                      <p className="font-semibold">₹{appointment.amount || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {appointment.severity_level !== null && (
                    <div className="flex items-center space-x-3">
                      <Activity className="w-6 h-6 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Severity Level</p>
                        <p className="font-semibold">{appointment.severity_level}/27</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {appointment.notes && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Your Notes</h3>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-gray-700">{appointment.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Panel */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Actions</h2>
                
                <div className="space-y-4">
                  {/* Chat Button */}
                  <button
                    onClick={() => setCurrentView('real-time-chat')}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl hover:shadow-lg transition flex items-center justify-center space-x-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>Open Chat</span>
                  </button>

                  {/* Video Call Button */}
                  {appointment.status === 'confirmed' && (
                    <button
                      onClick={() => onJoinVideo(appointment.id)}
                      className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 rounded-xl hover:shadow-lg transition flex items-center justify-center space-x-2"
                    >
                      <Video className="w-5 h-5" />
                      <span>Join Video Call</span>
                    </button>
                  )}

                  {/* Payment Button */}
                  {appointment.status === 'pending' && (
                    <button
                      onClick={() => onProcessPayment(appointment.id, appointment.amount)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-xl hover:shadow-lg transition flex items-center justify-center space-x-2"
                    >
                      <DollarSign className="w-5 h-5" />
                      <span>Process Payment</span>
                    </button>
                  )}

                  {/* Cancel Button */}
                  {appointment.status === 'pending' && (
                    <button
                      onClick={cancelAppointment}
                      disabled={cancelling}
                      className="w-full bg-red-100 text-red-700 p-4 rounded-xl hover:bg-red-200 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>{cancelling ? 'Cancelling...' : 'Cancel Appointment'}</span>
                    </button>
                  )}

                  {/* Completed Status */}
                  {appointment.status === 'completed' && (
                    <div className="bg-green-100 text-green-800 p-4 rounded-xl text-center">
                      <CheckCircle className="w-10 h-10 mx-auto mb-2" />
                      <p className="font-semibold">Appointment Completed</p>
                      <p className="text-sm mt-1">Thank you for your session</p>
                    </div>
                  )}

                  {/* Cancelled Status */}
                  {appointment.status === 'cancelled' && (
                    <div className="bg-red-100 text-red-800 p-4 rounded-xl text-center">
                      <XCircle className="w-10 h-10 mx-auto mb-2" />
                      <p className="font-semibold">Appointment Cancelled</p>
                      <p className="text-sm mt-1">This appointment has been cancelled</p>
                    </div>
                  )}
                </div>

                {/* Appointment ID */}
                <div className="mt-8 p-4 bg-gray-100 rounded-xl">
                  <p className="text-sm text-gray-600">Appointment ID</p>
                  <p className="font-mono text-sm break-all">{appointment.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetail;