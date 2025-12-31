
import React, { useState, useEffect } from 'react';
import {
  Heart, Smile, Frown, Meh, TrendingUp, TrendingDown, Minus,
  Sun, Moon, Battery, Zap, AlertCircle, Home, Calendar, Clock,
  Activity, FileText, Settings, LogOut, Menu, User, CheckCircle, Sparkles
} from 'lucide-react';
import { MEDICAL_API, apiCall } from '../../config/api';

const MoodTracker = ({ user, token, setCurrentView }) => {
  const [loading, setLoading] = useState(false);
  const [moodHistory, setMoodHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const getMoodConfig = (level) => {
    if (level >= 8) return { Icon: Smile, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Great' };
    if (level >= 5) return { Icon: Meh, color: 'text-teal-600', bg: 'bg-teal-50', label: 'Okay' };
    return { Icon: Frown, color: 'text-rose-600', bg: 'bg-rose-50', label: 'Low' };
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="w-5 h-5 text-emerald-600" />;
    if (trend === 'declining') return <TrendingDown className="w-5 h-5 text-rose-600" />;
    return <Minus className="w-5 h-5 text-gray-400" />;
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
            <NavItem icon={Smile} label="Mood Tracker" view="mood-tracker" active={true} />
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

          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Mood Tracker</h2>
                <p className="text-gray-500 font-medium">Log your daily feelings to gain emotional insights</p>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Consistency</p>
                  <p className="text-sm font-bold text-gray-900">{moodHistory.length} Days Logged</p>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* Left Side: Logger and History */}
              <div className="lg:col-span-8 space-y-8">

                {/* Mood Entry Form */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-60"></div>

                  <div className="relative">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Smile className="w-6 h-6 text-teal-600" /> How are you today?
                    </h3>

                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                      {/* Mood Level Slider */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Overall Mood</label>
                          <span className={`text-lg font-bold ${getMoodConfig(moodData.mood_level).color}`}>{moodData.mood_level}/10</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Frown className="w-5 h-5 text-gray-300" />
                          <input
                            type="range" min="1" max="10"
                            value={moodData.mood_level}
                            onChange={(e) => handleSliderChange('mood_level', e.target.value)}
                            className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-teal-600"
                          />
                          <Smile className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          <span>Low</span>
                          <span>Excellent</span>
                        </div>
                      </div>

                      {/* Energy Level Slider */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Energy Level</label>
                          <span className="text-lg font-bold text-amber-600">{moodData.energy_level}/10</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Battery className="w-5 h-5 text-gray-300" />
                          <input
                            type="range" min="1" max="10"
                            value={moodData.energy_level}
                            onChange={(e) => handleSliderChange('energy_level', e.target.value)}
                            className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                          <Zap className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          <span>Tired</span>
                          <span>Charged</span>
                        </div>
                      </div>

                      {/* Stress Level Slider */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Stress Level</label>
                          <span className="text-lg font-bold text-rose-600">{moodData.stress_level}/10</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Minus className="w-5 h-5 text-gray-300" />
                          <input
                            type="range" min="1" max="10"
                            value={moodData.stress_level}
                            onChange={(e) => handleSliderChange('stress_level', e.target.value)}
                            className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
                          />
                          <AlertCircle className="w-5 h-5 text-rose-500" />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          <span>Calm</span>
                          <span>Intense</span>
                        </div>
                      </div>

                      {/* Sleep Quality Slider */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Sleep Quality</label>
                          <span className="text-lg font-bold text-indigo-600">{moodData.sleep_quality}/10</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Sun className="w-5 h-5 text-gray-300" />
                          <input
                            type="range" min="1" max="10"
                            value={moodData.sleep_quality}
                            onChange={(e) => handleSliderChange('sleep_quality', e.target.value)}
                            className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                          <Moon className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          <span>Restless</span>
                          <span>Deep Sleep</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Daily Notes</label>
                        <textarea
                          value={moodData.notes}
                          onChange={(e) => setMoodData(prev => ({ ...prev, notes: e.target.value }))}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 focus:ring-2 focus:ring-teal-500 outline-none h-24 text-sm transition"
                          placeholder="What made you feel this way?"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Potential Triggers</label>
                        <textarea
                          value={moodData.triggers}
                          onChange={(e) => setMoodData(prev => ({ ...prev, triggers: e.target.value }))}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 focus:ring-2 focus:ring-teal-500 outline-none h-24 text-sm transition"
                          placeholder="e.g. Work deadline, Weather, Social event..."
                        />
                      </div>
                    </div>

                    <button
                      onClick={submitMood}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-teal-500/20 transition transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <>Save Today's Entry <CheckCircle className="w-5 h-5" /></>}
                    </button>
                  </div>
                </div>

                {/* History List */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 px-1">Recent History</h3>
                  <div className="grid gap-4">
                    {moodHistory.length === 0 ? (
                      <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
                        <Minus className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-medium">No mood history available yet</p>
                      </div>
                    ) : (
                      moodHistory.slice(0, 5).map((entry, idx) => {
                        const mood = getMoodConfig(entry.mood_level);
                        return (
                          <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-6 hover:shadow-md transition group">
                            <div className={`w-14 h-14 rounded-2xl ${mood.bg} flex items-center justify-center group-hover:scale-110 transition`}>
                              <mood.Icon className={`w-7 h-7 ${mood.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-900">
                                  {new Date(entry.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-sm text-gray-500 truncate italic">{entry.notes || 'No notes added'}</p>
                            </div>
                            <div className="hidden md:flex gap-6 text-center">
                              <div className="px-3 border-r border-gray-50">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Energy</p>
                                <p className="text-sm font-bold text-amber-600">{entry.energy_level}</p>
                              </div>
                              <div className="px-3 border-r border-gray-50">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Stress</p>
                                <p className="text-sm font-bold text-rose-600">{entry.stress_level}</p>
                              </div>
                              <div className="px-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Mood</p>
                                <p className={`text-sm font-bold ${mood.color}`}>{entry.mood_level}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Analytics & Insights */}
              <div className="lg:col-span-4 space-y-8">

                {/* 30-Day Analytics */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-teal-600" /> 30-Day Averages
                  </h3>

                  {analytics ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Avg Mood</p>
                          <div className="flex items-center gap-2">
                            <h4 className="text-2xl font-black text-gray-900">{analytics.average_mood}</h4>
                            {getTrendIcon(analytics.mood_trend)}
                          </div>
                        </div>
                        <div className={`w-10 h-10 rounded-full ${getMoodConfig(analytics.average_mood).bg} flex items-center justify-center`}>
                          {React.createElement(getMoodConfig(analytics.average_mood).Icon, {
                            className: `w-5 h-5 ${getMoodConfig(analytics.average_mood).color}`
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Avg Energy</p>
                          <div className="flex items-center gap-2">
                            <h4 className="text-2xl font-black text-gray-900">{analytics.average_energy}</h4>
                            {getTrendIcon(analytics.energy_trend)}
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-amber-500" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Stress</p>
                          <h4 className="text-xl font-black text-rose-600">{analytics.average_stress}/10</h4>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sleep</p>
                          <h4 className="text-xl font-black text-indigo-600">{analytics.average_sleep}/10</h4>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-400 text-sm italic">
                      Tracking data will appear here after more logs
                    </div>
                  )}
                </div>

                {/* Insights */}
                <div className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-3xl p-6 text-white shadow-lg shadow-teal-700/20">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 opacity-90" /> Wellness Insights
                  </h3>

                  <div className="space-y-4">
                    {insights.length > 0 ? (
                      insights.map((insight, idx) => (
                        <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-sm leading-relaxed">
                          {insight}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-white/10 rounded-2xl text-sm italic opacity-80">
                        Logging your mood for 3-5 days will unlock personalized wellness insights.
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10 text-xs font-medium opacity-70">
                    Stay consistent to help us understand your patterns better.
                  </div>
                </div>

                {/* Wellness Tips */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest">Today's Focus</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mt-0.5"><Sun className="w-3 h-3" /></div>
                      <p className="text-xs text-gray-600 leading-normal font-medium">Try to get 15 minutes of direct morning sunlight.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mt-0.5"><Heart className="w-3 h-3" /></div>
                      <p className="text-xs text-gray-600 leading-normal font-medium">Perform a 2-minute mindful breathing session.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MoodTracker;