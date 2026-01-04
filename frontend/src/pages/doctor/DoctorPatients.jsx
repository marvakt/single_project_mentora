import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Calendar, Clock, User, Heart, Activity, FileText,
    Search, Filter, ChevronRight, MessageSquare, Phone, Mail,
    Users, TrendingUp, AlertCircle, CheckCircle, Info, Stethoscope,
    Sparkles, X, Menu, Settings, LogOut, Home
} from 'lucide-react';
import { APPOINTMENT_API, USER_API, medicalApiCall, apiCall } from '../../config/api';
import { logout } from '../../store/slices/authSlice';
import { setCurrentView } from '../../store/slices/uiSlice';
import { fetchDoctorPatients } from '../../store/slices/doctorProfileSlice';


const DoctorPatients = () => {
    const dispatch = useDispatch();

    // Redux selectors
    const { user } = useSelector((state) => state.auth);
    const { patients: reduxPatients, doctorProfile, loading } = useSelector((state) => state.doctorProfile);

    // Local state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientDetails, setPatientDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const patients = reduxPatients || [];

    useEffect(() => {
        dispatch(fetchDoctorPatients());
    }, [dispatch]);

    const handleLogout = () => {
        dispatch(logout());
        dispatch(setCurrentView('landing'));
    };

    const handleNavigation = (view) => {
        dispatch(setCurrentView(view));
        setSidebarOpen(false);
    };

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

    const fetchPatients = async () => {
        setLoading(true);
        try {
            // We deduce the patient list from the appointment history
            const response = await apiCall(`${APPOINTMENT_API}/appointments/`);

            if (response.ok) {
                const data = await response.json();
                const appointmentsList = data.appointments || data || [];

                // Group by User ID to separate unique patients
                const uniquePatientsMap = {};

                appointmentsList.forEach(apt => {
                    if (!apt.user_id) return;

                    if (!uniquePatientsMap[apt.user_id]) {
                        uniquePatientsMap[apt.user_id] = {
                            user_id: apt.user_id,
                            first_seen: new Date(apt.scheduled_at),
                            last_seen: new Date(apt.scheduled_at),
                            total_appointments: 0,
                            status: 'active', // meaningful logic could go here
                            latest_severity: apt.severity_level || 0
                        };
                    }

                    const p = uniquePatientsMap[apt.user_id];
                    p.total_appointments += 1;
                    if (new Date(apt.scheduled_at) > p.last_seen) {
                        p.last_seen = new Date(apt.scheduled_at);
                        p.latest_severity = apt.severity_level || p.latest_severity;
                    }
                    if (new Date(apt.scheduled_at) < p.first_seen) {
                        p.first_seen = new Date(apt.scheduled_at);
                    }
                });

                setPatients(Object.values(uniquePatientsMap));
            }
        } catch (err) {
            console.error('Failed to fetch patients:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPatientDetails = async (patientId) => {
        setLoadingDetails(true);
        try {
            // Using the user-specific medical summary endpoint
            const response = await medicalApiCall(`/summary/user/${patientId}`);

            if (response.ok) {
                const data = await response.json();
                setPatientDetails(data);
            } else {
                console.error("Failed to load patient details");
            }
        } catch (err) {
            console.error('Error fetching patient details:', err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handlePatientClick = (patient) => {
        setSelectedPatient(patient);
        fetchPatientDetails(patient.user_id);
    };

    const getSeverityConfig = (level) => {
        if (level === null || level === undefined) return null;
        if (level >= 20) return { color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100', label: 'Severe', icon: AlertCircle };
        if (level >= 15) return { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100', label: 'Mod. Severe', icon: AlertCircle };
        if (level >= 10) return { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Moderate', icon: Info };
        return { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', label: 'Mild', icon: CheckCircle };
    };

    const getMoodEmoji = (score) => {
        if (score >= 8) return '😊';
        if (score >= 6) return '🙂';
        if (score >= 4) return '😐';
        if (score >= 2) return '😔';
        return '😢';
    };

    const filteredPatients = patients.filter(p =>
        p.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <NavItem icon={Calendar} label="Appointments" view="doctor-appointments" />
                        <NavItem icon={Clock} label="Availability" view="doctor-availability" />
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Clinical</p>
                        <NavItem icon={Users} label="My Patients" view="doctor-patients" active={true} />
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
                                <p className="text-sm font-bold text-gray-900 truncate">{doctorProfile?.name || 'Doctor'}</p>
                                <button onClick={handleLogout} className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1">
                                    <LogOut className="w-3 h-3" /> Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
                {/* Mobile Header */}
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
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">My Patients</h2>
                                <p className="text-gray-500 font-medium mt-1">Manage your patient directory and medical records</p>
                            </div>
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search by ID..."
                                    className="bg-white border border-gray-100 focus:border-teal-300 focus:ring-4 focus:ring-teal-500/10 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-700 transition outline-none w-full md:w-64 shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mb-4"></div>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Directory...</p>
                            </div>
                        ) : filteredPatients.length === 0 ? (
                            <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Users className="w-10 h-10 text-gray-300" />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900 mb-2">No patients found</h4>
                                <p className="text-gray-500 max-w-sm mx-auto">Your patient list will appear here once appointments are booked.</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredPatients.map((patient) => {
                                    const sevConfig = getSeverityConfig(patient.latest_severity);

                                    return (
                                        <div
                                            key={patient.user_id}
                                            onClick={() => handlePatientClick(patient)}
                                            className={`bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-teal-100 transition cursor-pointer group relative overflow-hidden ${selectedPatient?.user_id === patient.user_id ? 'ring-2 ring-teal-500' : ''}`}
                                        >
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-teal-500/10 shrink-0">
                                                    {patient.user_id.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-gray-900 truncate">Patient {patient.user_id.substring(0, 6)}</h4>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">ID: {patient.user_id.substring(0, 8)}</p>
                                                    {sevConfig && (
                                                        <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${sevConfig.border} ${sevConfig.bg} ${sevConfig.color}`}>
                                                            <sevConfig.icon className="w-3 h-3" /> {sevConfig.label}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Last Seen</p>
                                                    <p className="text-sm font-bold text-gray-900">
                                                        {new Date(patient.last_seen).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sessions</p>
                                                    <p className="text-sm font-bold text-gray-900">{patient.total_appointments}</p>
                                                </div>
                                            </div>

                                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition transform translate-x-2 group-hover:translate-x-0">
                                                <ChevronRight className="w-5 h-5 text-teal-400" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* SLIDE-OVER DETAIL PANEL */}
                {selectedPatient && (
                    <div className="absolute inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-2xl border-l border-gray-100 z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out">
                        <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-gray-100 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedPatient(null)}
                                    className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Patient Details</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">ID: {selectedPatient.user_id}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-8 h-full">
                            {loadingDetails ? (
                                <div className="flex flex-col items-center justified-center py-20">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mb-4"></div>
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Fetching Medical Records...</p>
                                </div>
                            ) : !patientDetails ? (
                                <div className="p-8 bg-rose-50 rounded-3xl border border-rose-100 text-center">
                                    <p className="text-rose-700 font-medium">Failed to load medical records.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Stethoscope className="w-4 h-4 text-indigo-600" />
                                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Assessment Logs</span>
                                            </div>
                                            <p className="text-2xl font-black text-indigo-900">{patientDetails.assessment_history?.length || 0}</p>
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Total Logs</p>
                                        </div>
                                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles className="w-4 h-4 text-amber-600" />
                                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Mood Entries</span>
                                            </div>
                                            <p className="text-2xl font-black text-amber-900">{patientDetails.mood_entries?.length || 0}</p>
                                            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">Self-Reported</p>
                                        </div>
                                    </div>

                                    {/* Latest Severity */}
                                    {patientDetails.latest_assessment && (
                                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                                                    <Activity className="w-5 h-5 text-teal-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">Latest PHQ-9 Assessment</h4>
                                                    <p className="text-xs text-gray-400 font-medium">
                                                        {new Date(patientDetails.latest_assessment.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-end gap-2 px-4">
                                                <span className="text-5xl font-black text-gray-900 tracking-tighter">
                                                    {patientDetails.latest_assessment.severity_level}
                                                </span>
                                                <span className="text-gray-400 font-bold mb-1.5">/ 27</span>
                                            </div>
                                            <div className="mt-4 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 inline-block">
                                                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                                                    Level: {patientDetails.latest_assessment.severity_category}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Assessment History */}
                                    {patientDetails.assessment_history && patientDetails.assessment_history.length > 0 && (
                                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <h4 className="font-bold text-gray-900">Assessment History</h4>
                                            </div>

                                            <div className="space-y-3">
                                                {patientDetails.assessment_history.slice(0, 5).map((assessment, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-900">{assessment.severity_category || 'Assessment'}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                                {new Date(assessment.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-lg font-black text-gray-900">{assessment.severity_level}</span>
                                                            <span className="text-xs text-gray-400 font-bold">/ 27</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Mood History */}
                                    {patientDetails.mood_entries && patientDetails.mood_entries.length > 0 && (
                                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                                                    <Heart className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <h4 className="font-bold text-gray-900">Recent Emotional State</h4>
                                            </div>

                                            <div className="space-y-3">
                                                {patientDetails.mood_entries.slice(0, 3).map((entry, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-2xl">{getMoodEmoji(entry.mood_score)}</div>
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-900">Mood Score: {entry.mood_score}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                                    {new Date(entry.created_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {entry.notes && (
                                                            <div className="text-xs text-gray-500 italic max-w-[150px] truncate block text-right">
                                                                "{entry.notes}"
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Symptoms */}
                                    {patientDetails.symptoms && patientDetails.symptoms.length > 0 && (
                                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                                                    <AlertCircle className="w-5 h-5 text-rose-600" />
                                                </div>
                                                <h4 className="font-bold text-gray-900">Reported Symptoms</h4>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {patientDetails.symptoms.map((sym, idx) => (
                                                    <div key={idx} className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-100 text-xs font-bold">
                                                        {sym.symptom} <span className="opacity-60 text-[10px]">({sym.severity}/10)</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DoctorPatients;
