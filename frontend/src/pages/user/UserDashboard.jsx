


// import React, { useState, useEffect } from 'react';
// import { Heart, Calendar, Clock, Bell, User, LogOut, Smile } from 'lucide-react';
// import { USER_API } from '../../config/api'

// const UserDashboard = ({ user, token, handleLogout, setCurrentView }) => {
//   const [profile, setProfile] = useState(null);
//   const [doctors, setDoctors] = useState([]);

//   useEffect(() => {
//     fetchProfile();
//     fetchDoctors();
//   }, []);

//   const fetchProfile = async () => {
//     try {
//       const response = await fetch(`${USER_API}/profile/${user.user_id}/`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (response.ok) {
//         const data = await response.json();
//         setProfile(data);
//       }
//     } catch (err) {
//       console.error('Failed to fetch profile', err);
//     }
//   };

//   const fetchDoctors = async () => {
//     try {
//       const response = await fetch(`${USER_API}/doctors/`);
//       if (response.ok) {
//         const data = await response.json();
//         setDoctors(data);
//       }
//     } catch (err) {
//       console.error('Failed to fetch doctors', err);
//     }
//   };

//   return (
//     <div className="min-h-screen">
//       {/* Navbar */}
//       <nav className="bg-white shadow-lg">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center space-x-2">
//               <Heart className="w-8 h-8 text-purple-600" />
//               <span className="text-xl font-bold text-gray-800">Mentora</span>
//             </div>
//             <div className="flex items-center space-x-4">
//               <Bell className="w-6 h-6 text-gray-600 cursor-pointer hover:text-purple-600" />
//               <button 
//                 onClick={() => setCurrentView('user-profile')} 
//                 className="flex items-center space-x-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
//               >
//                 <User className="w-5 h-5" />
//                 <span className="hidden md:inline">{profile?.name || 'Profile'}</span>
//               </button>
//               <button 
//                 onClick={handleLogout} 
//                 className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition"
//               >
//                 <LogOut className="w-5 h-5" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-4 py-8">
//         {/* Welcome Section */}
//         <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
//           <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.name || 'User'}!</h1>
//           <p className="text-purple-100">Continue your wellness journey with Mentora</p>
//         </div>

//         {/* Quick Stats */}
//         <div className="grid md:grid-cols-3 gap-6 mb-8">
//           <div className="bg-white rounded-xl p-6 shadow-lg">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-gray-600 text-sm">Total Sessions</p>
//                 <p className="text-3xl font-bold text-purple-600">0</p>
//               </div>
//               <Calendar className="w-12 h-12 text-purple-600 opacity-20" />
//             </div>
//           </div>
//           <div className="bg-white rounded-xl p-6 shadow-lg">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-gray-600 text-sm">Mood Score</p>
//                 <p className="text-3xl font-bold text-green-600">--</p>
//               </div>
//               <Heart className="w-12 h-12 text-green-600 opacity-20" />
//             </div>
//           </div>
//           <div className="bg-white rounded-xl p-6 shadow-lg">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-gray-600 text-sm">Next Appointment</p>
//                 <p className="text-lg font-bold text-gray-800">No upcoming</p>
//               </div>
//               <Clock className="w-12 h-12 text-blue-600 opacity-20" />
//             </div>
//           </div>
//         </div>

//         {/* Medical & Appointment Features */}
//         <div className="grid md:grid-cols-2 gap-6 mb-8">
//           <button
//             onClick={() => setCurrentView('severity-assessment')}
//             className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition text-left"
//           >
//             <Heart className="w-10 h-10 mb-3" />
//             <h3 className="text-xl font-bold mb-2">Mental Health Assessment</h3>
//             <p className="text-purple-100">Take SRTS assessment to find the right specialist</p>
//           </button>

//           <button
//             onClick={() => setCurrentView('mood-tracker')}
//             className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition text-left"
//           >
//             <Smile className="w-10 h-10 mb-3" />
//             <h3 className="text-xl font-bold mb-2">Mood Tracker</h3>
//             <p className="text-blue-100">Log your daily mood and track your progress</p>
//           </button>

//           <button
//             onClick={() => setCurrentView('book-appointment')}
//             className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition text-left"
//           >
//             <Calendar className="w-10 h-10 mb-3" />
//             <h3 className="text-xl font-bold mb-2">Book Appointment</h3>
//             <p className="text-green-100">Schedule a consultation with verified specialists</p>
//           </button>

//           <button
//             onClick={() => setCurrentView('my-appointments')}
//             className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition text-left"
//           >
//             <Clock className="w-10 h-10 mb-3" />
//             <h3 className="text-xl font-bold mb-2">My Appointments</h3>
//             <p className="text-orange-100">View and manage your scheduled appointments</p>
//           </button>
//         </div>

//         {/* Available Doctors */}
//         <div className="bg-white rounded-xl p-6 shadow-lg">
//           <h2 className="text-2xl font-bold mb-6 text-gray-800">Available Doctors</h2>
//           {doctors.length === 0 ? (
//             <p className="text-gray-600">No doctors available at the moment.</p>
//           ) : (
//             <div className="grid md:grid-cols-2 gap-4">
//               {doctors.map((doctor, idx) => (
//                 <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
//                   <h3 className="font-bold text-lg text-gray-800">{doctor.name}</h3>
//                   <p className="text-purple-600">{doctor.specialization}</p>
//                   <p className="text-gray-600 text-sm mt-2">{doctor.experience_years} years experience</p>
//                   <div className="flex items-center justify-between mt-4">
//                     <span className="text-green-600 font-semibold">₹{doctor.consultation_fee}</span>
//                     <button 
//                       onClick={() => setCurrentView('book-appointment')}
//                       className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
//                     >
//                       Book Now
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserDashboard;



// src/pages/user/UserDashboard.jsx - UPDATED WITH MEDICAL SERVICE FEATURES
import React, { useState, useEffect } from 'react';
import {
  Heart, Calendar, Clock, Bell, User, LogOut, Smile,
  MessageSquare, FileText, TrendingUp, Activity
} from 'lucide-react';
import { USER_API, MEDICAL_API, apiCall } from '../../config/api';

const UserDashboard = ({ user, token, handleLogout, setCurrentView }) => {
  const [profile, setProfile] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [latestAssessment, setLatestAssessment] = useState(null);
  const [moodSummary, setMoodSummary] = useState(null);
  const [treatmentPlan, setTreatmentPlan] = useState(null);

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
        // If assessment exists, fetch matching doctors based on severity
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
      // Fallback to all doctors handled by initial fetchDoctors call
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

  const getSeverityColor = (level) => {
    if (!level) return 'gray';
    if (level === 'severe' || level === 'moderately_severe') return 'red';
    if (level === 'moderate') return 'yellow';
    return 'green';
  };

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Heart className="w-8 h-8 text-purple-600" />
              <span className="text-xl font-bold text-gray-800">Mentora</span>
            </div>
            <div className="flex items-center space-x-4">
              <Bell className="w-6 h-6 text-gray-600 cursor-pointer hover:text-purple-600" />
              <button
                onClick={() => setCurrentView('user-profile')}
                className="flex items-center space-x-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
              >
                <User className="w-5 h-5" />
                <span className="hidden md:inline">{profile?.name || 'Profile'}</span>
              </button>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.name || 'User'}!</h1>
          <p className="text-purple-100">Continue your wellness journey with Mentora</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Mental Health</p>
                {latestAssessment ? (
                  <>
                    <p className={`text-2xl font-bold text-${getSeverityColor(latestAssessment.severity_level)}-600`}>
                      {latestAssessment.raw_score}/27
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {latestAssessment.severity_level?.replace('_', ' ')}
                    </p>
                  </>
                ) : (
                  <p className="text-xl font-bold text-gray-400">Not Assessed</p>
                )}
              </div>
              <Activity className={`w-12 h-12 opacity-20 text-${getSeverityColor(latestAssessment?.severity_level)}-600`} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Mood Score</p>
                {moodSummary ? (
                  <>
                    <p className="text-3xl font-bold text-green-600">{moodSummary.average_mood}/10</p>
                    <p className="text-xs text-gray-500 capitalize">{moodSummary.mood_trend}</p>
                  </>
                ) : (
                  <p className="text-xl font-bold text-gray-400">--</p>
                )}
              </div>
              <Heart className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Sessions</p>
                <p className="text-3xl font-bold text-purple-600">0</p>
              </div>
              <Calendar className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Next Appointment</p>
                <p className="text-lg font-bold text-gray-800">No upcoming</p>
              </div>
              <Clock className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Treatment Plan Alert */}
        {treatmentPlan && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Active Treatment Plan</h3>
                  <p className="text-gray-600">{treatmentPlan.plan_title}</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('treatment-plan')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                View Plan
              </button>
            </div>
          </div>
        )}

        {/* Medical & Appointment Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => setCurrentView('severity-assessment')}
            className="bg-gradient-to-br from-purple-600 to-pink-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition text-left transform hover:scale-105"
          >
            <Activity className="w-10 h-10 mb-3" />
            <h3 className="text-xl font-bold mb-2">Mental Health Assessment</h3>
            <p className="text-purple-100 text-sm">Take PHQ-9 questionnaire for severity evaluation</p>
            {latestAssessment && (
              <p className="mt-3 text-xs text-purple-200">
                Last: {new Date(latestAssessment.created_at).toLocaleDateString()}
              </p>
            )}
          </button>

          <button
            onClick={() => setCurrentView('mood-tracker')}
            className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition text-left transform hover:scale-105"
          >
            <Smile className="w-10 h-10 mb-3" />
            <h3 className="text-xl font-bold mb-2">Mood Tracker</h3>
            <p className="text-blue-100 text-sm">Log daily mood with AI-powered insights</p>
            {moodSummary && (
              <p className="mt-3 text-xs text-blue-200">
                7-day avg: {moodSummary.average_mood}/10
              </p>
            )}
          </button>



          <button
            onClick={() => setCurrentView('treatment-plan')}
            className="bg-gradient-to-br from-teal-600 to-cyan-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition text-left transform hover:scale-105"
          >
            <FileText className="w-10 h-10 mb-3" />
            <h3 className="text-xl font-bold mb-2">Treatment Plan</h3>
            <p className="text-teal-100 text-sm">View your personalized therapy roadmap</p>
            {treatmentPlan && (
              <p className="mt-3 text-xs text-teal-200">
                Active: {treatmentPlan.duration_weeks} weeks
              </p>
            )}
          </button>

          <button
            onClick={() => setCurrentView('book-appointment')}
            className="bg-gradient-to-br from-green-600 to-emerald-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition text-left transform hover:scale-105"
          >
            <Calendar className="w-10 h-10 mb-3" />
            <h3 className="text-xl font-bold mb-2">Book Appointment</h3>
            <p className="text-green-100 text-sm">Schedule consultation with specialists</p>
          </button>

          <button
            onClick={() => setCurrentView('my-appointments')}
            className="bg-gradient-to-br from-orange-600 to-red-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition text-left transform hover:scale-105"
          >
            <Clock className="w-10 h-10 mb-3" />
            <h3 className="text-xl font-bold mb-2">My Appointments</h3>
            <p className="text-orange-100 text-sm">View and manage scheduled sessions</p>
          </button>
        </div>

        {/* Available Doctors */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Recommended Mental Health Professionals</h2>
          {doctors.length === 0 ? (
            <p className="text-gray-600">Loading doctors...</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {doctors.slice(0, 4).map((doctor, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <h3 className="font-bold text-lg text-gray-800">{doctor.name}</h3>
                  <p className="text-purple-600">{doctor.specialization}</p>
                  <p className="text-gray-600 text-sm mt-2">{doctor.experience_years} years experience</p>
                  {doctor.average_rating && (
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm text-gray-600">{doctor.average_rating} / 5.0</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-green-600 font-semibold">₹{doctor.consultation_fee}</span>
                    <button
                      onClick={() => setCurrentView('book-appointment')}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;