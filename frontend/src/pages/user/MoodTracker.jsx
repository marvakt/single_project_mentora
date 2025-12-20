
// 3. src/pages/user/MoodTracker.jsx
// ------------------------------
import React, { useState, useEffect } from 'react';
import { Heart, Smile, Frown, Meh, TrendingUp } from 'lucide-react';
import { MEDICAL_API, apiCall } from '../../config/api';

const MoodTracker = ({ user, token, setCurrentView }) => {
  const [moods, setMoods] = useState([]);
  const [selectedMood, setSelectedMood] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const moodOptions = [
    { value: 'happy', label: 'Happy', icon: Smile, color: 'text-green-600', bg: 'bg-green-50' },
    { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { value: 'sad', label: 'Sad', icon: Frown, color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: 'anxious', label: 'Anxious', icon: Heart, color: 'text-purple-600', bg: 'bg-purple-50' },
    { value: 'stressed', label: 'Stressed', icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  useEffect(() => {
    fetchMoods();
  }, []);

  const fetchMoods = async () => {
    try {
      const response = await apiCall(`${MEDICAL_API}/medical/mood/recent`, {
        method: 'GET'
      });
      if (response.ok) {
        const data = await response.json();
        setMoods(data);
      }
    } catch (err) {
      console.error('Failed to fetch moods:', err);
    }
  };

  const submitMood = async () => {
    if (!selectedMood) {
      alert('Please select a mood');
      return;
    }

    setLoading(true);
    try {
      const response = await apiCall(`${MEDICAL_API}/medical/mood`, {
        method: 'POST',
        body: JSON.stringify({ mood: selectedMood, description })
      });

      if (response.ok) {
        alert('Mood logged successfully!');
        setSelectedMood('');
        setDescription('');
        fetchMoods();
      } else {
        alert('Failed to log mood');
      }
    } catch (err) {
      console.error('Mood log error:', err);
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
        {/* Log New Mood */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">How are you feeling?</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {moodOptions.map((mood) => {
              const Icon = mood.icon;
              return (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`p-6 rounded-xl border-2 transition ${
                    selectedMood === mood.value
                      ? `${mood.bg} border-current ${mood.color}`
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-8 h-8 mx-auto mb-2 ${selectedMood === mood.value ? mood.color : 'text-gray-400'}`} />
                  <p className="text-sm font-semibold text-gray-700">{mood.label}</p>
                </button>
              );
            })}
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="How are you feeling? (optional)"
            className="w-full border rounded-lg p-4 mb-4"
            rows="3"
          />

          <button 
            onClick={submitMood}
            disabled={loading || !selectedMood}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? 'Logging...' : 'Log Mood'}
          </button>
        </div>

        {/* Mood History */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Mood History</h2>
          
          {moods.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No mood entries yet. Start tracking your mood!</p>
          ) : (
            <div className="space-y-4">
              {moods.map((mood, idx) => {
                const moodConfig = moodOptions.find(m => m.value === mood.mood) || moodOptions[0];
                const Icon = moodConfig.icon;
                return (
                  <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${moodConfig.bg}`}>
                        <Icon className={`w-6 h-6 ${moodConfig.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{moodConfig.label}</p>
                        {mood.description && (
                          <p className="text-gray-600 text-sm mt-1">{mood.description}</p>
                        )}
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(mood.recorded_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;