
import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, User, ArrowLeft, XCircle, CheckCircle,
  Star, Video, FileText, DollarSign, Activity, MessageSquare,
  Home, Smile, Settings, LogOut, Menu, Bell, Heart, Search, Filter
} from 'lucide-react';
import { APPOINTMENT_API, USER_API, apiCall } from '../../config/api';

const MyAppointments = ({ user, token, setCurrentView, onViewDetail, onProcessPayment, onJoinVideo, onViewChat }) => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState({}); // Map of doctorId -> doctor object
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Search & Filter State
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'history', 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([fetchAppointments(), fetchDoctors()]);
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await apiCall(`${APPOINTMENT_API}/appointments/`);
      if (response.ok) {
        const data = await response.json();
        const sorted = data.appointments?.sort((a, b) =>
          new Date(b.scheduled_at) - new Date(a.scheduled_at)
        ) || [];
        setAppointments(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${USER_API}/doctors/`);
      if (response.ok) {
        const data = await response.json();
        // Create a map for easy lookup
        const doctorMap = {};
        data.forEach(doc => {
          doctorMap[doc.user_id] = doc; // Assuming doc object has user_id
          // If the API structure is different, we might need to adjust. 
          // Usually doctors endpoint returns list of profiles.
          // Let's assume matches the ID in appointment.
        });
        // Fallback: if 'user_id' isn't the key, maybe 'id'. 
        // We'll map by 'name' as well for search if needed, but ID is safest linking.
        setDoctors(data.reduce((acc, doc) => ({ ...acc, [doc.id]: doc }), {}));
      }
    } catch (err) {
      console.error('Failed to fetch doctors', err);
    }
  };

  // Helper to safely get doctor name
  const getDoctorInfo = (id) => doctors[id] || { name: `Doctor ID: ${id}`, specialization: 'Specialist' };

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
        const error = await response.json();
        alert(error.error || 'Failed to cancel appointment');
      }
    } catch (err) {
      console.error('Cancel error:', err);
      alert('Something went wrong');
    }
  };

  const getFilteredAppointments = () => {
    const now = new Date();

    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_at);
      const docInfo = getDoctorInfo(apt.doctor_id);
      const matchesSearch = docInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.doctor_id.toString().includes(searchQuery);

      if (!matchesSearch) return false;

      if (activeTab === 'upcoming') {
        return apt.status !== 'cancelled' && apt.status !== 'completed' && aptDate >= now;
      } else if (activeTab === 'history') {
        return apt.status === 'completed' || (apt.status !== 'cancelled' && aptDate < now);
      } else if (activeTab === 'cancelled') {
        return apt.status === 'cancelled';
      }
      return true;
    });
  };

  const filteredList = getFilteredAppointments();

  // --- (Existing Modals & Badges helpers unchanged) ---
  const openRatingModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowRatingModal(true);
    setRating(0);
    setReview('');
  };

  const submitRating = async () => {
    // ... (Same logic as before)
    if (rating === 0) { alert('Please select a rating'); return; }
    setSubmittingRating(true);
    try {
      const response = await apiCall(`${USER_API}/doctor/${selectedAppointment.doctor_id}/rate/`,
        { method: 'POST', body: JSON.stringify({ rating, review }) }
      );
      if (response.ok) {
        alert('Thank you for your feedback! ⭐');
        setShowRatingModal(false);
        setSelectedAppointment(null);
        fetchAppointments();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to submit rating');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Payment Pending' },
      confirmed: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', label: 'Confirmed' },
      completed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Completed' },
      cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Cancelled' },
    };
    return badges[status] || badges.pending;
  };

  const getPriorityBadge = (appointment) => {
    if (!appointment.severity_level) return null;
    if (appointment.severity_level >= 20) return { bg: 'bg-rose-50', text: 'text-rose-700', label: 'High Priority' };
    else if (appointment.severity_level >= 10) return { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Medium Priority' };
    return null;
  };

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

  const RatingModal = () => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Rate Experience</h3>
        {/* ... (Rating Modal Content Same as before) */}
        <p className="text-gray-500 mb-8">How was your session with the doctor?</p>
        <div className="flex justify-center space-x-2 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => setRating(star)} className="focus:outline-none transform transition hover:scale-110 active:scale-95">
              <Star className={`w-10 h-10 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
            </button>
          ))}
        </div>
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Share your feedback</label>
          <textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Tell us about your experience..." className="w-full border border-gray-200 rounded-xl p-4 bg-gray-50 text-gray-900" rows="4" />
        </div>
        <div className="flex space-x-3">
          <button onClick={() => { setShowRatingModal(false); setSelectedAppointment(null); }} className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50">Cancel</button>
          <button onClick={submitRating} disabled={submittingRating || rating === 0} className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition">Submit</button>
        </div>
      </div>
    </div>
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
              <p className="text-xs text-gray-400 font-medium">Patient Portal</p>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu</p>
            <NavItem icon={Home} label="Overview" view="user-dashboard" />
            <NavItem icon={Calendar} label="Appointments" view="my-appointments" active={true} />
            <NavItem icon={Clock} label="Book Session" view="book-appointment" />
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Wellness</p>
            <NavItem icon={Activity} label="Assessment" view="severity-assessment" />
            <NavItem icon={Smile} label="Mood Tracker" view="mood-tracker" />
            <NavItem icon={FileText} label="Treatment Plan" view="treatment-plan" />
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
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'User'}</p>
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
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-50/50 to-transparent pointer-events-none -z-10"></div>

          <div className="max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">My Appointments</h2>
                  <p className="text-gray-500">Track your upcoming sessions and history.</p>
                </div>
                <button onClick={() => setCurrentView('book-appointment')} className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-teal-600 shadow-lg transition-all flex items-center gap-2 text-sm justify-center">
                  <Clock className="w-4 h-4" /> Book Session
                </button>
              </div>

              {/* Controls Bar: Search & Tabs */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                {/* Tabs */}
                <div className="flex items-center bg-gray-50 rounded-xl p-1 w-full md:w-auto">
                  {['upcoming', 'history', 'cancelled'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all flex-1 md:flex-none ${activeTab === tab ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by doctor name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:bg-white focus:border-teal-200 focus:ring-2 focus:ring-teal-100 rounded-xl text-sm transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto"></div>
                <p className="text-gray-500 mt-4 text-sm font-medium">Updating list...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No {activeTab} appointments found</h3>
                <p className="text-gray-500 text-sm">Try changing filters or book a new session.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredList.map((apt) => {
                  const statusBadge = getStatusBadge(apt.status);
                  const docInfo = getDoctorInfo(apt.doctor_id);
                  const isPast = new Date(apt.scheduled_at) < new Date();

                  return (
                    <div key={apt.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        {/* Left Info */}
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 border border-white shadow-sm flex-shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg leading-tight">{docInfo.name}</h3>
                            <p className="text-teal-600 text-sm font-medium">{docInfo.specialization || 'Specialist'}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <span className="bg-gray-50 px-2 py-0.5 rounded border border-gray-200">ID: {apt.doctor_id}</span>
                              <span>•</span>
                              <span>Pay: <span className="capitalize text-gray-700 font-medium">{apt.payment_status || 'Pending'}</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Right Stats & Actions */}
                        <div className="flex-1 md:text-right flex flex-col items-start md:items-end justify-between">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>{statusBadge.label}</span>
                          </div>
                          <div className="text-right mb-4">
                            <p className="text-xl font-bold text-gray-900">
                              {new Date(apt.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-sm text-gray-500 font-medium">
                              {new Date(apt.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 w-full md:w-auto mt-2">
                            {/* Action Logic */}
                            {apt.status === 'pending' && !isPast && (
                              <button onClick={() => cancelAppointment(apt.id)} className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg transition border border-transparent hover:border-rose-100 flex-1 md:flex-none">Cancel</button>
                            )}
                            {apt.status === 'confirmed' && (
                              <>
                                <button onClick={() => { onJoinVideo ? onJoinVideo(apt.id) : setCurrentView('video-consultation') }} className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition shadow-sm flex-1 md:flex-none text-center">Join Call</button>
                                <button onClick={() => { onViewChat ? onViewChat(apt.id) : setCurrentView('real-time-chat') }} className="text-xs font-bold text-white bg-teal-500 hover:bg-teal-600 px-4 py-2 rounded-lg transition shadow-sm flex-1 md:flex-none text-center">Chat</button>
                              </>
                            )}
                            {apt.status === 'completed' && (
                              <button onClick={() => openRatingModal(apt)} className="text-xs font-bold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 px-3 py-2 rounded-lg transition border border-yellow-200 flex-1 md:flex-none">Rate</button>
                            )}
                            <button onClick={() => onViewDetail ? onViewDetail(apt.id) : setCurrentView('appointment-detail')} className="text-xs font-bold text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg transition border border-gray-200 flex-1 md:flex-none">Details</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Rating Modal */}
      {showRatingModal && <RatingModal />}
    </div>
  );
};

export default MyAppointments;