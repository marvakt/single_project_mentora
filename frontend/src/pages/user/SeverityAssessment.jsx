import React, { useState } from 'react';
import { Heart, ArrowRight, AlertCircle } from 'lucide-react';
import { MEDICAL_API, apiCall } from '../../config/api';

const SeverityAssessment = ({ user, token, setCurrentView }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const [formData, setFormData] = useState({
    mood_score: 5,
    sleep_quality: 5,
    appetite_level: 5,
    stress_level: 5,
    anxiety_level: 5,
    emotional_stability: 5,
    energy_level: 5,
    self_harm_indicator: false,
    anger_issues: false,
    social_withdrawal: false,
  });

  const handleSliderChange = (field, value) => {
    setFormData({ ...formData, [field]: parseInt(value) });
  };

  const handleCheckboxChange = (field) => {
    setFormData({ ...formData, [field]: !formData[field] });
  };

  const submitAssessment = async () => {
    setLoading(true);
    try {
      const response = await apiCall(`${MEDICAL_API}/medical/severity`, {
        method: 'POST',
        body: JSON.stringify({
          score: Math.floor(
            (formData.stress_level + formData.anxiety_level + (10 - formData.mood_score)) / 3
          ),
          level: 'pending', // Backend will calculate
          notes: JSON.stringify(formData)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setStep(3);
      } else {
        alert('Failed to submit assessment');
      }
    } catch (err) {
      console.error('Assessment error:', err);
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600">Step {step} of 3</span>
            <span className="text-sm text-gray-600">{Math.round((step / 3) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Mental Health Assessment */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <Heart className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Mental Health Assessment</h2>
              <p className="text-gray-600">Help us understand how you're feeling</p>
            </div>

            <div className="space-y-6">
              {/* Mood Score */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  How would you rate your mood today? ({formData.mood_score}/10)
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={formData.mood_score}
                  onChange={(e) => handleSliderChange('mood_score', e.target.value)}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Very Low</span>
                  <span>Excellent</span>
                </div>
              </div>

              {/* Sleep Quality */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sleep Quality ({formData.sleep_quality}/10)
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={formData.sleep_quality}
                  onChange={(e) => handleSliderChange('sleep_quality', e.target.value)}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Very Poor</span>
                  <span>Excellent</span>
                </div>
              </div>

              {/* Appetite Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Appetite Level ({formData.appetite_level}/10)
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={formData.appetite_level}
                  onChange={(e) => handleSliderChange('appetite_level', e.target.value)}
                  className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Very Low</span>
                  <span>Normal</span>
                </div>
              </div>

              {/* Energy Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Energy Level ({formData.energy_level}/10)
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={formData.energy_level}
                  onChange={(e) => handleSliderChange('energy_level', e.target.value)}
                  className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Very Low</span>
                  <span>Very High</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setStep(2)}
              className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center space-x-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Mental Health Indicators */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <AlertCircle className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Mental Health Indicators</h2>
              <p className="text-gray-600">Help us understand your symptoms</p>
            </div>

            <div className="space-y-6">
              {/* Stress Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stress Level ({formData.stress_level}/10)
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={formData.stress_level}
                  onChange={(e) => handleSliderChange('stress_level', e.target.value)}
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Very Low</span>
                  <span>Very High</span>
                </div>
              </div>

              {/* Anxiety Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Anxiety Level ({formData.anxiety_level}/10)
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={formData.anxiety_level}
                  onChange={(e) => handleSliderChange('anxiety_level', e.target.value)}
                  className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Very Low</span>
                  <span>Very High</span>
                </div>
              </div>

              {/* Emotional Stability */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Emotional Stability ({formData.emotional_stability}/10)
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={formData.emotional_stability}
                  onChange={(e) => handleSliderChange('emotional_stability', e.target.value)}
                  className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Very Unstable</span>
                  <span>Very Stable</span>
                </div>
              </div>

              {/* Critical Indicators */}
              <div className="border-t pt-6 mt-6">
                <p className="text-sm font-semibold text-gray-700 mb-4">Critical Indicators (Check if applicable)</p>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.self_harm_indicator}
                      onChange={() => handleCheckboxChange('self_harm_indicator')}
                      className="w-5 h-5 text-purple-600"
                    />
                    <span className="text-gray-700">Thoughts of self-harm</span>
                  </label>

                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.anger_issues}
                      onChange={() => handleCheckboxChange('anger_issues')}
                      className="w-5 h-5 text-purple-600"
                    />
                    <span className="text-gray-700">Difficulty controlling anger</span>
                  </label>

                  <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.social_withdrawal}
                      onChange={() => handleCheckboxChange('social_withdrawal')}
                      className="w-5 h-5 text-purple-600"
                    />
                    <span className="text-gray-700">Withdrawing from social activities</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button 
                onClick={submitAssessment}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Submit Assessment'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && result && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
                result.level === 'severe' ? 'bg-red-100' :
                result.level === 'moderate' ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                <Heart className={`w-12 h-12 ${
                  result.level === 'severe' ? 'text-red-600' :
                  result.level === 'moderate' ? 'text-yellow-600' : 'text-green-600'
                }`} />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Assessment Complete</h2>
              <p className="text-gray-600">Here are your results</p>
            </div>

            <div className="space-y-6">
              {/* Severity Level */}
              <div className={`p-6 rounded-xl ${
                result.level === 'severe' ? 'bg-red-50 border border-red-200' :
                result.level === 'moderate' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-green-50 border border-green-200'
              }`}>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Severity Level</h3>
                <p className={`text-2xl font-bold ${
                  result.level === 'severe' ? 'text-red-600' :
                  result.level === 'moderate' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {result.level.toUpperCase()}
                </p>
                <p className="text-gray-600 mt-2">Score: {result.score}/100</p>
              </div>

              {/* Recommended Specialist */}
              <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Recommended Specialist</h3>
                <p className="text-purple-600 font-semibold text-xl">
                  {result.level === 'severe' ? 'Psychiatrist' :
                   result.level === 'moderate' ? 'Psychologist' : 'Counselor'}
                </p>
              </div>

              {/* Notes */}
              {result.notes && (
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Additional Notes</h3>
                  <p className="text-gray-700">{result.notes}</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => setCurrentView('user-dashboard')}
              className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeverityAssessment;
