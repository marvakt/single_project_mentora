import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, User, Users, Video, CheckCircle, AlertCircle,
  Activity, FileText, Filter, Search, ArrowLeft, XCircle,
  DollarSign, Heart, MessageSquare, Phone, Mail, Menu, Home, Settings, LogOut
} from 'lucide-react';
import { APPOINTMENT_API, USER_API, apiCall } from '../../config/api';

const DoctorAppointments = ({ user, token, handleLogout, setCurrentView, onViewDetail, onJoinVideo }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [profile, setProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchAppointments();
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
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await apiCall(`${APPOINTMENT_API}/appointments/`);

      if (response.ok) {
        const data = await response.json();
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

  const getStatusConfig = (status) => {
    const configs = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'Pending' },
      confirmed: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100', label: 'Confirmed' },
      completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Completed' },
      cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', label: 'Cancelled' },
    };
    return configs[status] || configs.pending;
  };

  const getPriorityConfig = (severity) => {
    if (severity >= 20) return { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Critical' };
    if (severity >= 10) return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Moderate' };
    return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Normal' };
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter !== 'all' && apt.status !== filter) return false;
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

  // Sidebar Nav Item Helper
  const NavItem = ({ icon: Icon, label, view, active }) => (
    <button
      onClick={() => { setCurrentView(view); setSidebarOpen(false); }}
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
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0) || 'D'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{profile?.name || 'Doctor'}</p>
                <button onClick={handleLogout} className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1">
                  <LogOut className="w-3 h-3" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
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
            <div className="mb-8 overflow-hidden relative">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">My Appointments</h2>
              <p className="text-gray-500 font-medium">Coordinate and manage your clinical schedule</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 group hover:shadow-md transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center group-hover:scale-110 transition">
                    <Calendar className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Today's Total</p>
                    <h4 className="text-2xl font-black text-gray-900 tracking-tighter">{getTodayCount()}</h4>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 group hover:shadow-md transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition">
                    <Clock className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Confirmed Upcoming</p>
                    <h4 className="text-2xl font-black text-gray-900 tracking-tighter">{getUpcomingCount()}</h4>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 group col-span-2 lg:col-span-1 hover:shadow-md transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lifetime Managed</p>
                    <h4 className="text-2xl font-black text-gray-900 tracking-tighter">{appointments.length}</h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 mb-8 sticky top-0 z-20">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by patient ID or notes..."
                    className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-teal-300 focus:ring-4 focus:ring-teal-500/10 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-700 transition outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-2 border border-transparent focus-within:bg-white focus-within:border-teal-300 focus-within:ring-4 focus-within:ring-teal-500/10 transition">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    className="bg-transparent text-sm font-bold text-gray-600 outline-none cursor-pointer pr-4"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
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

            {/* List Section */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mb-4"></div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing Records...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 text-gray-300" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">No matching appointments</h4>
                <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">We couldn't find any appointment records for this view.</p>
                <button
                  onClick={() => { setSearchTerm(''); setFilter('all'); }}
                  className="text-teal-600 font-bold text-sm hover:text-teal-800 uppercase tracking-widest transition"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid gap-6 pb-12">
                {filteredAppointments.map((apt) => {
                  const status = getStatusConfig(apt.status);
                  const priority = getPriorityConfig(apt.severity_level || 0);
                  const isToday = new Date(apt.scheduled_at).toDateString() === new Date().toDateString();
                  const isPast = new Date(apt.scheduled_at) < new Date();

                  return (
                    <div key={apt.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition group relative overflow-hidden">
                      {isToday && apt.status === 'confirmed' && (
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500"></div>
                      )}

                      <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                        {/* Patient Info */}
                        <div className="flex items-center gap-4 lg:w-72 shrink-0">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-teal-500/10 shrink-0">
                            {apt.user_id?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 truncate">Patient {apt.user_id?.substring(0, 8)}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">ID: {apt.user_id?.substring(0, 12)}</p>
                            <div className="flex gap-2 mt-2">
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${status.border} ${status.bg} ${status.text}`}>
                                {status.label}
                              </span>
                              {apt.severity_level && (
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${priority.bg} ${priority.text}`}>
                                  {priority.label}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Timeline & Details */}
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-3 h-3 text-teal-600" />
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900">
                              {new Date(apt.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-3 h-3 text-teal-600" />
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900">
                              {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Activity className="w-3 h-3 text-rose-500" />
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Severity</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900">{apt.severity_level ? `${apt.severity_level}/27` : 'N/A'}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="w-3 h-3 text-emerald-600" />
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Billing</span>
                            </div>
                            <p className="text-sm font-bold text-gray-900 capitalize">{apt.payment_status || 'Pending'}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="shrink-0 flex items-center gap-3">
                          <button
                            onClick={() => onViewDetail(apt.id)}
                            className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 transition shadow-sm"
                            title="View Details"
                          >
                            <FileText className="w-5 h-5" />
                          </button>

                          {apt.status === 'confirmed' && !isPast && (
                            <button
                              onClick={() => onJoinVideo(apt.id)}
                              className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-teal-500/20 hover:scale-[1.02] active:scale-[0.98] transition"
                            >
                              <Video className="w-4 h-4" /> Join Call
                            </button>
                          )}

                          {apt.status === 'confirmed' && (
                            <button
                              onClick={() => completeAppointment(apt.id)}
                              className="w-10 h-10 rounded-xl border border-emerald-100 bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-600 hover:text-white transition"
                              title="Mark as Complete"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}

                          {apt.status === 'completed' && (
                            <div className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-100 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" /> Finalized
                            </div>
                          )}
                        </div>
                      </div>

                      {apt.notes && (
                        <div className="mt-6 pt-4 border-t border-gray-50 flex items-start gap-3">
                          <MessageSquare className="w-4 h-4 text-gray-300 mt-1 shrink-0" />
                          <p className="text-xs text-gray-500 italic font-medium leading-relaxed">"{apt.notes}"</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorAppointments;
