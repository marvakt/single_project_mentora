import React, { useState, useEffect } from 'react';
import { Heart, Calendar, CheckCircle, Clock, TrendingUp, FileText } from 'lucide-react';
import { MEDICAL_API, apiCall } from '../../config/api';

const TreatmentPlan = ({ user, token, setCurrentView }) => {
  const [plan, setPlan] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

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
      }
    } catch (err) {
      console.error('Failed to fetch treatment plan:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your treatment plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button 
            onClick={() => setCurrentView('user-dashboard')}
            className="text-purple-600 hover:text-purple-800 font-semibold"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!plan ? (
          // No Treatment Plan
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Active Treatment Plan</h2>
            <p className="text-gray-600 mb-8">
              You don't have an active treatment plan yet. Complete your severity assessment and book an appointment with a specialist to get started.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setCurrentView('severity-assessment')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
              >
                Take Assessment
              </button>
              <button
                onClick={() => setCurrentView('book-appointment')}
                className="border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition"
              >
                Book Appointment
              </button>
            </div>
          </div>
        ) : (
          // Active Treatment Plan
          <div className="space-y-6">
            {/* Plan Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
              <h1 className="text-3xl font-bold mb-2">{plan.plan_title}</h1>
              <p className="text-purple-100">Created by Dr. {plan.doctor_name || 'Your Therapist'}</p>
              <div className="flex items-center space-x-6 mt-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{plan.duration_weeks} weeks</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{plan.therapy_frequency}</span>
                </div>
              </div>
            </div>

            {/* Progress */}
            {progress && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Treatment Progress</h2>
                  <span className="text-3xl font-bold text-purple-600">{progress.percentage}%</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Weeks Completed</p>
                    <p className="text-2xl font-bold text-purple-600">{progress.weeks_elapsed}</p>
                  </div>
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Weeks Remaining</p>
                    <p className="text-2xl font-bold text-pink-600">{progress.weeks_remaining}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Plan Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-purple-600" />
                Treatment Details
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{plan.plan_details}</p>
              </div>
            </div>

            {/* Goals */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
                Treatment Goals
              </h2>
              <ul className="space-y-3">
                {plan.goals.map((goal, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{goal}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Heart className="w-6 h-6 mr-2 text-pink-600" />
                Recommendations
              </h2>
              <ul className="space-y-3">
                {plan.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <span className="text-pink-600 font-bold flex-shrink-0">•</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Lifestyle Changes */}
            {plan.lifestyle_changes && plan.lifestyle_changes.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Lifestyle Modifications</h2>
                <ul className="space-y-3">
                  {plan.lifestyle_changes.map((change, idx) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Medication Notes */}
            {plan.medication_notes && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Medication Notes</h3>
                <p className="text-gray-700">{plan.medication_notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TreatmentPlan;
