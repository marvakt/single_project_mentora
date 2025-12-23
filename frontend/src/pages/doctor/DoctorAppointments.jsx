// src/pages/doctor/DoctorAppointments.jsx - Complete Doctor Appointments View
import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, User, Video, CheckCircle, AlertCircle,
  Activity, FileText, Filter, Search, ArrowLeft, XCircle,
  DollarSign, Heart, MessageSquare, Phone, Mail
} from 'lucide-react';
import { APPOINTMENT_API, USER_API, apiCall } from '../../config/api';

const DoctorAppointments = ({ user, token, setCurrentView, onViewDetail, onJoinVideo }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await apiCall(`${APPOINTMENT_API}/appointments/`);

      if (response.ok) {
        const data = await response.json();
        // Backend returns {appointments: [...], total: N}
        const appointmentsList = data.appointments || data || [];

        // Sort by date (upcoming first)
        const sorted = appointmentsList.sort((a, b) =>
          new Date(a.scheduled_at) - new Date(b.scheduled_at)
        );

        setAppointments(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const completeAppointment = async (appointmentId) => {
    if (!window.confirm('Mark this appointment as completed?')) return;

    try {
      const response = await apiCall(
        `${APPOINTMENT_API}/appointments/${appointmentId}/complete/`,
        { method: 'POST' }
      );

      if (response.ok) {
        alert('✅ Appointment marked as completed');
        fetchAppointments();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to complete appointment');
      }
    } catch (err) {
      console.error('Complete error:', err);
      alert('Something went wrong');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'PENDING' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'CONFIRMED' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'COMPLETED' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'CANCELLED' },
    };
    return badges[status] || badges.pending;
  };

  const getPriorityBadge = (appointment) => {
    if (!appointment.severity_level) return null;

    if (appointment.severity_level >= 20) {
      return { bg: 'bg-red-50', text: 'text-red-700', label: '🔴 High Priority', icon: '⚠️' };
    } else if (appointment.severity_level >= 10) {
      return { bg: 'bg-orange-50', text: 'text-orange-700', label: '🟠 Medium Priority', icon: '⚡' };
    }
    return { bg: 'bg-green-50', text: 'text-green-700', label: '🟢 Normal', icon: '✓' };
  };

  const filteredAppointments = appointments.filter(apt => {
    // Filter by status
    if (filter !== 'all' && apt.status !== filter) return false;

    // Search by appointment ID or patient ID
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesAptId = apt.id.toLowerCase().includes(searchLower);
      const matchesPatientId = apt.user_id.toLowerCase().includes(searchLower);
      if (!matchesAptId && !matchesPatientId) return false;
    }

    return true;
  });

  const getUpcomingCount = () => {
    const now = new Date();
    return appointments.filter(apt =>
      new Date(apt.scheduled_at) > now && apt.status === 'confirmed'
    ).length;
  };

  const getTodayCount = () => {
    const today = new Date().toDateString();
    return appointments.filter(apt =>
      new Date(apt.scheduled_at).toDateString() === today && apt.status === 'confirmed'
    ).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => setCurrentView('doctor-dashboard')}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Appointments</h1>
          <p className="text-gray-600">Manage your patient appointments and consultations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today's Appointments</p>
                <p className="text-3xl font-bold text-blue-600">{getTodayCount()}</p>
              </div>
              <Calendar className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Upcoming</p>
                <p className="text-3xl font-bold text-green-600">{getUpcomingCount()}</p>
              </div>
              <Clock className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Appointments</p>
                <p className="text-3xl font-bold text-purple-600">{appointments.length}</p>
              </div>
              <FileText className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by patient name or appointment ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {searchTerm || filter !== 'all'
                ? 'No appointments match your filters'
                : 'No appointments yet'}
            </p>
            {(searchTerm || filter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((apt) => {
              const statusBadge = getStatusBadge(apt.status);
              const priorityBadge = getPriorityBadge(apt);
              const isPast = new Date(apt.scheduled_at) < new Date();
              const isToday = new Date(apt.scheduled_at).toDateString() === new Date().toDateString();

              return (
                <div
                  key={apt.id}
                  className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition ${isToday && apt.status === 'confirmed' ? 'border-2 border-blue-500' : ''
                    }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                        P
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-lg">
                          Patient {apt.user_id.substring(0, 8)}...
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Patient ID: {apt.user_id.substring(0, 8)}...
                        </p>
                        {isToday && apt.status === 'confirmed' && (
                          <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                            📅 Today's Appointment
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-4 py-1 rounded-full text-xs font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </span>
                      {priorityBadge && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityBadge.bg} ${priorityBadge.text}`}>
                          {priorityBadge.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="font-semibold">
                          {new Date(apt.scheduled_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-gray-700">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Time</p>
                        <p className="font-semibold">
                          {new Date(apt.scheduled_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {apt.severity_level !== null && (
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Activity className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="text-xs text-gray-500">Severity Score</p>
                          <p className="font-semibold">{apt.severity_level}/27</p>
                        </div>
                      </div>
                    )}

                    {apt.payment_status && (
                      <div className="flex items-center space-x-2 text-gray-700">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-500">Payment</p>
                          <p className="font-semibold capitalize">{apt.payment_status}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Patient Notes */}
                  {apt.notes && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-700">
                        <FileText className="w-4 h-4 inline mr-2 text-gray-500" />
                        <span className="font-semibold">Patient Notes:</span> {apt.notes}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    {/* View Details Button */}
                    <button
                      onClick={() => {
                        if (onViewDetail) {
                          onViewDetail(apt.id);
                        } else {
                          setCurrentView('appointment-detail');
                        }
                      }}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-semibold px-4 py-2 border border-blue-300 rounded-lg hover:bg-blue-50 transition"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Details</span>
                    </button>

                    {/* Join Video Call - Only for confirmed appointments */}
                    {apt.status === 'confirmed' && !isPast && (
                      <button
                        onClick={() => {
                          if (onJoinVideo) {
                            onJoinVideo(apt.id);
                          } else {
                            setCurrentView('video-consultation');
                          }
                        }}
                        className="flex items-center space-x-2 text-white bg-gradient-to-r from-green-600 to-teal-600 font-semibold px-4 py-2 rounded-lg hover:shadow-lg transition"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Video Call</span>
                      </button>
                    )}

                    {/* Complete Appointment - Only for confirmed appointments */}
                    {apt.status === 'confirmed' && (
                      <button
                        onClick={() => completeAppointment(apt.id)}
                        className="flex items-center space-x-2 text-green-600 hover:text-green-800 font-semibold px-4 py-2 border border-green-300 rounded-lg hover:bg-green-50 transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark Complete</span>
                      </button>
                    )}

                    {/* Completed Status */}
                    {apt.status === 'completed' && (
                      <div className="flex items-center space-x-2 text-green-700 px-4 py-2 bg-green-50 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-semibold">Completed</span>
                      </div>
                    )}

                    {/* Cancelled Status */}
                    {apt.status === 'cancelled' && (
                      <div className="flex items-center space-x-2 text-red-700 px-4 py-2 bg-red-50 rounded-lg">
                        <XCircle className="w-4 h-4" />
                        <span className="font-semibold">Cancelled</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorAppointments;
