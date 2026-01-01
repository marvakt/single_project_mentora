
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Calendar, Clock, User, ArrowLeft, Video, FileText,
  DollarSign, Activity, MessageSquare, Phone, Mail,
  CheckCircle, AlertCircle, XCircle, Heart, Home, Smile,
  Settings, LogOut, Menu, Star, X
} from 'lucide-react';
import { APPOINTMENT_API, USER_API, apiCall } from '../../config/api';
import { logout } from '../../store/slices/authSlice';
import { setCurrentView } from '../../store/slices/uiSlice';
import { fetchAppointmentDetail } from '../../store/slices/appointmentsSlice';


const AppointmentDetail = ({
  appointmentId,
  onProcessPayment,
  onJoinVideo,
  onViewChat
}) => {
  const dispatch = useDispatch();

  // Redux selectors
  const { user } = useSelector((state) => state.auth);
  const { selectedAppointment, loading: appointmentLoading } = useSelector((state) => state.appointments);

  // Local state
  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Use selectedAppointment from Redux or fetch if needed
  const appointment = selectedAppointment?.id === appointmentId ? selectedAppointment : null;

  useEffect(() => {
    if (appointmentId && !appointment) {
      dispatch(fetchAppointmentDetail(appointmentId));
    }
  }, [appointmentId, appointment, dispatch]);

  useEffect(() => {
    if (appointment?.doctor_id) {
      fetchDoctorDetails(appointment.doctor_id);
    }
  }, [appointment?.doctor_id]);



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
        dispatch(fetchAppointmentDetail(appointmentId));
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

  const handleLogout = () => {
    dispatch(logout());
    dispatch(setCurrentView('landing'));
  };

  const handleNavigation = (view) => {
    dispatch(setCurrentView(view));
    setSidebarOpen(false);
  };

  const submitReview = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await apiCall(
        `${USER_API}/doctor/${appointment.doctor_id}/rate/`,
        {
          method: 'POST',
          body: JSON.stringify({
            rating: rating,
            review: reviewText
          })
        }
      );

      if (response.ok) {
        alert('Thank you for your review!');
        setShowReviewModal(false);
        setHasReviewed(true);
        setRating(0);
        setReviewText('');
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Review submission error:', err);
      alert('Something went wrong');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'bg-amber-100 text-amber-800', text: 'Pending Payment' },
      confirmed: { class: 'bg-teal-100 text-teal-800', text: 'Confirmed' },
      completed: { class: 'bg-blue-100 text-blue-800', text: 'Completed' },
      cancelled: { class: 'bg-rose-100 text-rose-800', text: 'Cancelled' },
    };
    return badges[status] || badges.pending;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: { class: 'bg-rose-100 text-rose-800', text: 'High Priority' },
      medium: { class: 'bg-orange-100 text-orange-800', text: 'Medium Priority' },
      normal: { class: 'bg-emerald-100 text-emerald-800', text: 'Normal Priority' },
    };
    return badges[priority] || badges.normal;
  };

  // Sidebar Nav Item Helper (Consistent with other pages)
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

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 relative">
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-50/50 to-transparent pointer-events-none -z-10"></div>

          <div className="max-w-6xl mx-auto">
            {/* Back Link */}
            <button
              onClick={() => setCurrentView('my-appointments')}
              className="flex items-center space-x-2 text-gray-500 hover:text-teal-600 font-semibold mb-6 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Appointments</span>
            </button>

            {appointmentLoading || !appointment ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                <p className="text-gray-500 mt-4 font-medium">Loading details...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-gray-100">
                <AlertCircle className="w-16 h-16 text-rose-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Appointment</h3>
                <p className="text-gray-500 mb-6">{error}</p>
                <button onClick={() => setCurrentView('my-appointments')} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition">Back to List</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Header Card */}
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50 pointer-events-none"></div>
                    <div className="relative">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Session Details</h1>
                          <p className="text-gray-500">Scheduled for <span className="font-semibold text-teal-700">{appointment?.scheduled_at ? new Date(appointment.scheduled_at).toLocaleDateString() : 'N/A'}</span></p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider ${getStatusBadge(appointment?.status).class}`}>
                            {getStatusBadge(appointment.status).text}
                          </span>
                        </div>
                      </div>

                      <div className="w-full h-px bg-gray-100 my-6"></div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-teal-600">
                            <Clock className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Time</p>
                            <p className="text-lg font-bold text-gray-900">{new Date(appointment.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-teal-600">
                            <DollarSign className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Fee</p>
                            <p className="text-lg font-bold text-gray-900">₹{appointment.amount || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Profile Card */}
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Your Specialist</h2>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white">
                        {doctor?.name?.charAt(0) || 'D'}
                      </div>
                      <div className="text-center md:text-left flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{doctor?.name || 'Doctor'}</h3>
                        <p className="text-teal-600 font-semibold mb-2">{doctor?.specialization || 'Mental Health Specialist'}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                          {doctor?.experience_years && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                              {doctor.experience_years} Years Exp.
                            </span>
                          )}
                        </div>
                        {doctor?.bio && <p className="text-gray-600 mt-4 text-sm leading-relaxed max-w-xl">{doctor.bio}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Notes Card */}
                  {appointment.notes && (
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Initial Notes</h2>
                      <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-50">
                        <p className="text-gray-700 leading-relaxed italic">"{appointment.notes}"</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar Column (Actions) */}
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-teal-600" /> Actions
                    </h2>

                    <div className="space-y-3">
                      {/* 1. Chat */}
                      <button
                        onClick={() => { onViewChat ? onViewChat(appointment.id) : setCurrentView('real-time-chat') }}
                        className="w-full bg-teal-50 text-teal-700 p-4 rounded-xl hover:bg-teal-100 transition flex items-center justify-between group font-semibold border border-teal-100"
                      >
                        <span className="flex items-center gap-3">
                          <MessageSquare className="w-5 h-5" /> Chat w/ Doctor
                        </span>
                        <ArrowLeft className="w-4 h-4 rotate-180 opacity-0 group-hover:opacity-100 transition" />
                      </button>

                      {/* 2. Video Call */}
                      {appointment.status === 'confirmed' && (
                        appointment.video_session && appointment.video_session.doctor_approved ? (
                          <button
                            onClick={() => onJoinVideo(appointment.id)}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition flex items-center justify-center gap-2 font-semibold"
                          >
                            <Video className="w-5 h-5" /> Join Video Session
                          </button>
                        ) : (
                          <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-center text-sm border border-amber-100">
                            <p className="font-semibold mb-1">Waiting for approval</p>
                            <p className="opacity-80">Doctor must start the session first.</p>
                          </div>
                        )
                      )}

                      {/* 3. Payment */}
                      {appointment.status === 'pending' && (
                        <button
                          onClick={() => onProcessPayment(appointment.id, appointment.amount)}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition flex items-center justify-center gap-2 font-semibold"
                        >
                          <DollarSign className="w-5 h-5" /> Complete Payment
                        </button>
                      )}

                      {/* 4. Write Review (for completed appointments) */}
                      {appointment.status === 'completed' && !hasReviewed && (
                        <button
                          onClick={() => setShowReviewModal(true)}
                          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-4 rounded-xl hover:shadow-lg hover:shadow-amber-500/25 transition flex items-center justify-center gap-2 font-semibold"
                        >
                          <Star className="w-5 h-5" /> Write Review
                        </button>
                      )}

                      {/* Show reviewed badge */}
                      {appointment.status === 'completed' && hasReviewed && (
                        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-center text-sm border border-emerald-100">
                          <p className="font-semibold flex items-center justify-center gap-2">
                            <CheckCircle className="w-4 h-4" /> Review Submitted
                          </p>
                          <p className="opacity-80 text-xs mt-1">Thank you for your feedback!</p>
                        </div>
                      )}

                      {/* 5. Cancel */}
                      {appointment.status === 'pending' && (
                        <button
                          onClick={cancelAppointment}
                          disabled={cancelling}
                          className="w-full mt-4 text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-3 rounded-xl transition text-sm font-semibold flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> {cancelling ? 'Cancelling...' : 'Cancel Appointment'}
                        </button>
                      )}

                      {/* 6. Info Box */}
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>Need help? Contact support if you have issues connecting.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Rate Your Experience</h2>
            <p className="text-gray-500 mb-6">How was your session with Dr. {doctor?.name}?</p>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${star <= (hoverRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                      }`}
                  />
                </button>
              ))}
            </div>

            {rating > 0 && (
              <p className="text-center text-sm font-semibold text-gray-700 mb-4">
                {rating === 1 && '😞 Poor'}
                {rating === 2 && '😕 Fair'}
                {rating === 3 && '😐 Good'}
                {rating === 4 && '😊 Very Good'}
                {rating === 5 && '🤩 Excellent'}
              </p>
            )}

            {/* Review Text */}
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience (optional)..."
              className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none mb-6"
              rows="4"
            />

            {/* Submit Button */}
            <button
              onClick={submitReview}
              disabled={submittingReview || rating === 0}
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetail;