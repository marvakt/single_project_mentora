import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Calendar, Clock, User, ArrowLeft, Video, FileText,
    DollarSign, Activity, MessageSquare, Phone, Mail,
    CheckCircle, AlertCircle, XCircle, Heart, Stethoscope,
    Clipboard, TrendingUp, AlertTriangle, Info, Menu, Home, Settings, LogOut, Shield, Sparkles, Users
} from 'lucide-react';
import { APPOINTMENT_API, USER_API, apiCall } from '../../config/api';
import { logout } from '../../store/slices/authSlice';
import { setCurrentView } from '../../store/slices/uiSlice';
import { fetchAppointmentDetail } from '../../store/slices/appointmentsSlice';
import { fetchDoctorProfile } from '../../store/slices/doctorProfileSlice';


const DoctorAppointmentDetail = ({
    appointmentId,
    onJoinVideo,
    onViewChat
}) => {
    const dispatch = useDispatch();

    // Redux selectors
    const { user } = useSelector((state) => state.auth);
    const { selectedAppointment, loading: appointmentsLoading } = useSelector((state) => state.appointments);
    const { doctorProfile } = useSelector((state) => state.doctorProfile);

    // Local state
    const [patient, setPatient] = useState(null);
    const [error, setError] = useState(null);
    const [completing, setCompleting] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Use selectedAppointment from Redux
    const appointment = selectedAppointment?.id === appointmentId ? selectedAppointment : null;

    useEffect(() => {
        if (appointmentId && !appointment) {
            dispatch(fetchAppointmentDetail(appointmentId));
        }
        if (user?.user_id && !doctorProfile) {
            dispatch(fetchDoctorProfile(user.user_id));
        }
    }, [appointmentId, appointment, user?.user_id, doctorProfile, dispatch]);


    const handleLogout = () => {
        dispatch(logout());
        dispatch(setCurrentView('landing'));
    };

    const handleNavigation = (view) => {
        dispatch(setCurrentView(view));
        setSidebarOpen(false);
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
                fetchAppointmentDetail();
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
                fetchAppointmentDetail();
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to approve video session');
            }
        } catch (err) {
            console.error('Error approving video session:', err);
            alert('Error approving video session');
        }
    };

    const createVideoSession = async () => {
        try {
            const response = await apiCall(
                `${APPOINTMENT_API}/appointments/${appointmentId}/video/create`,
                {
                    method: 'POST',
                    body: JSON.stringify({ provider: 'twilio' })
                }
            );
            if (response.ok) {
                fetchAppointmentDetail();
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to create video session');
            }
        } catch (err) {
            console.error('Error creating video session:', err);
            alert('Failed to create video session');
        }
    };

    const getStatusConfig = (status) => {
        const configs = {
            pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'Pending', icon: AlertCircle },
            confirmed: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100', label: 'Confirmed', icon: CheckCircle },
            completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Completed', icon: CheckCircle },
            cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', label: 'Cancelled', icon: XCircle },
        };
        return configs[status] || configs.pending;
    };

    const getSeverityConfig = (level) => {
        if (level === null || level === undefined) return null;
        if (level >= 20) return { color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100', label: 'Severe', icon: AlertTriangle, tip: 'Immediate attention required' };
        if (level >= 15) return { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100', label: 'Mod. Severe', icon: AlertCircle, tip: 'Close monitoring suggested' };
        if (level >= 10) return { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Moderate', icon: Info, tip: 'Standard monitoring' };
        return { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', label: 'Mild', icon: CheckCircle, tip: 'Stable condition' };
    };

    const getMoodEmoji = (score) => {
        if (score >= 8) return '😊';
        if (score >= 6) return '🙂';
        if (score >= 4) return '😐';
        if (score >= 2) return '😔';
        return '😢';
    };

    // Sidebar Nav Item Helper
    const NavItem = ({ icon: Icon, label, view, active }) => (
        <button
            onClick={() => handleNavigation(view)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
                ? 'bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 font-semibold shadow-sm border border-teal-100'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
        >
            <Icon className={`w-5 h-5 ${active ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
            <span>{label}</span>
            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500"></div>}
        </button>
    );

    if (!appointment || appointmentsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Session Details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC] p-8">
                <div className="bg-white rounded-3xl p-12 text-center max-w-lg shadow-sm border border-gray-100">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-rose-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Access Error</h3>
                    <p className="text-gray-500 mb-8">{error}</p>
                    <button
                        onClick={() => setCurrentView('doctor-appointments')}
                        className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-gray-800 transition shadow-lg"
                    >
                        Return to Schedule
                    </button>
                </div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(appointment.status);
    const StatusIcon = statusConfig.icon;
    const severityConfig = getSeverityConfig(appointment.severity_level);
    const SeverityIcon = severityConfig?.icon;

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>}

            {/* Sidebar Navigation */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="flex flex-col h-full">
                    <div className="p-6 flex items-center gap-3 border-b border-gray-50">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Heart className="w-6 h-6 text-white text-bold" fill="white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent tracking-tight">Mentora</h1>
                            <p className="text-xs text-gray-400 font-medium">Doctor Portal</p>
                        </div>
                    </div>
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Practice</p>
                        <NavItem icon={Home} label="Overview" view="doctor-dashboard" />
                        <NavItem icon={Calendar} label="Appointments" view="doctor-appointments" active={true} />
                        <NavItem icon={Clock} label="Availability" view="doctor-availability" />
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Clinical</p>
                        <NavItem icon={Users} label="My Patients" view="doctor-patients" />
                        <NavItem icon={FileText} label="Templates" view="templates" />
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Account</p>
                        <NavItem icon={User} label="Profile" view="doctor-profile" />
                        <NavItem icon={Settings} label="Settings" view="settings" />
                    </nav>
                    <div className="p-4 border-t border-gray-100">
                        <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold border-2 border-white shadow-sm overflow-hidden">
                                {doctorProfile?.avatar ? (
                                    <img src={doctorProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    doctorProfile?.name?.charAt(0) || 'D'
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">Dr. {doctorProfile?.name || 'Doctor'}</p>
                                <button onClick={handleLogout} className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1">
                                    <LogOut className="w-3 h-3" /> Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center"><Heart className="w-4 h-4 text-white" fill="white" /></div>
                        <span className="font-bold text-gray-800">Mentora</span>
                    </div>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"><Menu className="w-6 h-6" /></button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-teal-50/50 to-transparent pointer-events-none -z-10"></div>

                    <div className="max-w-6xl mx-auto">
                        {/* Action Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setCurrentView('doctor-appointments')}
                                    className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-100 transition shadow-sm"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Session Detail</h2>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-1 ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                                        <StatusIcon className="w-3 h-3" /> {statusConfig.label}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => onViewChat(appointment.id)}
                                    className="px-6 py-3 rounded-2xl bg-white border border-gray-100 text-gray-700 font-bold hover:bg-teal-50 hover:text-teal-600 hover:border-teal-100 transition shadow-sm flex items-center gap-2"
                                >
                                    <MessageSquare className="w-4 h-4" /> Chat
                                </button>
                                {appointment.status === 'confirmed' && (
                                    <>
                                        {!appointment.video_session ? (
                                            <button
                                                onClick={createVideoSession}
                                                className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2"
                                            >
                                                <Video className="w-4 h-4" /> Create Session
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => onJoinVideo(appointment.id)}
                                                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold shadow-lg shadow-teal-500/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2"
                                                >
                                                    <Video className="w-4 h-4" /> Join Session
                                                </button>
                                                {!appointment.video_session.doctor_approved && (
                                                    <button
                                                        onClick={approveVideoSession}
                                                        className="px-6 py-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 font-bold hover:bg-amber-100 transition flex items-center gap-2"
                                                    >
                                                        <Shield className="w-4 h-4" /> Grant Entry
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                                {appointment.status === 'confirmed' && (
                                    <button
                                        onClick={completeAppointment}
                                        disabled={completing}
                                        className="px-6 py-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold hover:bg-emerald-600 hover:text-white transition flex items-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" /> {completing ? '...' : 'Finalize'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-12 gap-8">
                            {/* Patient Profile Card (Full Height Left Sidebar like) */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden text-center">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-60"></div>
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-xl shadow-teal-500/10 border-4 border-white">
                                            {patient?.name?.charAt(0) || 'P'}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">{patient?.name || 'Patient'}</h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Patient ID: {appointment.user_id?.substring(0, 12)}</p>

                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                    <Calendar className="w-4 h-4 text-teal-600" />
                                                </div>
                                                <span className="text-xs font-bold text-gray-600">Appt. Date</span>
                                            </div>
                                            <span className="text-xs font-black text-gray-900">
                                                {new Date(appointment.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>

                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                    <Clock className="w-4 h-4 text-teal-600" />
                                                </div>
                                                <span className="text-xs font-bold text-gray-600">Start Time</span>
                                            </div>
                                            <span className="text-xs font-black text-gray-900">
                                                {new Date(appointment.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Clipboard className="w-3 h-3" /> Booking Reference
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold mb-1">REFERENCE CODE</p>
                                            <p className="text-xs font-mono font-bold text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100 break-all">{appointment.id}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold mb-1">BILLING STATUS</p>
                                            <div className="flex items-center justify-between bg-emerald-50 text-emerald-700 p-2 rounded-lg border border-emerald-100">
                                                <span className="text-xs font-bold">Paid via Razorpay</span>
                                                <DollarSign className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Clinical Data Area */}
                            <div className="lg:col-span-8 space-y-8">
                                {/* Critical Medical Context Row */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Current Severity */}
                                    {severityConfig && (
                                        <div className={`rounded-3xl p-8 border ${severityConfig.border} ${severityConfig.bg} relative overflow-hidden group`}>
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-125 transition duration-500"></div>
                                            <div className="relative">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm`}>
                                                        <Activity className={`w-5 h-5 ${severityConfig.color}`} />
                                                    </div>
                                                    <h3 className="font-bold text-gray-900 tracking-tight">PHQ-9 Severity</h3>
                                                </div>
                                                <div className="flex items-end gap-3 mb-4">
                                                    <span className={`text-5xl font-black ${severityConfig.color} tracking-tighter`}>{appointment.severity_level}</span>
                                                    <span className="text-gray-400 font-bold text-lg mb-1">/ 27</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${severityConfig.bg} ${severityConfig.color} border ${severityConfig.border}`}>
                                                        {severityConfig.label}
                                                    </span>
                                                    <p className="text-xs text-gray-500 font-medium">{severityConfig.tip}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Patient Notes */}
                                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                                                <MessageSquare className="w-5 h-5 text-teal-600" />
                                            </div>
                                            <h3 className="font-bold text-gray-900 tracking-tight">Patient Statement</h3>
                                        </div>
                                        <div className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-100 overflow-y-auto max-h-40">
                                            <p className="text-sm text-gray-600 leading-relaxed italic">
                                                {appointment.notes ? `"${appointment.notes}"` : 'No notes provided for this session.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Comprehensive Medical History */}
                                {appointment.patient_medical_summary && (
                                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                                    <Stethoscope className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Diagnostic Summary</h3>
                                            </div>
                                            <button className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                                Full EMR <TrendingUp className="w-3 h-3" />
                                            </button>
                                        </div>

                                        <div className="space-y-8">
                                            {/* Previous Assessments Recap */}
                                            {appointment.patient_medical_summary.latest_assessment && (
                                                <div className="bg-gradient-to-br from-indigo-50 to-blue-50/30 rounded-3xl p-6 border border-indigo-100 flex flex-col md:flex-row gap-8">
                                                    <div className="md:w-1/3 flex flex-col justify-center">
                                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Baseline Assessment</p>
                                                        <h4 className="text-3xl font-black text-indigo-700 tracking-tighter">
                                                            {appointment.patient_medical_summary.latest_assessment.severity_level}
                                                            <span className="text-lg text-indigo-300 ml-1">Score</span>
                                                        </h4>
                                                        <p className="text-[10px] text-indigo-500 font-bold mt-2 italic flex items-center gap-1">
                                                            Analyzed: {new Date(appointment.patient_medical_summary.latest_assessment.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-indigo-50 text-center">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Logs</p>
                                                            <p className="text-xl font-black text-gray-900">{appointment.patient_medical_summary.assessment_history?.length || 1}</p>
                                                        </div>
                                                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-indigo-50 text-center">
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Profile Age</p>
                                                            <p className="text-xl font-black text-gray-900">48 Days</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Mood Tracking Real-Time Intelligence */}
                                            {appointment.patient_medical_summary.mood_entries && appointment.patient_medical_summary.mood_entries.length > 0 && (
                                                <div>
                                                    <h4 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-6">
                                                        <Sparkles className="w-3 h-3 text-amber-500" /> Bio-Emotional Feedback
                                                    </h4>

                                                    {/* Latest Mood Card */}
                                                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 border-l-4 border-l-teal-500 mb-6">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <p className="text-xs font-bold text-teal-700 uppercase tracking-widest">Latest Log Entry</p>
                                                            <p className="text-[10px] text-gray-400 font-bold">
                                                                {new Date(appointment.patient_medical_summary.mood_entries[0].created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                                                            <div>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Mood State</p>
                                                                <div className="flex items-center justify-center gap-1.5">
                                                                    <span className="text-2xl">{getMoodEmoji(appointment.patient_medical_summary.mood_entries[0].mood_score)}</span>
                                                                    <span className="text-lg font-black text-gray-900">{appointment.patient_medical_summary.mood_entries[0].mood_score}</span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Anxiety</p>
                                                                <span className="text-lg font-black text-rose-500">{appointment.patient_medical_summary.mood_entries[0].anxiety_level}</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Energy</p>
                                                                <span className="text-lg font-black text-emerald-500">{appointment.patient_medical_summary.mood_entries[0].energy_level}</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Sleep</p>
                                                                <span className="text-lg font-black text-indigo-500">{appointment.patient_medical_summary.mood_entries[0].sleep_hours}h</span>
                                                            </div>
                                                        </div>
                                                        {appointment.patient_medical_summary.mood_entries[0].notes && (
                                                            <p className="mt-4 pt-4 border-t border-gray-100 text-[11px] text-gray-500 italic font-medium">"{appointment.patient_medical_summary.mood_entries[0].notes}"</p>
                                                        )}
                                                    </div>

                                                    {/* Analytical Table */}
                                                    <div className="overflow-x-auto rounded-2xl border border-gray-100">
                                                        <table className="w-full text-left text-xs">
                                                            <thead className="bg-gray-50/80 text-gray-400 font-bold uppercase tracking-widest border-b border-gray-100">
                                                                <tr>
                                                                    <th className="px-6 py-4">Timeline</th>
                                                                    <th className="px-6 py-4">Mood</th>
                                                                    <th className="px-6 py-4">Anxiety</th>
                                                                    <th className="px-6 py-4">Energy</th>
                                                                    <th className="px-6 py-4">Sleep</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50">
                                                                {appointment.patient_medical_summary.mood_entries.slice(1, 5).map((entry, idx) => (
                                                                    <tr key={idx} className="hover:bg-gray-50/50 transition">
                                                                        <td className="px-6 py-4 font-bold text-gray-500">{new Date(entry.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</td>
                                                                        <td className="px-6 py-4">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span>{getMoodEmoji(entry.mood_score)}</span>
                                                                                <span className="font-black text-gray-900">{entry.mood_score}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-4 font-black text-rose-500">{entry.anxiety_level}</td>
                                                                        <td className="px-6 py-4 font-black text-emerald-500">{entry.energy_level}</td>
                                                                        <td className="px-6 py-4 font-black text-indigo-500">{entry.sleep_hours}h</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DoctorAppointmentDetail;
