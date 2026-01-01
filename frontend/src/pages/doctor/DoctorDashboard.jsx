import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Heart, Calendar, Users, CheckCircle, DollarSign, Bell, User,
  LogOut, Clock, Settings, FileText, Menu, Home, Activity, Sparkles, TrendingUp, AlertCircle
} from 'lucide-react';
import { USER_API, APPOINTMENT_API, apiCall } from '../../config/api';
import { logout } from '../../store/slices/authSlice';
import { setCurrentView } from '../../store/slices/uiSlice';
import { fetchAppointments } from '../../store/slices/appointmentsSlice';
import { fetchDoctorProfile } from '../../store/slices/doctorProfileSlice';


const DoctorDashboard = () => {
  const dispatch = useDispatch();

  // Redux selectors
  const { user, token } = useSelector((state) => state.auth);
  const { appointments, loading: appointmentsLoading } = useSelector((state) => state.appointments);
  const { doctorProfile, loading: profileLoading } = useSelector((state) => state.doctorProfile);
  const { profile } = useSelector((state) => state.userProfile);

  // Local state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user?.user_id) {
      dispatch(fetchDoctorProfile(user.user_id));
      dispatch(fetchAppointments());
    }
  }, [user?.user_id, dispatch]);



  const getUpcomingAppointments = () => {
    const now = new Date();
    const appointmentsList = appointments || [];
    return appointmentsList
      .filter(apt => new Date(apt.scheduled_at) > now && apt.status === 'confirmed')
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
      .slice(0, 3);
  };

  const getTodayCount = () => {
    const today = new Date().toDateString();
    const appointmentsList = appointments || [];
    return appointmentsList.filter(apt =>
      new Date(apt.scheduled_at).toDateString() === today
    ).length;
  };

  const getCompletedCount = () => {
    const appointmentsList = appointments || [];
    return appointmentsList.filter(apt => apt.status === 'completed').length;
  };

  const getTotalRevenue = () => {
    const appointmentsList = appointments || [];
    return appointmentsList
      .filter(apt => apt.status === 'completed')
      .reduce((sum, apt) => sum + (apt.amount || 0), 0);
  };

  const getTotalPatients = () => {
    // Get unique patient count from appointments
    const uniquePatients = new Set((appointments || []).map(apt => apt.user_id));
    return uniquePatients.size;
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(setCurrentView('landing'));
  };

  const handleNavigation = (view) => {
    dispatch(setCurrentView(view));
    setSidebarOpen(false);
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

  const upcomingAppointments = getUpcomingAppointments();

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
            <NavItem icon={Home} label="Overview" view="doctor-dashboard" active={true} />
            <NavItem icon={Calendar} label="Appointments" view="doctor-appointments" />
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
                <p className="text-sm font-bold text-gray-900 truncate">Dr. {profile?.name || 'Doctor'}</p>
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
            {/* Status Alert Section */}
            <div className="mb-8 space-y-4">
              {doctorProfile?.doctor_status === 'pending' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 text-amber-800 shadow-sm animate-in slide-in-from-top duration-500">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold">Verification Pending</p>
                    <p className="text-sm opacity-90">Our team is currently reviewing your medical credentials. You'll be notified via email once approved.</p>
                  </div>
                </div>
              )}

              {doctorProfile?.doctor_status === 'approved' && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-4 text-emerald-800 shadow-sm animate-in slide-in-from-top duration-500">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold">Account Approved</p>
                    <p className="text-sm opacity-90">Congratulations! You are now visible to patients. Set your availability to start receiving bookings.</p>
                  </div>
                </div>
              )}

              {doctorProfile?.doctor_status === 'rejected' && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-4 text-rose-800 shadow-sm animate-in slide-in-from-top duration-500">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="font-bold">Account Rejected</p>
                    <p className="text-sm opacity-90">We encountered some issues during your credential verification. Please check your email for more details.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Welcome Section */}
            <div className="grid md:grid-cols-12 gap-8 mb-8">
              <div className="md:col-span-8 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-60"></div>
                <div className="relative">
                  <span className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                    Practice Dashboard
                  </span>
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">Welcome, Dr. {profile?.name || 'Doctor'}</h1>
                  <p className="text-gray-500 font-medium text-lg max-w-lg leading-relaxed">
                    Your clinical summary for today. We've got {getTodayCount()} appointments waiting for your attention.
                  </p>

                  <div className="flex flex-wrap gap-4 mt-8">
                    <button onClick={() => setCurrentView('doctor-availability')} className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-teal-500/20 hover:scale-[1.02] transition">
                      Set Work Hours
                    </button>
                    <button onClick={() => setCurrentView('doctor-appointments')} className="bg-gray-50 text-gray-700 px-6 py-3 rounded-2xl font-bold border border-gray-100 hover:bg-white hover:border-teal-100 transition">
                      View Schedule
                    </button>
                  </div>
                </div>
              </div>

              <div className="md:col-span-4 bg-gradient-to-br from-teal-600 to-emerald-700 rounded-3xl p-8 text-white shadow-lg shadow-teal-700/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="relative h-full flex flex-col justify-between">
                  <div>
                    <Sparkles className="w-10 h-10 mb-4 opacity-80" />
                    <h3 className="text-2xl font-bold mb-2">Clinical Insight</h3>
                    <p className="text-teal-50 text-sm leading-relaxed opacity-90">
                      Did you know? Regular follow-ups increase patient recovery rates by 40% in digital mental healthcare.
                    </p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/20">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Practice Tip</p>
                    <p className="text-xs font-medium">Keep your Bio updated for higher patient trust.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition group">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Calendar className="w-6 h-6 text-teal-600" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Sessions Today</p>
                <h4 className="text-3xl font-black text-gray-900 tracking-tighter">{getTodayCount()}</h4>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Patients</p>
                <h4 className="text-3xl font-black text-gray-900 tracking-tighter">{getTotalPatients()}</h4>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition group">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Hours Logged</p>
                <h4 className="text-3xl font-black text-gray-900 tracking-tighter">--</h4>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition group">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Earnings</p>
                <h4 className="text-3xl font-black text-gray-900 tracking-tighter">--</h4>
              </div>
            </div>

            {/* Bottom Sections */}
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Appointments Recap */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Upcoming Sessions</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Calendar Overview</p>
                    </div>
                    <button onClick={() => setCurrentView('doctor-appointments')} className="text-sm font-bold text-teal-600 hover:underline">View All</button>
                  </div>

                  {appointmentsLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-2"></div>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Loading...</p>
                    </div>
                  ) : upcomingAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                        <Calendar className="w-10 h-10 text-gray-200" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-400 tracking-tight">Your schedule is currently empty</h4>
                      <p className="text-sm text-gray-400 max-w-xs mx-auto mt-2">New appointments will appear here once you're approved and visible to patients.</p>
                      <button onClick={() => setCurrentView('doctor-availability')} className="mt-6 text-teal-600 font-bold text-sm tracking-widest uppercase hover:underline">
                        Setup Availability
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingAppointments.map(apt => (
                        <div key={apt.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm transition cursor-pointer" onClick={() => setCurrentView('doctor-appointments')}>
                          <div className="w-16 h-16 rounded-xl bg-teal-100 flex flex-col items-center justify-center text-teal-700 shrink-0">
                            <span className="text-sm font-bold">{new Date(apt.scheduled_at).toLocaleDateString(undefined, { month: 'short' })}</span>
                            <span className="text-xl font-black leading-none">{new Date(apt.scheduled_at).getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate">Patient {apt.user_id?.substring(0, 8)}...</h4>
                            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium mt-1">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {apt.severity_level && (
                                <span className={`px-2 py-0.5 rounded-md ${apt.severity_level >= 20 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  Severity: {apt.severity_level}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0">
                            <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100">Confirmed</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Notifications/Updates */}
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-teal-600" /> Announcements
                  </h3>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-2"></div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 leading-tight mb-1">System Update v2.4</p>
                        <p className="text-xs text-gray-500 font-medium">New patient feedback system is now live for all specialists.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2"></div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 leading-tight mb-1">Webinar Alert</p>
                        <p className="text-xs text-gray-500 font-medium">Join us for a talk on 'Digital Empathy' next Friday at 4 PM.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Growth Section */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 border-l-4 border-l-teal-500">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                      <Activity className="w-5 h-5 text-teal-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Reach Goal</h3>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mb-4">You're at {Math.min(100, (getTotalPatients() / 20) * 100).toFixed(0)}% of your patient monthly target. Need help scaling?</p>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-2">
                    <div className="bg-teal-500 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (getTotalPatients() / 20) * 100)}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>{getTotalPatients()} Patients</span>
                    <span>Target: 20</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
