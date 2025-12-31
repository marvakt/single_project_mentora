
import React, { useState, useEffect } from 'react';
import {
  Heart, Calendar, Clock, Bell, User, LogOut, Smile,
  FileText, TrendingUp, Activity, Sparkles,
  ChevronRight, ArrowUpRight, Menu, X, Home, Settings
} from 'lucide-react';
import { USER_API, MEDICAL_API, apiCall } from '../../config/api';

const UserDashboard = ({ user, token, handleLogout, setCurrentView }) => {
  const [profile, setProfile] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [latestAssessment, setLatestAssessment] = useState(null);
  const [moodSummary, setMoodSummary] = useState(null);
  const [treatmentPlan, setTreatmentPlan] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProfile();
    fetchDoctors();
    fetchLatestAssessment();
    fetchMoodSummary();
    fetchTreatmentPlan();
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

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${USER_API}/doctors/`);
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      }
    } catch (err) {
      console.error('Failed to fetch doctors', err);
    }
  };

  const fetchLatestAssessment = async () => {
    try {
      const response = await apiCall(`${MEDICAL_API}/questionnaire/latest`, {
        method: 'GET'
      });
      if (response.ok) {
        const data = await response.json();
        setLatestAssessment(data.assessment);
        if (data.assessment && data.assessment.raw_score !== undefined) {
          fetchSuggestedDoctors(data.assessment.raw_score);
        }
      }
    } catch (err) {
      console.error('Failed to fetch assessment', err);
    }
  };

  const fetchSuggestedDoctors = async (score) => {
    try {
      const response = await apiCall(`${USER_API}/doctors/suggest/`, {
        method: 'POST',
        body: JSON.stringify({ severity_score: score })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.suggested_doctors && data.suggested_doctors.length > 0) {
          setDoctors(data.suggested_doctors);
        }
      }
    } catch (err) {
      console.error('Failed to fetch suggested doctors', err);
    }
  };

  const fetchMoodSummary = async () => {
    try {
      const response = await apiCall(`${MEDICAL_API}/mood/history?days=7`, {
        method: 'GET'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.analytics) {
          setMoodSummary(data.analytics);
        }
      }
    } catch (err) {
      console.error('Failed to fetch mood summary', err);
    }
  };

  const fetchTreatmentPlan = async () => {
    try {
      const response = await apiCall(`${MEDICAL_API}/treatment/my-plan`, {
        method: 'GET'
      });
      if (response.ok) {
        const data = await response.json();
        setTreatmentPlan(data.treatment_plan);
      }
    } catch (err) {
      console.error('Failed to fetch treatment plan', err);
    }
  };

  const getSeverityStyle = (level) => {
    if (!level) return { text: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-200', dot: 'bg-gray-400' };
    if (level === 'severe' || level === 'moderately_severe') return { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', dot: 'bg-rose-500' };
    if (level === 'moderate') return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-500' };
    return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', dot: 'bg-emerald-500' };
  };

  const NavItem = ({ icon: Icon, label, view, active }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setActiveTab(label.toLowerCase());
        setSidebarOpen(false);
      }}
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
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 flex items-center gap-3 border-b border-gray-50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Heart className="w-6 h-6 text-white text-bold" fill="white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent tracking-tight">Mentora</h1>
              <p className="text-xs text-gray-400 font-medium">Patient Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu</p>
            <NavItem icon={Home} label="Overview" view="user-dashboard" active={true} />
            <NavItem icon={Calendar} label="Appointments" view="my-appointments" />
            <NavItem icon={Clock} label="Book Session" view="book-appointment" />

            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Wellness</p>
            <NavItem icon={Activity} label="Assessment" view="severity-assessment" />
            <NavItem icon={Smile} label="Mood Tracker" view="mood-tracker" />
            <NavItem icon={FileText} label="Treatment Plan" view="treatment-plan" />

            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Account</p>
            <NavItem icon={User} label="Profile" view="user-profile" />
            <NavItem icon={Settings} label="Settings" view="settings" />
          </nav>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold border-2 border-white shadow-sm">
                {profile?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{profile?.name || 'User'}</p>
                <button onClick={handleLogout} className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1">
                  <LogOut className="w-3 h-3" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-bold text-gray-800">Mentora</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 relative">
          {/* Background Gradients */}
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-50/50 to-transparent pointer-events-none -z-10"></div>

          <div className="max-w-6xl mx-auto space-y-8">

            {/* 1. Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                  Dashboard
                </h1>
                <p className="text-gray-500">Welcome back, {profile?.name}. Here's your daily wellness overview.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  System Normal
                </span>
                <div className="h-8 w-[1px] bg-gray-300 mx-1"></div>
                <button className="p-2 text-gray-400 hover:text-teal-600 transition-colors">
                  <Bell className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 2. Key Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Mood Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
                      <Smile className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg uppercase tracking-wider">Weekly</span>
                  </div>
                  <div className="mb-1">
                    <span className="text-4xl font-bold text-gray-900">{moodSummary ? moodSummary.average_mood : '-'}</span>
                    <span className="text-gray-400 text-sm font-medium">/10</span>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Average Mood Score</p>
                </div>
              </div>

              {/* Assessment Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 ${getSeverityStyle(latestAssessment?.severity_level).bg}`}></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${getSeverityStyle(latestAssessment?.severity_level).bg} ${getSeverityStyle(latestAssessment?.severity_level).text}`}>
                      <Activity className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${getSeverityStyle(latestAssessment?.severity_level).bg} ${getSeverityStyle(latestAssessment?.severity_level).text}`}>Status</span>
                  </div>
                  <h3 className={`text-xl font-bold mb-1 capitalize ${getSeverityStyle(latestAssessment?.severity_level).text}`}>
                    {latestAssessment?.severity_level?.replace('_', ' ') || 'Not Assessed'}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium">Latest Diagnosis result</p>
                </div>
              </div>

              {/* Appointment Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-wider">Upcoming</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">No Events</h3>
                  <p className="text-sm text-gray-500 font-medium">Your schedule is clear</p>
                </div>
              </div>
            </div>

            {/* 3. Treatment Plan Banner */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-3xl p-8 text-white shadow-xl shadow-teal-900/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl"></div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">
                      {treatmentPlan ? treatmentPlan.plan_title : 'Start Your Journey'}
                    </h3>
                    <p className="text-teal-100 max-w-lg">
                      {treatmentPlan
                        ? 'Follow your personalized roadmap to better mental health.'
                        : 'Get a personalized treatment plan designed by AI and expert doctors.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentView('treatment-plan')}
                  className="px-6 py-3 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-colors shadow-lg active:scale-95 whitespace-nowrap"
                >
                  {treatmentPlan ? 'Continue Plan' : 'View Details'}
                </button>
              </div>
            </div>

            {/* 4. Doctors Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recommended Specialists</h2>
                <button className="text-sm font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1">
                  Browse All <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {doctors.length === 0 ? (
                  <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-400">Loading recommendations...</p>
                  </div>
                ) : (
                  doctors.slice(0, 4).map((doctor, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                          <User className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{doctor.name}</h3>
                          <p className="text-sm text-teal-600 font-medium truncate">{doctor.specialization}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-yellow-500" />
                          <span className="font-semibold text-gray-700">{doctor.average_rating || '5.0'}</span>
                        </div>
                        <div className="w-[1px] h-3 bg-gray-300"></div>
                        <span>{doctor.experience_years}y exp</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">₹{doctor.consultation_fee}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentView('book-appointment')
                          }}
                          className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg group-hover:bg-teal-600 transition-colors"
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;