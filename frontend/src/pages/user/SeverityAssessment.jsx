
import React, { useState, useEffect } from 'react';
import {
  Heart, ArrowRight, AlertCircle, TrendingUp, Calendar, Star, User,
  Home, Activity, Smile, FileText, Settings, LogOut, Menu, CheckCircle
} from 'lucide-react';
import { MEDICAL_API, USER_API, apiCall } from '../../config/api';

const SeverityAssessment = ({ user, token, setCurrentView }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [notes, setNotes] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [history, setHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch questionnaire questions from backend
  useEffect(() => {
    fetchQuestions();
    fetchHistory();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await apiCall(`${MEDICAL_API}/questionnaire/questions`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questionnaire);

        // Initialize answers
        const initialAnswers = {};
        data.questionnaire.forEach(q => {
          initialAnswers[q.id] = 0;
        });
        setAnswers(initialAnswers);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      // alert('Failed to load questionnaire'); // Keep it silent or show UI error
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await apiCall(`${MEDICAL_API}/questionnaire/history?limit=5`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.assessments || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: parseInt(value)
    }));
  };

  const submitAssessment = async () => {
    setLoading(true);
    try {
      // Prepare responses in format: {1: score, 2: score, ...}
      const responses = {};
      Object.keys(answers).forEach(key => {
        responses[parseInt(key)] = answers[key];
      });

      const response = await apiCall(`${MEDICAL_API}/questionnaire/submit`, {
        method: 'POST',
        body: JSON.stringify({
          responses: responses,
          notes: notes
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);

        if (data.suggested_doctors && data.suggested_doctors.length > 0) {
          const sortedDoctors = data.suggested_doctors.sort((a, b) =>
            (b.average_rating || 0) - (a.average_rating || 0)
          );
          setDoctors(sortedDoctors);
        } else {
          setDoctors([]);
        }

        setStep(3);
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to submit assessment');
      }
    } catch (err) {
      console.error('Assessment error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityConfig = (level) => {
    const configs = {
      'severe': { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', gradient: 'from-rose-500 to-red-600' },
      'moderately_severe': { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', gradient: 'from-orange-500 to-amber-600' },
      'moderate': { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', gradient: 'from-amber-400 to-orange-500' },
      'mild': { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', gradient: 'from-emerald-400 to-teal-500' },
      'minimal': { color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200', gradient: 'from-teal-400 to-cyan-500' },
      'default': { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', gradient: 'from-blue-400 to-indigo-500' }
    };
    return configs[level] || configs.default;
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
            <NavItem icon={Calendar} label="Book Session" view="book-appointment" />
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Wellness</p>
            <NavItem icon={Activity} label="Assessment" view="severity-assessment" active={true} />
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
          <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Step {step} of 3</span>
                <span className="text-sm font-bold text-teal-600">{Math.round((step / 3) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-400 to-emerald-500 h-2.5 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>

            {/* Step 1: Introduction */}
            {step === 1 && (
              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 text-center relative overflow-hidden">
                {/* Decorative BG elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -ml-32 -mb-32 opacity-50"></div>

                <div className="relative">
                  <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Activity className="w-10 h-10 text-teal-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Mental Health Check-in</h2>
                  <p className="text-gray-500 max-w-xl mx-auto mb-8 text-lg">
                    Take a moment to reflect on your well-being. This confidential PHQ-9 based screening helps us understand your needs and recommend the best support path.
                  </p>

                  <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <FileText className="w-6 h-6 text-teal-600 mb-3" />
                      <h3 className="font-bold text-gray-900 mb-1">Simple Questions</h3>
                      <p className="text-sm text-gray-500">10 quick questions about your recent experiences.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <TrendingUp className="w-6 h-6 text-emerald-600 mb-3" />
                      <h3 className="font-bold text-gray-900 mb-1">Instant Analysis</h3>
                      <p className="text-sm text-gray-500">Get an immediate understanding of your severity level.</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <User className="w-6 h-6 text-cyan-600 mb-3" />
                      <h3 className="font-bold text-gray-900 mb-1">Expert Support</h3>
                      <p className="text-sm text-gray-500">Matched with specialists based on your results.</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-teal-500/25 transition transform hover:scale-[1.02] flex items-center justify-center gap-2 mx-auto min-w-[200px]"
                  >
                    Start Assessment <ArrowRight className="w-5 h-5" />
                  </button>

                  {history.length > 0 && (
                    <div className="mt-12 text-center">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Previous Result</p>
                      <div className="inline-flex items-center gap-4 px-6 py-3 bg-white rounded-full border border-gray-100 shadow-sm">
                        <span className="text-gray-500 text-sm">Last check-in: <span className="font-semibold text-gray-900">{new Date(history[0].created_at).toLocaleDateString()}</span></span>
                        <div className="h-4 w-px bg-gray-200"></div>
                        <span className={`text-sm font-bold ${getSeverityConfig(history[0].severity_level).color}`}>
                          {history[0].severity_level.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Questionnaire */}
            {step === 2 && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="mb-8 p-4 bg-teal-50 rounded-2xl flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-teal-600 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-teal-900">Over the last 2 weeks</h3>
                    <p className="text-teal-700 text-sm">How often have you been bothered by any of the following problems?</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {questions.map((question, index) => (
                    <div key={question.id} className="pb-8 border-b border-gray-50 last:border-0 last:pb-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">{index + 1}. {question.question}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { value: 0, label: "Not at all" },
                          { value: 1, label: "Several days" },
                          { value: 2, label: "More than half the days" },
                          { value: 3, label: "Nearly every day" }
                        ].map((option) => (
                          <label
                            key={option.value}
                            className={`
                                                relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all text-center h-full
                                                ${answers[question.id] === option.value
                                ? 'border-teal-500 bg-teal-50 text-teal-900 font-bold shadow-sm'
                                : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                              }
                                            `}
                          >
                            <input
                              type="radio"
                              name={`q-${question.id}`}
                              value={option.value}
                              checked={answers[question.id] === option.value}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              className="absolute opacity-0 w-0 h-0"
                            />
                            <span className="text-sm">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 pt-8 border-t border-gray-100">
                  <label className="block text-sm font-bold text-gray-700 mb-3">Anything else on your mind? (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50 h-32"
                    placeholder="Feel free to share any specific concerns..."
                  />
                </div>

                <div className="flex gap-4 mt-8">
                  <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">Back</button>
                  <button
                    onClick={submitAssessment}
                    disabled={loading}
                    className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <>Submit Assessment <CheckCircle className="w-5 h-5" /></>}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Results */}
            {step === 3 && result && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Result Card */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center overflow-hidden relative">
                  <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${getSeverityConfig(result.severity_level).gradient}`}></div>

                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${getSeverityConfig(result.severity_level).bg}`}>
                    <Activity className={`w-12 h-12 ${getSeverityConfig(result.severity_level).color}`} />
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Assessment Complete</h2>
                  <p className="text-gray-500 mb-8">Based on your responses, your current status is:</p>

                  <div className={`inline-block px-8 py-4 rounded-2xl ${getSeverityConfig(result.severity_level).bg} border ${getSeverityConfig(result.severity_level).border} mb-8`}>
                    <span className={`text-2xl font-bold uppercase tracking-wide ${getSeverityConfig(result.severity_level).color}`}>
                      {result.severity_level.replace('_', ' ')}
                    </span>
                    <div className="text-sm font-semibold opacity-75 mt-1 text-gray-600">Score: {result.score}/27</div>
                  </div>

                  <div className="max-w-2xl mx-auto bg-gray-50 rounded-2xl p-6 text-left border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-2">Our Recommendation</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {result.severity_level === 'severe' || result.severity_level === 'moderately_severe'
                        ? "Your responses suggest symptoms that are significantly impacting your well-being. We strongly recommend consulting with a psychiatrist for a comprehensive evaluation."
                        : result.severity_level === 'moderate'
                          ? "Your responses indicate moderate symptoms. Speaking with a psychologist or therapist could provide valuable strategies and support."
                          : "Your symptoms appear mild to minimal. Maintaining a balanced lifestyle and self-care practices is encouraged. Consider a counselor if you want to optimize your well-being."}
                    </p>
                  </div>
                </div>

                {/* Recommended Doctors */}
                {doctors.length > 0 && (
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <User className="w-5 h-5 text-teal-600" /> Recommended Specialists
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {doctors.map(doc => (
                        <div key={doc.user_id} className="p-4 rounded-2xl border border-gray-100 hover:border-teal-200 hover:shadow-md transition bg-gray-50 hover:bg-white group cursor-pointer" onClick={() => setCurrentView('book-appointment')}> {/* Link to booking */}
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-teal-700 font-bold text-xl shadow-sm border border-gray-100 group-hover:scale-105 transition">
                              {doc.name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 truncate">{doc.name}</h4>
                              <p className="text-xs text-teal-600 font-bold uppercase tracking-wide">{doc.specialization}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="text-xs font-bold text-gray-600">{doc.average_rating}</span>
                              </div>
                            </div>
                            <button className="bg-white text-gray-900 px-4 py-2 rounded-lg text-xs font-bold shadow-sm border border-gray-200 group-hover:bg-teal-600 group-hover:text-white group-hover:border-transparent transition">
                              Book
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => setStep(1)} className="w-full text-center text-gray-500 text-sm font-semibold hover:text-teal-600 py-4">Start New Assessment</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SeverityAssessment;