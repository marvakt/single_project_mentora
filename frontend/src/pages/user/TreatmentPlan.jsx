
import React, { useState, useEffect } from 'react';
import {
  Heart, Calendar, CheckCircle, Clock, TrendingUp, FileText,
  Home, Activity, Smile, Settings, LogOut, Menu, User, Sparkles, Zap
} from 'lucide-react';
import { MEDICAL_API, USER_API, APPOINTMENT_API, apiCall } from '../../config/api';
import { formatIndianTime } from '../../utils/dateUtils';
import DoctorProfileModal from '../../components/DoctorProfileModal';

const TreatmentPlan = ({ user, token, setCurrentView }) => {
  const [plan, setPlan] = useState(null);
  const [progress, setProgress] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null); // Store full profile
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchTreatmentPlan();
  }, []);

  const fetchTreatmentPlan = async () => {
    setLoading(true);
    try {
      const response = await apiCall(`${MEDICAL_API}/treatment/my-plan`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setPlan(data.treatment_plan);
        setProgress(data.progress);

        // Fetch specific doctor details if ID exists
        if (data.treatment_plan.doctor_id) {
          fetchDoctorDetails(data.treatment_plan.doctor_id);
          fetchNextAppointment(data.treatment_plan.doctor_id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch treatment plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const [summary, setSummary] = useState(null);

  const fetchMedicalSummary = async () => {
    try {
      const response = await apiCall(`${MEDICAL_API}/summary/`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSummary(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch medical summary:', err);
    }
  };

  useEffect(() => {
    fetchMedicalSummary();
  }, []);

  const fetchDoctorDetails = async (doctorId) => {
    try {
      const response = await apiCall(`${USER_API}/profiles/doctor/${doctorId}/profile/`);
      if (response.ok) {
        const data = await response.json();
        setDoctorProfile(data);
      }
    } catch (err) {
      console.error('Failed to fetch doctor details:', err);
    }
  };

  const handleBookFollowUp = () => {
    if (doctorProfile) {
      sessionStorage.setItem('selectedDoctorId', doctorProfile.user_id);
      setCurrentView('book-appointment');
    }
  };

  const fetchNextAppointment = async (doctorId) => {
    try {
      const response = await apiCall(`${APPOINTMENT_API}/appointments/my-appointments`);
      if (response.ok) {
        const data = await response.json();
        // Filter for upcoming appointments with this doctor
        const now = new Date();
        const upcoming = data
          .filter(apt => apt.status === 'confirmed' && new Date(apt.scheduled_at) > now)
          .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

        if (upcoming.length > 0) {
          setNextAppointment(upcoming[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Heart className="w-10 h-10 text-teal-600" />
          </div>
          <p className="text-gray-500 font-medium">Preparing your wellness journey...</p>
        </div>
      </div>
    );
  }

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
              <p className="text-xs text-gray-400 font-medium">Patient Portal</p>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu</p>
            <NavItem icon={Home} label="Overview" view="user-dashboard" />
            <NavItem icon={Calendar} label="Appointments" view="my-appointments" />
            <NavItem icon={Clock} label="Book Session" view="book-appointment" />
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Wellness</p>
            <NavItem icon={Activity} label="Assessment" view="severity-assessment" />
            <NavItem icon={Smile} label="Mood Tracker" view="mood-tracker" />
            <NavItem icon={FileText} label="Treatment Plan" view="treatment-plan" active={true} />
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Account</p>
            <NavItem icon={User} label="Profile" view="user-profile" />
            <NavItem icon={Settings} label="Settings" view="settings" />
          </nav>
          <div className="p-4 border-t border-gray-100">
            <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold border-2 border-white shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name || sessionStorage.getItem('user_name') || 'User'}</p>
                <button onClick={() => { sessionStorage.clear(); setCurrentView('landing'); }} className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1">
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

          <div className="max-w-5xl mx-auto">
            {!plan ? (
              <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center max-w-2xl mx-auto mt-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
                <div className="relative">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                    <FileText className="w-12 h-12 text-gray-300" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Personalized Care Plan</h2>
                  <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto">
                    Your treatment plan is a collaborative roadmap created with your specialist. Get started by assessing your status or booking a consultation.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => setCurrentView('severity-assessment')}
                      className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-teal-500/20 hover:scale-[1.02] transition"
                    >
                      Start Assessment
                    </button>
                    <button
                      onClick={() => setCurrentView('book-appointment')}
                      className="bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-2xl font-bold hover:bg-gray-50 transition"
                    >
                      Find a Specialist
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Master Header Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-600 to-emerald-700 p-8 md:p-12 text-white relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div>
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                          Active Treatment
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2">{plan.plan_title}</h1>
                        <p
                          onClick={() => doctorProfile && setShowDoctorModal(true)}
                          className="text-teal-50 font-medium text-lg italic opacity-90 cursor-pointer hover:underline decoration-teal-200/50 underline-offset-4 transition-all"
                        >
                          supervised by Dr. {doctorProfile?.name || plan.doctor_name || 'Your Therapist'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        {/* Book Follow-up Button */}
                        <button
                          onClick={handleBookFollowUp}
                          className="bg-white text-teal-700 font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-teal-900/10 hover:bg-teal-50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                          <Calendar className="w-4 h-4" /> Book Session
                        </button>

                        {nextAppointment && (
                          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                            <p className="text-[10px] uppercase font-bold text-teal-100 tracking-wider">Next Session</p>
                            <p className="text-white font-bold text-sm">
                              {new Date(nextAppointment.scheduled_at).toLocaleDateString()} @ {formatIndianTime(new Date(nextAppointment.scheduled_at).toTimeString().slice(0, 5))}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-6 text-sm font-bold bg-black/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                          <div className="flex items-center gap-2 text-teal-50">
                            <Calendar className="w-4 h-4" />
                            <span>{plan.duration_weeks} Weeks Plan</span>
                          </div>
                          <div className="w-px h-6 bg-white/20"></div>
                          <div className="flex items-center gap-2 text-teal-50">
                            <Clock className="w-4 h-4" />
                            <span>{plan.therapy_frequency}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                  {/* Left Column: Progress & Goals */}
                  <div className="lg:col-span-4 space-y-8">
                    {/* Progress Tracker */}
                    {progress && (
                      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Plan Progress</h3>
                          <span className="text-3xl font-black text-teal-600 tracking-tighter">{progress.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 mb-8 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-teal-400 to-emerald-500 h-3 rounded-full transition-all duration-1000 shadow-sm shadow-emerald-500/20"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100">
                            <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest mb-1">Completed</p>
                            <p className="text-xl font-bold text-teal-900">{progress.weeks_elapsed} <span className="text-xs font-medium">Weeks</span></p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Remaining</p>
                            <p className="text-xl font-bold text-gray-900">{progress.weeks_remaining} <span className="text-xs font-medium">Weeks</span></p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Wellness Summary - AI Insights & RAG Coping Strategies */}
                    {summary && (summary.insights || (summary.latest_severity && summary.latest_severity.rag_insights)) && (
                      <div className="bg-violet-50 rounded-3xl p-8 shadow-sm border border-violet-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-violet-600" />
                          </div>
                          <h3 className="text-lg font-bold text-violet-900">AI Health Insights</h3>
                        </div>

                        <div className="space-y-4">
                          {/* General Trend Insights */}
                          {summary.insights && (
                            <div className="space-y-2">
                              {(Array.isArray(summary.insights) ? summary.insights : [summary.insights]).map((insight, i) => (
                                <div key={`trend-${i}`} className="bg-white/60 p-3 rounded-xl text-sm text-violet-800 font-medium border border-violet-100">
                                  {typeof insight === 'string' ? insight : "Your health trends are stabilizing."}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* RAG Contextual Advice */}
                          {summary.latest_severity?.rag_insights?.contextual_advice && Array.isArray(summary.latest_severity.rag_insights.contextual_advice) && (
                            <div className="mt-4 pt-4 border-t border-violet-200/50">
                              <p className="text-xs font-bold text-violet-700 uppercase tracking-widest mb-3">Personalized Coping Strategies</p>
                              <div className="grid gap-3">
                                {summary.latest_severity.rag_insights.contextual_advice.map((advice, idx) => (
                                  <div key={`rag-${idx}`} className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-violet-200 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                      {idx + 1}
                                    </div>
                                    <p className="text-sm text-violet-800 leading-relaxed">{advice}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Goals List */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" /> Treatment Goals
                      </h3>
                      <div className="space-y-4">
                        {Array.isArray(plan.goals) && plan.goals.map((goal, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-emerald-100 transition group">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-500 group-hover:text-white transition">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed font-medium">{goal}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Wellness Tips/Sparkles */}
                    <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-3xl p-6 border border-teal-100 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                        <Sparkles className="w-6 h-6 text-teal-600" />
                      </div>
                      <p className="text-xs text-teal-800 leading-relaxed font-semibold">
                        "Recovery is not a linear process. Every small step counts toward your mental well-being."
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Details, Recs, Meds */}
                  <div className="lg:col-span-8 space-y-8">
                    {/* Primary Details */}
                    <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <FileText className="w-24 h-24 text-gray-900" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-6">Expert Methodology</h3>
                      <p className="text-gray-600 leading-loose text-lg whitespace-pre-wrap font-medium">
                        {plan.plan_details}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Recommendations */}
                      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                          <Heart className="w-5 h-5 text-rose-500" /> Expert Recommendations
                        </h3>
                        <ul className="space-y-4">
                          {Array.isArray(plan.recommendations) && plan.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex gap-4">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0"></div>
                              <span className="text-sm text-gray-600 leading-relaxed font-medium">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Lifestyle Changes */}
                      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                          <Zap className="w-5 h-5 text-amber-500" /> Lifestyle Adjustments
                        </h3>
                        <div className="space-y-3">
                          {Array.isArray(plan.lifestyle_changes) && plan.lifestyle_changes.map((change, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-amber-900">
                              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                              <span className="text-sm font-bold truncate">{change}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Recent Mood History from Summary */}
                    {summary && summary.recent_moods && summary.recent_moods.length > 0 && (
                      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                          <Smile className="w-5 h-5 text-teal-500" /> Recent Mood Trends
                        </h3>
                        <div className="flex items-center gap-4 overflow-x-auto pb-2">
                          {summary.recent_moods.map((mood, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 min-w-[60px]">
                              <div className="h-24 w-2 bg-gray-100 rounded-full relative overflow-hidden">
                                <div
                                  className="absolute bottom-0 w-full bg-teal-400 rounded-full"
                                  style={{ height: `${(mood.mood_level / 10) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-bold text-gray-500">
                                {new Date(mood.timestamp).toLocaleDateString('en-US', { weekday: 'short' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medication Safeguards */}
                    {plan.medication_notes && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 flex items-start gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md shrink-0">
                          <Activity className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-indigo-900 mb-2 uppercase tracking-wide text-xs">Prescription & Safety Notes</h3>
                          <p className="text-indigo-800 leading-relaxed font-medium text-sm italic opacity-80">
                            {plan.medication_notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Doctor Profile Modal */}
      {showDoctorModal && doctorProfile && (
        <DoctorProfileModal
          doctor={doctorProfile}
          onClose={() => setShowDoctorModal(false)}
          onBook={(doc) => {
            handleBookFollowUp();
            setShowDoctorModal(false);
          }}
        />
      )}
    </div>
  );
};

export default TreatmentPlan;
