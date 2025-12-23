
// // ------------------------------
// // 3. src/pages/user/MyAppointments.jsx
// // ------------------------------
// import React, { useState, useEffect } from 'react';
// import { Calendar, Clock, User, ArrowLeft, XCircle, CheckCircle } from 'lucide-react';
// import { APPOINTMENT_API, apiCall } from '../../config/api';

// const MyAppointments = ({ user, token, setCurrentView }) => {
//   const [appointments, setAppointments] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchAppointments();
//   }, []);

//   const fetchAppointments = async () => {
//     setLoading(true);
//     try {
//       const response = await apiCall(`${APPOINTMENT_API}/appointments/`);
//       if (response.ok) {
//         const data = await response.json();
//         setAppointments(data);
//       }
//     } catch (err) {
//       console.error('Failed to fetch appointments:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const cancelAppointment = async (appointmentId) => {
//     if (!confirm('Are you sure you want to cancel this appointment?')) return;

//     try {
//       const response = await apiCall(
//         `${APPOINTMENT_API}/appointments/${appointmentId}/cancel/`,
//         { method: 'POST' }
//       );

//       if (response.ok) {
//         alert('Appointment cancelled successfully');
//         fetchAppointments();
//       } else {
//         alert('Failed to cancel appointment');
//       }
//     } catch (err) {
//       console.error('Cancel error:', err);
//       alert('Something went wrong');
//     }
//   };

//   const getStatusBadge = (status) => {
//     const badges = {
//       pending: 'bg-yellow-100 text-yellow-800',
//       confirmed: 'bg-blue-100 text-blue-800',
//       completed: 'bg-green-100 text-green-800',
//       cancelled: 'bg-red-100 text-red-800',
//     };
//     return badges[status] || badges.pending;
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
//       {/* Header */}
//       <div className="bg-white shadow-sm">
//         <div className="max-w-7xl mx-auto px-4 py-4">
//           <button 
//             onClick={() => setCurrentView('user-dashboard')}
//             className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 font-semibold"
//           >
//             <ArrowLeft className="w-5 h-5" />
//             <span>Back to Dashboard</span>
//           </button>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 py-8">
//         <h2 className="text-3xl font-bold text-gray-800 mb-6">My Appointments</h2>

//         {loading ? (
//           <div className="text-center py-12">
//             <p className="text-gray-600">Loading appointments...</p>
//           </div>
//         ) : appointments.length === 0 ? (
//           <div className="bg-white rounded-xl p-12 text-center">
//             <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//             <p className="text-gray-600 mb-4">No appointments yet</p>
//             <button 
//               onClick={() => setCurrentView('book-appointment')}
//               className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
//             >
//               Book Your First Appointment
//             </button>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {appointments.map((apt) => (
//               <div key={apt.id} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="flex items-center space-x-4">
//                     <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
//                       D
//                     </div>
//                     <div>
//                       <h3 className="font-bold text-gray-800">Doctor ID: {apt.doctor_id}</h3>
//                       <p className="text-gray-600 text-sm">Patient ID: {apt.user_id}</p>
//                     </div>
//                   </div>
//                   <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(apt.status)}`}>
//                     {apt.status.toUpperCase()}
//                   </span>
//                 </div>

//                 <div className="grid md:grid-cols-3 gap-4 mb-4">
//                   <div className="flex items-center space-x-2 text-gray-700">
//                     <Calendar className="w-5 h-5 text-purple-600" />
//                     <span>{new Date(apt.scheduled_at).toLocaleDateString()}</span>
//                   </div>
//                   <div className="flex items-center space-x-2 text-gray-700">
//                     <Clock className="w-5 h-5 text-purple-600" />
//                     <span>{new Date(apt.scheduled_at).toLocaleTimeString()}</span>
//                   </div>
//                   {apt.severity_level && (
//                     <div className="flex items-center space-x-2 text-gray-700">
//                       <span className="text-sm">Severity: <span className="font-semibold">{apt.severity_level}</span></span>
//                     </div>
//                   )}
//                 </div>

//                 {apt.status === 'pending' && (
//                   <button 
//                     onClick={() => cancelAppointment(apt.id)}
//                     className="flex items-center space-x-2 text-red-600 hover:text-red-800 font-semibold"
//                   >
//                     <XCircle className="w-5 h-5" />
//                     <span>Cancel Appointment</span>
//                   </button>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MyAppointments;



// src/pages/user/MyAppointments.jsx - ENHANCED WITH RATINGS & MEDICAL CONTEXT
import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, User, ArrowLeft, XCircle, CheckCircle,
  Star, Video, FileText, DollarSign, Activity, MessageSquare
} from 'lucide-react';
import { APPOINTMENT_API, USER_API, apiCall } from '../../config/api';

const MyAppointments = ({ user, token, setCurrentView, onViewDetail, onProcessPayment, onJoinVideo }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await apiCall(`${APPOINTMENT_API}/appointments/`);
      if (response.ok) {
        const data = await response.json();
        // Sort by date (most recent first)
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

  const openRatingModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowRatingModal(true);
    setRating(0);
    setReview('');
  };

  const submitRating = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmittingRating(true);
    try {
      // ✅ CORRECT: Send rating to USER SERVICE (not appointment service)
      const response = await apiCall(
        `${USER_API}/doctor/${selectedAppointment.doctor_id}/rate/`,
        {
          method: 'POST',
          body: JSON.stringify({
            rating: rating,
            review: review
          })
        }
      );

      if (response.ok) {
        alert('Thank you for your feedback! ⭐');
        setShowRatingModal(false);
        setSelectedAppointment(null);
        fetchAppointments(); // Refresh to show updated status
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to submit rating');
      }
    } catch (err) {
      console.error('Rating submission error:', err);
      alert('Something went wrong');
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'PENDING PAYMENT' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'CONFIRMED' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'COMPLETED' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'CANCELLED' },
    };
    return badges[status] || badges.pending;
  };

  const getPriorityBadge = (appointment) => {
    if (!appointment.severity_level) return null;

    if (appointment.severity_level >= 20) {
      return { bg: 'bg-red-50', text: 'text-red-700', label: 'High Priority' };
    } else if (appointment.severity_level >= 10) {
      return { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Medium Priority' };
    }
    return null;
  };

  const RatingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Rate Your Experience</h3>
        <p className="text-gray-600 mb-6">
          How was your session with the doctor?
        </p>

        {/* Star Rating */}
        <div className="flex justify-center space-x-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="focus:outline-none transform transition hover:scale-110"
            >
              <Star
                className={`w-12 h-12 ${star <= rating
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                  }`}
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <p className="text-center text-gray-700 font-semibold mb-4">
            {rating === 5 && '⭐ Excellent!'}
            {rating === 4 && '😊 Very Good!'}
            {rating === 3 && '👍 Good'}
            {rating === 2 && '😐 Fair'}
            {rating === 1 && '😞 Poor'}
          </p>
        )}

        {/* Review Text */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Share your experience (Optional)
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Tell us about your experience with the doctor..."
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            rows="4"
          />
        </div>

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setShowRatingModal(false);
              setSelectedAppointment(null);
            }}
            className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={submitRating}
            disabled={submittingRating || rating === 0}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submittingRating ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => setCurrentView('user-dashboard')}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-800">My Appointments</h2>
          <button
            onClick={() => setCurrentView('book-appointment')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
          >
            + Book New Appointment
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No appointments yet</p>
            <button
              onClick={() => setCurrentView('book-appointment')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Book Your First Appointment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => {
              const statusBadge = getStatusBadge(apt.status);
              const priorityBadge = getPriorityBadge(apt);
              const isPast = new Date(apt.scheduled_at) < new Date();

              return (
                <div key={apt.id} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                        Dr
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-lg">
                          Doctor ID: {apt.doctor_id}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Appointment ID: {apt.id?.substring(0, 8)}...
                        </p>
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
                      <Calendar className="w-5 h-5 text-purple-600" />
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
                      <Clock className="w-5 h-5 text-purple-600" />
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

                    {apt.payment_status && (
                      <div className="flex items-center space-x-2 text-gray-700">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-500">Payment</p>
                          <p className="font-semibold capitalize">{apt.payment_status}</p>
                        </div>
                      </div>
                    )}

                    {apt.severity_level && (
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500">Severity</p>
                          <p className="font-semibold">{apt.severity_level}/27</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {apt.notes && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-700">
                        <FileText className="w-4 h-4 inline mr-2 text-gray-500" />
                        <span className="font-semibold">Notes:</span> {apt.notes}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    {/* Cancel Button - Only for pending appointments */}
                    {apt.status === 'pending' && !isPast && (
                      <button
                        onClick={() => cancelAppointment(apt.id)}
                        className="flex items-center space-x-2 text-red-600 hover:text-red-800 font-semibold px-4 py-2 border border-red-300 rounded-lg hover:bg-red-50 transition"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    )}

                    {/* Video Call Button - Only for confirmed appointments on the day */}
                    {apt.status === 'confirmed' && (
                      <button
                        onClick={() => {
                          if (onJoinVideo) {
                            onJoinVideo(apt.id);
                          } else {
                            setCurrentView('video-consultation');
                          }
                        }}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-semibold px-4 py-2 border border-blue-300 rounded-lg hover:bg-blue-50 transition"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Video Call</span>
                      </button>
                    )}

                    {/* Rate Doctor Button - Only for completed appointments */}
                    {apt.status === 'completed' && (
                      <button
                        onClick={() => openRatingModal(apt)}
                        className="flex items-center space-x-2 text-yellow-600 hover:text-yellow-800 font-semibold px-4 py-2 border border-yellow-300 rounded-lg hover:bg-yellow-50 transition"
                      >
                        <Star className="w-4 h-4" />
                        <span>Rate Doctor</span>
                      </button>
                    )}

                    {/* View Details Button */}
                    <button
                      onClick={() => {
                        if (onViewDetail) {
                          onViewDetail(apt.id);
                        } else {
                          setCurrentView('appointment-detail');
                        }
                      }}
                      className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 font-semibold px-4 py-2 border border-purple-300 rounded-lg hover:bg-purple-50 transition ml-auto"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && <RatingModal />}
    </div>
  );
};

export default MyAppointments;