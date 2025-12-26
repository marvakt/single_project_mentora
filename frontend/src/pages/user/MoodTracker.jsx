
// // 3. src/pages/user/MoodTracker.jsx
// // ------------------------------
// import React, { useState, useEffect } from 'react';
// import { Heart, Smile, Frown, Meh, TrendingUp } from 'lucide-react';
// import { MEDICAL_API, apiCall } from '../../config/api';

// const MoodTracker = ({ user, token, setCurrentView }) => {
//   const [moods, setMoods] = useState([]);
//   const [selectedMood, setSelectedMood] = useState('');
//   const [description, setDescription] = useState('');
//   const [loading, setLoading] = useState(false);

//   const moodOptions = [
//     { value: 'happy', label: 'Happy', icon: Smile, color: 'text-green-600', bg: 'bg-green-50' },
//     { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-yellow-600', bg: 'bg-yellow-50' },
//     { value: 'sad', label: 'Sad', icon: Frown, color: 'text-blue-600', bg: 'bg-blue-50' },
//     { value: 'anxious', label: 'Anxious', icon: Heart, color: 'text-purple-600', bg: 'bg-purple-50' },
//     { value: 'stressed', label: 'Stressed', icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50' },
//   ];

//   useEffect(() => {
//     fetchMoods();
//   }, []);

//   const fetchMoods = async () => {
//     try {
//       const response = await apiCall(`${MEDICAL_API}/medical/mood/recent`, {
//         method: 'GET'
//       });
//       if (response.ok) {
//         const data = await response.json();
//         setMoods(data);
//       }
//     } catch (err) {
//       console.error('Failed to fetch moods:', err);
//     }
//   };

//   const submitMood = async () => {
//     if (!selectedMood) {
//       alert('Please select a mood');
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await apiCall(`${MEDICAL_API}/medical/mood`, {
//         method: 'POST',
//         body: JSON.stringify({ mood: selectedMood, description })
//       });

//       if (response.ok) {
//         alert('Mood logged successfully!');
//         setSelectedMood('');
//         setDescription('');
//         fetchMoods();
//       } else {
//         alert('Failed to log mood');
//       }
//     } catch (err) {
//       console.error('Mood log error:', err);
//       alert('Something went wrong');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
//       {/* Header */}
//       <div className="bg-white shadow-sm">
//         <div className="max-w-4xl mx-auto px-4 py-4">
//           <button 
//             onClick={() => setCurrentView('user-dashboard')}
//             className="text-purple-600 hover:text-purple-800 font-semibold"
//           >
//             ← Back to Dashboard
//           </button>
//         </div>
//       </div>

//       <div className="max-w-4xl mx-auto px-4 py-8">
//         {/* Log New Mood */}
//         <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
//           <h2 className="text-2xl font-bold text-gray-800 mb-6">How are you feeling?</h2>
          
//           <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
//             {moodOptions.map((mood) => {
//               const Icon = mood.icon;
//               return (
//                 <button
//                   key={mood.value}
//                   onClick={() => setSelectedMood(mood.value)}
//                   className={`p-6 rounded-xl border-2 transition ${
//                     selectedMood === mood.value
//                       ? `${mood.bg} border-current ${mood.color}`
//                       : 'border-gray-200 hover:bg-gray-50'
//                   }`}
//                 >
//                   <Icon className={`w-8 h-8 mx-auto mb-2 ${selectedMood === mood.value ? mood.color : 'text-gray-400'}`} />
//                   <p className="text-sm font-semibold text-gray-700">{mood.label}</p>
//                 </button>
//               );
//             })}
//           </div>

//           <textarea
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             placeholder="How are you feeling? (optional)"
//             className="w-full border rounded-lg p-4 mb-4"
//             rows="3"
//           />

//           <button 
//             onClick={submitMood}
//             disabled={loading || !selectedMood}
//             className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
//           >
//             {loading ? 'Logging...' : 'Log Mood'}
//           </button>
//         </div>

//         {/* Mood History */}
//         <div className="bg-white rounded-2xl shadow-xl p-8">
//           <h2 className="text-2xl font-bold text-gray-800 mb-6">Mood History</h2>
          
//           {moods.length === 0 ? (
//             <p className="text-gray-600 text-center py-8">No mood entries yet. Start tracking your mood!</p>
//           ) : (
//             <div className="space-y-4">
//               {moods.map((mood, idx) => {
//                 const moodConfig = moodOptions.find(m => m.value === mood.mood) || moodOptions[0];
//                 const Icon = moodConfig.icon;
//                 return (
//                   <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition">
//                     <div className="flex items-center space-x-4">
//                       <div className={`p-3 rounded-full ${moodConfig.bg}`}>
//                         <Icon className={`w-6 h-6 ${moodConfig.color}`} />
//                       </div>
//                       <div className="flex-1">
//                         <p className="font-semibold text-gray-800">{moodConfig.label}</p>
//                         {mood.description && (
//                           <p className="text-gray-600 text-sm mt-1">{mood.description}</p>
//                         )}
//                         <p className="text-gray-400 text-xs mt-1">
//                           {new Date(mood.recorded_at).toLocaleString()}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MoodTracker;



// src/pages/user/MoodTracker.jsx - UPDATED WITH MEDICAL SERVICE INTEGRATION
import React, { useState, useEffect } from 'react';
import { 
  Heart, Smile, Frown, Meh, TrendingUp, TrendingDown, Minus,
  Sun, Moon, Battery, Zap, AlertCircle 
} from 'lucide-react';
import { MEDICAL_API, apiCall } from '../../config/api';

const MoodTracker = ({ user, token, setCurrentView }) => {
  const [loading, setLoading] = useState(false);
  const [moodHistory, setMoodHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState([]);
  
  const [moodData, setMoodData] = useState({
    mood_level: 5,
    energy_level: 5,
    stress_level: 5,
    sleep_quality: 5,
    notes: '',
    triggers: ''
  });

  useEffect(() => {
    fetchMoodHistory();
    fetchInsights();
  }, []);

  const fetchMoodHistory = async () => {
    try {
      const response = await apiCall(`${MEDICAL_API}/mood/history?days=30`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMoodHistory(data.mood_logs || []);
        setAnalytics(data.analytics || null);
      }
    } catch (err) {
      console.error('Failed to fetch mood history:', err);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await apiCall(`${MEDICAL_API}/mood/insights`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
      }
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    }
  };

  const handleSliderChange = (field, value) => {
    setMoodData(prev => ({ ...prev, [field]: parseInt(value) }));
  };

  const submitMood = async () => {
    setLoading(true);
    try {
      const response = await apiCall(`${MEDICAL_API}/mood/log`, {
        method: 'POST',
        body: JSON.stringify(moodData)
      });

      if (response.ok) {
        const result = await response.json();
        alert('Mood logged successfully! 🎉');
        
        // Reset form
        setMoodData({
          mood_level: 5,
          energy_level: 5,
          stress_level: 5,
          sleep_quality: 5,
          notes: '',
          triggers: ''
        });
        
        // Refresh data
        fetchMoodHistory();
        fetchInsights();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to log mood');
      }
    } catch (err) {
      console.error('Mood log error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMoodIcon = (level) => {
    if (level >= 8) return { Icon: Smile, color: 'text-green-600', bg: 'bg-green-50' };
    if (level >= 5) return { Icon: Meh, color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { Icon: Frown, color: 'text-red-600', bg: 'bg-red-50' };
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (trend === 'declining') return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <Minus className="w-5 h-5 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button 
            onClick={() => setCurrentView('user-dashboard')}
            className="text-purple-600 hover:text-purple-800 font-semibold"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Log Mood */}
          <div className="lg:col-span-2 space-y-6">
            {/* Log New Mood */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">How are you feeling today?</h2>
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              
              {/* Mood Level */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Mood Level</label>
                  <div className="flex items-center space-x-2">
                    {getMoodIcon(moodData.mood_level).Icon && 
                      React.createElement(getMoodIcon(moodData.mood_level).Icon, {
                        className: `w-6 h-6 ${getMoodIcon(moodData.mood_level).color}`
                      })
                    }
                    <span className="text-2xl font-bold text-purple-600">{moodData.mood_level}/10</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moodData.mood_level}
                  onChange={(e) => handleSliderChange('mood_level', e.target.value)}
                  className="w-full h-3 bg-purple-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Very Low</span>
                  <span>Excellent</span>
                </div>
              </div>

              {/* Energy Level */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                    Energy Level
                  </label>
                  <span className="text-lg font-bold text-yellow-600">{moodData.energy_level}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moodData.energy_level}
                  onChange={(e) => handleSliderChange('energy_level', e.target.value)}
                  className="w-full h-3 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Exhausted</span>
                  <span>Energetic</span>
                </div>
              </div>

              {/* Stress Level */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                    Stress Level
                  </label>
                  <span className="text-lg font-bold text-red-600">{moodData.stress_level}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moodData.stress_level}
                  onChange={(e) => handleSliderChange('stress_level', e.target.value)}
                  className="w-full h-3 bg-red-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Calm</span>
                  <span>Very Stressed</span>
                </div>
              </div>

              {/* Sleep Quality */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center">
                    <Moon className="w-4 h-4 mr-2 text-blue-500" />
                    Sleep Quality (Last Night)
                  </label>
                  <span className="text-lg font-bold text-blue-600">{moodData.sleep_quality}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moodData.sleep_quality}
                  onChange={(e) => handleSliderChange('sleep_quality', e.target.value)}
                  className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  How are you feeling? (Optional)
                </label>
                <textarea
                  value={moodData.notes}
                  onChange={(e) => setMoodData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Describe your mood, feelings, or anything on your mind..."
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              {/* Triggers */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Identified Triggers (Optional)
                </label>
                <input
                  type="text"
                  value={moodData.triggers}
                  onChange={(e) => setMoodData(prev => ({ ...prev, triggers: e.target.value }))}
                  placeholder="e.g., work stress, lack of sleep, social interaction..."
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <button 
                onClick={submitMood}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging Mood...' : 'Log Mood Entry'}
              </button>
            </div>

            {/* Mood History */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Mood History</h2>
              
              {moodHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Sun className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No mood entries yet.</p>
                  <p className="text-gray-500 text-sm mt-2">Start tracking your mood daily to see trends and insights!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {moodHistory.slice(0, 10).map((entry, idx) => {
                    const moodConfig = getMoodIcon(entry.mood_level);
                    return (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 rounded-full ${moodConfig.bg} flex-shrink-0`}>
                            {React.createElement(moodConfig.Icon, {
                              className: `w-6 h-6 ${moodConfig.color}`
                            })}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-800">
                                {new Date(entry.timestamp).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-2 mb-2">
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Mood</p>
                                <p className="font-bold text-purple-600">{entry.mood_level}/10</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Energy</p>
                                <p className="font-bold text-yellow-600">{entry.energy_level}/10</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Stress</p>
                                <p className="font-bold text-red-600">{entry.stress_level}/10</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Sleep</p>
                                <p className="font-bold text-blue-600">{entry.sleep_quality}/10</p>
                              </div>
                            </div>
                            
                            {entry.notes && (
                              <p className="text-gray-700 text-sm mb-2 italic">"{entry.notes}"</p>
                            )}
                            
                            {entry.triggers && (
                              <p className="text-gray-600 text-xs">
                                <span className="font-semibold">Triggers:</span> {entry.triggers}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Analytics & Insights */}
          <div className="space-y-6">
            {/* Analytics Summary */}
            {analytics && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">30-Day Analytics</h3>
                
                <div className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Average Mood</span>
                      {getTrendIcon(analytics.mood_trend)}
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{analytics.average_mood}/10</p>
                    <p className="text-xs text-gray-500 mt-1 capitalize">{analytics.mood_trend}</p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Average Energy</span>
                      {getTrendIcon(analytics.energy_trend)}
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">{analytics.average_energy}/10</p>
                    <p className="text-xs text-gray-500 mt-1 capitalize">{analytics.energy_trend}</p>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <span className="text-sm text-gray-600">Average Stress</span>
                    <p className="text-2xl font-bold text-red-600">{analytics.average_stress}/10</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <span className="text-sm text-gray-600">Average Sleep</span>
                    <p className="text-2xl font-bold text-blue-600">{analytics.average_sleep}/10</p>
                  </div>
                </div>
              </div>
            )}



            {/* Quick Tips */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Daily Wellness Tips</h3>
              
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start space-x-2">
                  <Sun className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p>Get 10-15 minutes of sunlight daily</p>
                </div>
                <div className="flex items-start space-x-2">
                  <Battery className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p>Take short breaks every hour</p>
                </div>
                <div className="flex items-start space-x-2">
                  <Heart className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p>Practice deep breathing exercises</p>
                </div>
                <div className="flex items-start space-x-2">
                  <Moon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p>Maintain consistent sleep schedule</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;