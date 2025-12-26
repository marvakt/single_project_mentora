// src/pages/doctor/DoctorAppointmentDetail.jsx - Doctor's View of Appointment with Patient Details
import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, User, ArrowLeft, Video, FileText,
    DollarSign, Activity, MessageSquare, Phone, Mail,
    CheckCircle, AlertCircle, XCircle, Heart, Stethoscope,
    Clipboard, TrendingUp, AlertTriangle, Info
} from 'lucide-react';
import { APPOINTMENT_API, USER_API, apiCall } from '../../config/api';

const DoctorAppointmentDetail = ({
    appointmentId,
    token,
    setCurrentView,
    onJoinVideo,
    onViewChat
}) => {
    const [appointment, setAppointment] = useState(null);
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [completing, setCompleting] = useState(false);

    useEffect(() => {
        if (appointmentId) {
            fetchAppointmentDetail();
        }
    }, [appointmentId]);

    const fetchAppointmentDetail = async () => {
        setLoading(true);
        try {
            // Fetch appointment details (includes patient medical summary for doctors)
            const response = await apiCall(
                `${APPOINTMENT_API}/appointments/${appointmentId}/`
            );

            if (response.ok) {
                const data = await response.json();

                // Debug logging
                console.log('=== APPOINTMENT DATA DEBUG ===');
                console.log('Full data:', data);
                console.log('Has medical summary?', !!data.patient_medical_summary);
                console.log('Medical summary:', data.patient_medical_summary);

                setAppointment(data);

                // Create a basic patient object from appointment data
                // No need to fetch separately - we have the user_id
                setPatient({
                    name: `Patient ${data.user_id.substring(0, 8)}`,
                    user_id: data.user_id
                });
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

    const completeAppointment = async () => {
        if (!window.confirm('Mark this appointment as completed?')) return;

        setCompleting(true);
        try {
            const response = await apiCall(
                `${APPOINTMENT_API}/appointments/${appointmentId}/complete/`,
                { method: 'POST' }
            );

            if (response.ok) {
                alert('✅ Appointment marked as completed');
                fetchAppointmentDetail(); // Refresh the appointment details
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to complete appointment');
            }
        } catch (err) {
            console.error('Complete error:', err);
            alert('Something went wrong');
        } finally {
            setCompleting(false);
        }
    };
    
    const approveVideoSession = async () => {
      try {
        const response = await apiCall(
          `${APPOINTMENT_API}/appointments/${appointmentId}/video/`,
          {
            method: 'PATCH',
            body: JSON.stringify({ approve: true })
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          alert('✅ Video session approved successfully! Patient can now join the call.');
          fetchAppointmentDetail(); // Refresh to update the UI
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Failed to approve video session');
        }
      } catch (err) {
        console.error('Error approving video session:', err);
        alert('Error approving video session');
      }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'bg-yellow-100 text-yellow-800', text: 'Pending', icon: AlertCircle },
            confirmed: { class: 'bg-blue-100 text-blue-800', text: 'Confirmed', icon: CheckCircle },
            completed: { class: 'bg-green-100 text-green-800', text: 'Completed', icon: CheckCircle },
            cancelled: { class: 'bg-red-100 text-red-800', text: 'Cancelled', icon: XCircle },
        };
        return badges[status] || badges.pending;
    };

    const getSeverityInfo = (level) => {
        if (!level) return null;

        if (level >= 20) {
            return {
                color: 'text-red-700',
                bg: 'bg-red-50',
                label: 'Severe',
                icon: AlertTriangle,
                description: 'Requires immediate attention'
            };
        } else if (level >= 15) {
            return {
                color: 'text-orange-700',
                bg: 'bg-orange-50',
                label: 'Moderately Severe',
                icon: AlertCircle,
                description: 'Needs close monitoring'
            };
        } else if (level >= 10) {
            return {
                color: 'text-yellow-700',
                bg: 'bg-yellow-50',
                label: 'Moderate',
                icon: Info,
                description: 'Regular monitoring recommended'
            };
        }
        return {
            color: 'text-green-700',
            bg: 'bg-green-50',
            label: 'Mild',
            icon: CheckCircle,
            description: 'Low severity'
        };
    };

    const getMoodEmoji = (score) => {
        if (score >= 8) return '😊';
        if (score >= 6) return '🙂';
        if (score >= 4) return '😐';
        if (score >= 2) return '😔';
        return '😢';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <button
                            onClick={() => setCurrentView('doctor-appointments')}
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-semibold"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Appointments</span>
                        </button>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-4">Loading appointment details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <button
                            onClick={() => setCurrentView('doctor-appointments')}
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-semibold"
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
                            onClick={() => setCurrentView('doctor-appointments')}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Back to Appointments
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const statusBadge = getStatusBadge(appointment.status);
    const StatusIcon = statusBadge.icon;
    const severityInfo = getSeverityInfo(appointment.severity_level);
    const SeverityIcon = severityInfo?.icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <button
                        onClick={() => setCurrentView('doctor-appointments')}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-semibold"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Appointments</span>
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Page Header */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Appointment Details</h1>
                                <p className="text-blue-100">Patient consultation information</p>
                            </div>
                            <div className="mt-4 md:mt-0 flex items-center space-x-3">
                                <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2 ${statusBadge.class}`}>
                                    <StatusIcon className="w-4 h-4" />
                                    <span>{statusBadge.text}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - Patient & Appointment Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Patient Information Card */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <User className="w-6 h-6 mr-2 text-blue-600" />
                                Patient Information
                            </h2>

                            <div className="flex items-start space-x-6">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                                    {patient?.name?.charAt(0) || 'P'}
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-gray-800">{patient?.name || 'Loading...'}</h3>
                                    <p className="text-gray-600 mb-4">Patient ID: {appointment.user_id.substring(0, 13)}...</p>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        {patient?.email && (
                                            <div className="flex items-center space-x-2 text-gray-700">
                                                <Mail className="w-4 h-4 text-blue-600" />
                                                <span className="text-sm">{patient.email}</span>
                                            </div>
                                        )}

                                        {patient?.phone && (
                                            <div className="flex items-center space-x-2 text-gray-700">
                                                <Phone className="w-4 h-4 text-blue-600" />
                                                <span className="text-sm">{patient.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Appointment Details Card */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <Calendar className="w-6 h-6 mr-2 text-blue-600" />
                                Appointment Details
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Calendar className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Date</p>
                                        <p className="font-semibold text-gray-800">
                                            {new Date(appointment.scheduled_at).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Time</p>
                                        <p className="font-semibold text-gray-800">
                                            {new Date(appointment.scheduled_at).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {appointment.payment && (
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                                            <DollarSign className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Payment</p>
                                            <p className="font-semibold text-gray-800 capitalize">
                                                {appointment.payment.status} - ₹{appointment.payment.amount}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <Clipboard className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Booked On</p>
                                        <p className="font-semibold text-gray-800">
                                            {new Date(appointment.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Severity Assessment Card */}
                        {appointment.severity_level !== null && severityInfo && (
                            <div className={`rounded-xl shadow-lg p-6 ${severityInfo.bg}`}>
                                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                    <Activity className="w-6 h-6 mr-2 text-red-600" />
                                    Mental Health Severity Assessment
                                </h2>

                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <SeverityIcon className={`w-8 h-8 ${severityInfo.color}`} />
                                        <div>
                                            <p className={`text-2xl font-bold ${severityInfo.color}`}>
                                                {appointment.severity_level}/27
                                            </p>
                                            <p className={`text-sm font-semibold ${severityInfo.color}`}>
                                                {severityInfo.label}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">{severityInfo.description}</p>
                                    </div>
                                </div>

                                {/* Severity Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full ${appointment.severity_level >= 20 ? 'bg-red-600' :
                                            appointment.severity_level >= 15 ? 'bg-orange-600' :
                                                appointment.severity_level >= 10 ? 'bg-yellow-600' :
                                                    'bg-green-600'
                                            }`}
                                        style={{ width: `${(appointment.severity_level / 27) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Patient Notes Card */}
                        {appointment.notes && (
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                    <FileText className="w-6 h-6 mr-2 text-blue-600" />
                                    Patient's Notes
                                </h2>
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <p className="text-gray-700 leading-relaxed">{appointment.notes}</p>
                                </div>
                            </div>
                        )}

                        {/* Patient Medical Summary Card (Enhanced with Mood Data) */}
                        {appointment.patient_medical_summary && (
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                    <Stethoscope className="w-6 h-6 mr-2 text-red-600" />
                                    Patient Medical History
                                </h2>

                                <div className="space-y-6">
                                    {/* Latest Severity Assessment */}
                                    {appointment.patient_medical_summary.latest_assessment && (
                                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-200">
                                            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                                                <Activity className="w-5 h-5 mr-2 text-purple-600" />
                                                Latest Mental Health Assessment
                                            </h3>
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div className="bg-white rounded-lg p-3">
                                                    <p className="text-xs text-gray-600 mb-1">Severity Score</p>
                                                    <p className="text-2xl font-bold text-purple-600">
                                                        {appointment.patient_medical_summary.latest_assessment.severity_level}/27
                                                    </p>
                                                </div>
                                                <div className="bg-white rounded-lg p-3">
                                                    <p className="text-xs text-gray-600 mb-1">Assessment Date</p>
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {new Date(appointment.patient_medical_summary.latest_assessment.created_at).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="bg-white rounded-lg p-3">
                                                    <p className="text-xs text-gray-600 mb-1">Total Assessments</p>
                                                    <p className="text-2xl font-bold text-gray-800">
                                                        {appointment.patient_medical_summary.assessment_history?.length || 1}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Mood Tracking Data */}
                                    {appointment.patient_medical_summary.mood_entries && appointment.patient_medical_summary.mood_entries.length > 0 && (
                                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-5 border border-blue-200">
                                            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                                                <Heart className="w-5 h-5 mr-2 text-blue-600" />
                                                Recent Mood Tracking ({appointment.patient_medical_summary.mood_entries.length} entries)
                                            </h3>

                                            {/* Latest Mood Entry */}
                                            {appointment.patient_medical_summary.mood_entries[0] && (
                                                <div className="bg-white rounded-lg p-4 mb-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-sm font-semibold text-gray-700">Latest Mood Entry</span>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(appointment.patient_medical_summary.mood_entries[0].created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        <div className="text-center">
                                                            <p className="text-xs text-gray-600 mb-1">Mood</p>
                                                            <div className="flex items-center justify-center space-x-1">
                                                                <span className="text-2xl">{getMoodEmoji(appointment.patient_medical_summary.mood_entries[0].mood_score)}</span>
                                                                <span className="text-lg font-bold text-blue-600">
                                                                    {appointment.patient_medical_summary.mood_entries[0].mood_score}/10
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-gray-600 mb-1">Anxiety</p>
                                                            <p className="text-lg font-bold text-orange-600">
                                                                {appointment.patient_medical_summary.mood_entries[0].anxiety_level}/10
                                                            </p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-gray-600 mb-1">Sleep</p>
                                                            <p className="text-lg font-bold text-purple-600">
                                                                {appointment.patient_medical_summary.mood_entries[0].sleep_hours}h
                                                            </p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-xs text-gray-600 mb-1">Energy</p>
                                                            <p className="text-lg font-bold text-green-600">
                                                                {appointment.patient_medical_summary.mood_entries[0].energy_level}/10
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {appointment.patient_medical_summary.mood_entries[0].notes && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                                            <p className="text-xs text-gray-600 mb-1">Patient Notes:</p>
                                                            <p className="text-sm text-gray-700 italic">"{appointment.patient_medical_summary.mood_entries[0].notes}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Mood History Summary */}
                                            {appointment.patient_medical_summary.mood_entries.length > 1 && (
                                                <div className="bg-white rounded-lg p-4">
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Mood Trend (Last {Math.min(7, appointment.patient_medical_summary.mood_entries.length)} entries)</h4>
                                                    <div className="space-y-2">
                                                        {appointment.patient_medical_summary.mood_entries.slice(0, 7).map((entry, idx) => (
                                                            <div key={idx} className="flex items-center justify-between text-sm">
                                                                <span className="text-gray-600">
                                                                    {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                </span>
                                                                <div className="flex items-center space-x-4">
                                                                    <span className="flex items-center space-x-1">
                                                                        <span>{getMoodEmoji(entry.mood_score)}</span>
                                                                        <span className="font-semibold text-blue-600">{entry.mood_score}</span>
                                                                    </span>
                                                                    <span className="text-gray-400">|</span>
                                                                    <span className="text-orange-600">Anxiety: {entry.anxiety_level}</span>
                                                                    <span className="text-gray-400">|</span>
                                                                    <span className="text-purple-600">Sleep: {entry.sleep_hours}h</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Average Scores */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                                                <div className="bg-white rounded-lg p-3 text-center">
                                                    <p className="text-xs text-gray-600 mb-1">Avg Mood</p>
                                                    <p className="text-lg font-bold text-blue-600">
                                                        {(appointment.patient_medical_summary.mood_entries.reduce((sum, e) => sum + e.mood_score, 0) / appointment.patient_medical_summary.mood_entries.length).toFixed(1)}
                                                    </p>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 text-center">
                                                    <p className="text-xs text-gray-600 mb-1">Avg Anxiety</p>
                                                    <p className="text-lg font-bold text-orange-600">
                                                        {(appointment.patient_medical_summary.mood_entries.reduce((sum, e) => sum + e.anxiety_level, 0) / appointment.patient_medical_summary.mood_entries.length).toFixed(1)}
                                                    </p>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 text-center">
                                                    <p className="text-xs text-gray-600 mb-1">Avg Sleep</p>
                                                    <p className="text-lg font-bold text-purple-600">
                                                        {(appointment.patient_medical_summary.mood_entries.reduce((sum, e) => sum + e.sleep_hours, 0) / appointment.patient_medical_summary.mood_entries.length).toFixed(1)}h
                                                    </p>
                                                </div>
                                                <div className="bg-white rounded-lg p-3 text-center">
                                                    <p className="text-xs text-gray-600 mb-1">Avg Energy</p>
                                                    <p className="text-lg font-bold text-green-600">
                                                        {(appointment.patient_medical_summary.mood_entries.reduce((sum, e) => sum + e.energy_level, 0) / appointment.patient_medical_summary.mood_entries.length).toFixed(1)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* No Mood Data Message */}
                                    {(!appointment.patient_medical_summary.mood_entries || appointment.patient_medical_summary.mood_entries.length === 0) && (
                                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                                            <Heart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                            <p className="text-gray-600 text-sm">No mood tracking data available for this patient</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Actions */}
                    <div className="space-y-6">
                        {/* Quick Actions Card */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>

                            <div className="space-y-3">
                                {/* Video Call Approval/Join */}
                                {appointment.status === 'confirmed' && (
                                    <div className="space-y-3">
                                        {/* Doctor can always join the video call, but can also approve for the patient */}
                                        <button
                                            onClick={() => {
                                                if (onJoinVideo) {
                                                    onJoinVideo(appointment.id);
                                                } else {
                                                    setCurrentView('video-consultation');
                                                }
                                            }}
                                            className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 rounded-xl hover:shadow-lg transition flex items-center justify-center space-x-2"
                                        >
                                            <Video className="w-5 h-5" />
                                            <span className="font-semibold">Join Video Call</span>
                                        </button>
                                        
                                        {/* Video Call Approval Button - Show if not yet approved for patient */}
                                        {!appointment.video_session || !appointment.video_session.doctor_approved ? (
                                            <button
                                                onClick={approveVideoSession}
                                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl hover:shadow-lg transition flex items-center justify-center space-x-2"
                                            >
                                                <Video className="w-5 h-5" />
                                                <span className="font-semibold">Approve for Patient</span>
                                            </button>
                                        ) : (
                                            <div className="bg-green-100 text-green-800 p-3 rounded-xl text-center text-sm">
                                                <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                                                <p>Video call approved for patient</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Chat with Patient */}
                                <button
                                    onClick={() => {
                                        if (onViewChat) {
                                            onViewChat(appointment.id);
                                        } else {
                                            setCurrentView('real-time-chat');
                                        }
                                    }}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl hover:shadow-lg transition flex items-center justify-center space-x-2"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    <span className="font-semibold">Chat with Patient</span>
                                </button>

                                {/* Mark Complete */}
                                {appointment.status === 'confirmed' && (
                                    <button
                                        onClick={completeAppointment}
                                        disabled={completing}
                                        className="w-full bg-green-600 text-white p-4 rounded-xl hover:bg-green-700 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-semibold">
                                            {completing ? 'Completing...' : 'Mark as Completed'}
                                        </span>
                                    </button>
                                )}

                                {/* Completed Status */}
                                {appointment.status === 'completed' && (
                                    <div className="bg-green-100 text-green-800 p-4 rounded-xl text-center">
                                        <CheckCircle className="w-10 h-10 mx-auto mb-2" />
                                        <p className="font-semibold">Appointment Completed</p>
                                        <p className="text-sm mt-1">Session finished successfully</p>
                                    </div>
                                )}

                                {/* Cancelled Status */}
                                {appointment.status === 'cancelled' && (
                                    <div className="bg-red-100 text-red-800 p-4 rounded-xl text-center">
                                        <XCircle className="w-10 h-10 mx-auto mb-2" />
                                        <p className="font-semibold">Appointment Cancelled</p>
                                        <p className="text-sm mt-1">This appointment was cancelled</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Appointment Info Card */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Appointment Info</h2>

                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-gray-600">Appointment ID</p>
                                    <p className="font-mono text-xs break-all text-gray-800">{appointment.id}</p>
                                </div>

                                <div>
                                    <p className="text-gray-600">Created</p>
                                    <p className="font-semibold text-gray-800">
                                        {new Date(appointment.created_at).toLocaleString()}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-600">Last Updated</p>
                                    <p className="font-semibold text-gray-800">
                                        {new Date(appointment.updated_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorAppointmentDetail;
