// import React, { useState, useEffect } from 'react';
// import { Heart, ArrowRight, AlertCircle, Star, User, Calendar } from 'lucide-react';
// import { MEDICAL_API, apiCall } from '../../config/api';

// const SeverityAssessment = ({ user, token, setCurrentView }) => {
//   const [step, setStep] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [doctors, setDoctors] = useState([]);
//   const [showDoctors, setShowDoctors] = useState(false);
  
//   const [formData, setFormData] = useState({
//     mood_score: 5,
//     sleep_quality: 5,
//     appetite_level: 5,
//     stress_level: 5,
//     anxiety_level: 5,
//     emotional_stability: 5,
//     energy_level: 5,
//     self_harm_indicator: false,
//     anger_issues: false,
//     social_withdrawal: false,
//   });

//   const handleSliderChange = (field, value) => {
//     setFormData({ ...formData, [field]: parseInt(value) });
//   };

//   const handleCheckboxChange = (field) => {
//     setFormData({ ...formData, [field]: !formData[field] });
//   };

//   // Questionnaire questions
//   const questionnaireQuestions = [
//     {
//       id: "q1",
//       text: "Over the past two weeks, how often have you felt down, depressed, or hopeless?",
//       options: [
//         { value: 0, label: "Not at all" },
//         { value: 1, label: "Several days" },
//         { value: 2, label: "More than half the days" },
//         { value: 3, label: "Nearly every day" }
//       ]
//     },
//     {
//       id: "q2",
//       text: "Over the past two weeks, how often have you had little interest or pleasure in doing things?",
//       options: [
//         { value: 0, label: "Not at all" },
//         { value: 1, label: "Several days" },
//         { value: 2, label: "More than half the days" },
//         { value: 3, label: "Nearly every day" }
//       ]
//     },
//     {
//       id: "q3",
//       text: "Over the past two weeks, how often have you felt nervous, anxious, or on edge?",
//       options: [
//         { value: 0, label: "Not at all" },
//         { value: 1, label: "Several days" },
//         { value: 2, label: "More than half the days" },
//         { value: 3, label: "Nearly every day" }
//       ]
//     },
//     {
//       id: "q4",
//       text: "Over the past two weeks, how often have you felt that you could not stop or control worrying?",
//       options: [
//         { value: 0, label: "Not at all" },
//         { value: 1, label: "Several days" },
//         { value: 2, label: "More than half the days" },
//         { value: 3, label: "Nearly every day" }
//       ]
//     },
//     {
//       id: "q5",
//       text: "Over the past two weeks, how often have you had trouble relaxing?",
//       options: [
//         { value: 0, label: "Not at all" },
//         { value: 1, label: "Several days" },
//         { value: 2, label: "More than half the days" },
//         { value: 3, label: "Nearly every day" }
//       ]
//     },
//     {
//       id: "q6",
//       text: "Over the past two weeks, how often have you become easily annoyed or irritable?",
//       options: [
//         { value: 0, label: "Not at all" },
//         { value: 1, label: "Several days" },
//         { value: 2, label: "More than half the days" },
//         { value: 3, label: "Nearly every day" }
//       ]
//     },
//     {
//       id: "q7",
//       text: "Over the past two weeks, how often have you felt afraid as if something awful might happen?",
//       options: [
//         { value: 0, label: "Not at all" },
//         { value: 1, label: "Several days" },
//         { value: 2, label: "More than half the days" },
//         { value: 3, label: "Nearly every day" }
//       ]
//     },
//     {
//       id: "q8",
//       text: "Over the past two weeks, how difficult have sleeping problems been for you?",
//       options: [
//         { value: 0, label: "No difficulty" },
//         { value: 1, label: "Somewhat difficult" },
//         { value: 2, label: "Very difficult" },
//         { value: 3, label: "Extremely difficult" }
//       ]
//     },
//     {
//       id: "q9",
//       text: "Over the past two weeks, how difficult has it been for you to concentrate on tasks?",
//       options: [
//         { value: 0, label: "No difficulty" },
//         { value: 1, label: "Somewhat difficult" },
//         { value: 2, label: "Very difficult" },
//         { value: 3, label: "Extremely difficult" }
//       ]
//     },
//     {
//       id: "q10",
//       text: "Over the past two weeks, how much has your appetite changed?",
//       options: [
//         { value: 0, label: "No change" },
//         { value: 1, label: "Slight change" },
//         { value: 2, label: "Moderate change" },
//         { value: 3, label: "Severe change" }
//       ]
//     }
//   ];

//   // State for questionnaire answers
//   const [questionnaireAnswers, setQuestionnaireAnswers] = useState({});

//   // Initialize questionnaire answers
//   useEffect(() => {
//     const initialAnswers = {};
//     questionnaireQuestions.forEach(q => {
//       initialAnswers[q.id] = 0;
//     });
//     setQuestionnaireAnswers(initialAnswers);
//   }, []);

//   const handleQuestionnaireAnswer = (questionId, value) => {
//     setQuestionnaireAnswers(prev => ({
//       ...prev,
//       [questionId]: parseInt(value)
//     }));
//   };

//   const submitAssessment = async () => {
//     setLoading(true);
//     try {
//       // Calculate severity score based on questionnaire
//       const rawScore = Object.values(questionnaireAnswers).reduce((sum, val) => sum + val, 0);
//       const normalizedScore = Math.min(10, Math.max(0, Math.round((rawScore / 30) * 10)));
      
//       // Mock severity calculation
//       let level;
//       if (normalizedScore >= 8) level = 'severe';
//       else if (normalizedScore >= 5) level = 'moderate';
//       else level = 'mild';
      
//       const resultData = {
//         score: normalizedScore,
//         level: level,
//         notes: "Based on your questionnaire responses"
//       };
      
//       setResult(resultData);
//       setStep(3);
//     } catch (err) {
//       console.error('Assessment error:', err);
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
//         {/* Progress Bar */}
//         <div className="mb-8">
//           <div className="flex items-center justify-between mb-2">
//             <span className="text-sm font-semibold text-gray-600">Step {step} of 3</span>
//             <span className="text-sm text-gray-600">{Math.round((step / 3) * 100)}% Complete</span>
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-3">
//             <div 
//               className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500"
//               style={{ width: `${(step / 3) * 100}%` }}
//             />
//           </div>
//         </div>

//         {/* Step 1: Questionnaire Introduction */}
//         {step === 1 && (
//           <div className="bg-white rounded-2xl shadow-xl p-8">
//             <div className="text-center mb-8">
//               <Heart className="w-16 h-16 text-purple-600 mx-auto mb-4" />
//               <h2 className="text-3xl font-bold text-gray-800 mb-2">Mental Health Assessment</h2>
//               <p className="text-gray-600">This confidential questionnaire will help assess your mental health and provide personalized recommendations.</p>
//             </div>
            
//             <div className="prose max-w-none mb-8 bg-blue-50 p-6 rounded-lg">
//               <h3 className="text-lg font-semibold text-blue-800">How it works:</h3>
//               <ul className="list-disc pl-5 mt-2 space-y-1 text-blue-700">
//                 <li>Answer 10 questions about your recent feelings and experiences</li>
//                 <li>Receive a personalized severity assessment</li>
//                 <li>Get recommendations based on your results</li>
//                 <li>If needed, receive suggestions for qualified mental health professionals</li>
//               </ul>
//               <p className="mt-4 text-blue-700">Your responses are completely confidential and will only be used to provide you with appropriate recommendations.</p>
//             </div>
            
//             <button 
//               onClick={() => setStep(2)}
//               className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center space-x-2"
//             >
//               <span>Begin Assessment</span>
//               <ArrowRight className="w-5 h-5" />
//             </button>
//           </div>
//         )}

//         {/* Step 2: Questionnaire Questions */}
//         {step === 2 && (
//           <div className="bg-white rounded-2xl shadow-xl p-8">
//             <div className="text-center mb-8">
//               <AlertCircle className="w-16 h-16 text-purple-600 mx-auto mb-4" />
//               <h2 className="text-3xl font-bold text-gray-800 mb-2">Mental Health Questionnaire</h2>
//               <p className="text-gray-600">Please answer the following questions based on how you've been feeling over the past two weeks.</p>
//             </div>

//             <div className="space-y-8">
//               {questionnaireQuestions.map((question, index) => (
//                 <div key={question.id} className="border-b border-gray-200 pb-8">
//                   <h3 className="text-lg font-medium text-gray-900 mb-4">
//                     {index + 1}. {question.text}
//                   </h3>
                  
//                   <div className="space-y-3">
//                     {question.options.map((option) => (
//                       <div key={option.value} className="flex items-center">
//                         <input
//                           id={`${question.id}-${option.value}`}
//                           name={question.id}
//                           type="radio"
//                           value={option.value}
//                           checked={questionnaireAnswers[question.id] === option.value}
//                           onChange={(e) => handleQuestionnaireAnswer(question.id, e.target.value)}
//                           className="h-4 w-4 text-purple-600 focus:ring-purple-500"
//                           required
//                         />
//                         <label
//                           htmlFor={`${question.id}-${option.value}`}
//                           className="ml-3 block text-sm font-medium text-gray-700"
//                         >
//                           {option.label}
//                         </label>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               ))}
//             </div>

//             <div className="flex space-x-4 mt-8">
//               <button 
//                 onClick={() => setStep(1)}
//                 className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
//               >
//                 Back
//               </button>
//               <button 
//                 onClick={submitAssessment}
//                 disabled={loading}
//                 className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
//               >
//                 {loading ? 'Calculating...' : 'Submit Answers'}
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Step 3: Results */}
//         {step === 3 && result && (
//           <div className="bg-white rounded-2xl shadow-xl p-8">
//             <div className="text-center mb-8">
//               <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
//                 result.level === 'severe' ? 'bg-red-100' :
//                 result.level === 'moderate' ? 'bg-yellow-100' : 'bg-green-100'
//               }`}>
//                 <Heart className={`w-12 h-12 ${
//                   result.level === 'severe' ? 'text-red-600' :
//                   result.level === 'moderate' ? 'text-yellow-600' : 'text-green-600'
//                 }`} />
//               </div>
//               <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Assessment Results</h2>
//               <p className="text-gray-600">Based on your questionnaire responses</p>
//             </div>

//             <div className="space-y-6">
//               {/* Severity Level */}
//               <div className={`p-6 rounded-xl ${
//                 result.level === 'severe' ? 'bg-red-50 border border-red-200' :
//                 result.level === 'moderate' ? 'bg-yellow-50 border border-yellow-200' :
//                 'bg-green-50 border border-green-200'
//               }`}>
//                 <h3 className="text-lg font-bold text-gray-800 mb-2">Severity Level</h3>
//                 <p className={`text-2xl font-bold ${
//                   result.level === 'severe' ? 'text-red-600' :
//                   result.level === 'moderate' ? 'text-yellow-600' : 'text-green-600'
//                 }`}>
//                   {result.level.charAt(0).toUpperCase() + result.level.slice(1)}
//                 </p>
//                 <p className="text-gray-600 mt-2">Score: {result.score}/10</p>
//               </div>

//               {/* Interpretation */}
//               <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
//                 <h3 className="text-lg font-bold text-gray-800 mb-2">Interpretation</h3>
//                 <p className="text-gray-700">
//                   {result.level === 'severe' 
//                     ? "Your responses suggest significant symptoms that are impacting your well-being. Professional help is strongly recommended."
//                     : result.level === 'moderate'
//                     ? "Your responses indicate moderate symptoms that may be affecting your daily life. Professional guidance could be helpful."
//                     : "Your responses suggest mild symptoms. Many people experience periods like this."}
//                 </p>
//               </div>

//               {/* Recommendations */}
//               <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
//                 <h3 className="text-lg font-bold text-gray-800 mb-2">Recommendations</h3>
//                 <p className="text-gray-700">
//                   {result.level === 'severe' 
//                     ? "Professional help is strongly recommended. Please reach out to a healthcare provider as soon as possible."
//                     : result.level === 'moderate'
//                     ? "Professional guidance could be helpful. Speaking with a counselor or therapist might provide valuable support."
//                     : "Consider stress management techniques, regular exercise, and maintaining social connections. Self-help resources may be beneficial."}
//                 </p>
//               </div>

//               {/* Doctor Suggestions Button */}
//               {result.level !== 'mild' && (
//                 <div className="p-6 bg-yellow-50 rounded-xl border border-yellow-200">
//                   <h3 className="text-lg font-bold text-gray-800 mb-2">Professional Support</h3>
//                   <p className="text-gray-700 mb-4">
//                     Based on your results, we recommend connecting with a mental health professional.
//                   </p>
//                   <button
//                     onClick={() => setShowDoctors(!showDoctors)}
//                     className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded transition duration-300"
//                   >
//                     {showDoctors ? 'Hide Doctors' : 'Show Recommended Doctors'}
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* Doctor Suggestions */}
//             {showDoctors && result.level !== 'mild' && (
//               <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
//                 <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
//                   <h2 className="text-xl font-semibold text-gray-800 flex items-center">
//                     <User className="mr-2" />
//                     Recommended Mental Health Professionals
//                   </h2>
//                   <p className="text-gray-600 mt-1">
//                     Based on your assessment results and doctor ratings
//                   </p>
//                 </div>
                
//                 <div className="divide-y divide-gray-200">
//                   {/* Mock doctor data */}
//                   {[
//                     {
//                       id: 1,
//                       name: "Dr. Sarah Johnson",
//                       specialization: "Clinical Psychology",
//                       experience_years: 12,
//                       average_rating: 4.8,
//                       total_ratings: 127,
//                       consultation_fee: 1500
//                     },
//                     {
//                       id: 2,
//                       name: "Dr. Michael Chen",
//                       specialization: "Cognitive Behavioral Therapy",
//                       experience_years: 8,
//                       average_rating: 4.6,
//                       total_ratings: 89,
//                       consultation_fee: 1200
//                     },
//                     {
//                       id: 3,
//                       name: "Dr. Emily Rodriguez",
//                       specialization: "Anxiety Disorders",
//                       experience_years: 15,
//                       average_rating: 4.9,
//                       total_ratings: 203,
//                       consultation_fee: 1800
//                     }
//                   ].map((doctor) => (
//                     <div key={doctor.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
//                       <div className="flex justify-between items-start">
//                         <div className="flex-1">
//                           <div className="flex items-center">
//                             <h3 className="text-lg font-medium text-gray-900">{doctor.name}</h3>
//                             <div className="ml-3 flex items-center">
//                               {[...Array(5)].map((_, i) => (
//                                 <Star
//                                   key={i}
//                                   className={`w-4 h-4 ${i < Math.floor(doctor.average_rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
//                                 />
//                               ))}
//                               <span className="ml-1 text-sm text-gray-600">
//                                 {doctor.average_rating} ({doctor.total_ratings})
//                               </span>
//                             </div>
//                           </div>
                          
//                           <p className="text-sm text-gray-600 mt-1">{doctor.specialization}</p>
                          
//                           <div className="mt-2 flex items-center text-sm text-gray-600">
//                             <span>{doctor.experience_years} years experience</span>
//                             <span className="mx-2">•</span>
//                             <span>₹{doctor.consultation_fee}</span>
//                           </div>
//                         </div>
                        
//                         <div className="ml-4 flex-shrink-0">
//                           <button
//                             onClick={() => alert(`Booking appointment with ${doctor.name}`)}
//                             className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
//                           >
//                             <Calendar className="w-4 h-4 mr-1" />
//                             Book
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             <button 
//               onClick={() => setCurrentView('user-dashboard')}
//               className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
//             >
//               Return to Dashboard
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SeverityAssessment;


// src/pages/user/SeverityAssessment.jsx - UPDATED WITH MEDICAL SERVICE INTEGRATION
import React, { useState, useEffect } from 'react';
import { Heart, ArrowRight, AlertCircle, TrendingUp, Calendar, Star, User } from 'lucide-react';
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
      alert('Failed to load questionnaire');
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
        
        // Use suggested doctors from the response - no fallback logic
        // The backend already provides rating-based prioritized doctors
        if (data.suggested_doctors && data.suggested_doctors.length > 0) {
          // Sort by rating (highest first)
          const sortedDoctors = data.suggested_doctors.sort((a, b) => 
            (b.average_rating || 0) - (a.average_rating || 0)
          );
          setDoctors(sortedDoctors);
        } else {
          // If no doctors available, show empty state - no fallback
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

  const getSeverityColor = (level) => {
    switch (level) {
      case 'severe': return 'red';
      case 'moderately_severe': return 'orange';
      case 'moderate': return 'yellow';
      case 'mild': return 'green';
      default: return 'blue';
    }
  };

  const getSeverityBgColor = (level) => {
    switch (level) {
      case 'severe': return 'bg-red-50 border-red-200';
      case 'moderately_severe': return 'bg-orange-50 border-orange-200';
      case 'moderate': return 'bg-yellow-50 border-yellow-200';
      case 'mild': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getSeverityTextColor = (level) => {
    switch (level) {
      case 'severe': return 'text-red-600';
      case 'moderately_severe': return 'text-orange-600';
      case 'moderate': return 'text-yellow-600';
      case 'mild': return 'text-green-600';
      default: return 'text-blue-600';
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

        {/* Assessment History Preview */}
        {step === 1 && history.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Previous Assessment</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Latest Score: <span className="font-bold">{history[0].raw_score}</span></p>
                <p className="text-sm text-gray-600">Severity: 
                  <span className={`font-bold ml-1 ${getSeverityTextColor(history[0].severity_level)}`}>
                    {history[0].severity_level.replace('_', ' ').toUpperCase()}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(history[0].created_at).toLocaleDateString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        )}

        {/* Step 1: Introduction */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <Heart className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Mental Health Assessment</h2>
              <p className="text-gray-600">PHQ-9 Based Depression & Anxiety Screening</p>
            </div>
            
            <div className="prose max-w-none mb-8 bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800">About This Assessment:</h3>
              <ul className="list-disc pl-5 mt-2 space-y-2 text-blue-700">
                <li>Answer 10 evidence-based questions about your recent experiences</li>
                <li>SRTS (Severity Rating Tracking System) will calculate your severity level</li>
                <li>Get personalized recommendations and specialist suggestions</li>
                <li>Your responses are encrypted and completely confidential</li>
              </ul>
            </div>

            {result?.high_risk && (
              <div className="bg-red-50 border-2 border-red-200 p-6 rounded-lg mb-6">
                <p className="text-red-800 font-semibold text-center">
                  ⚠️ If you're experiencing a mental health emergency, please call 988 (Suicide & Crisis Lifeline)
                </p>
              </div>
            )}
            
            <button 
              onClick={() => setStep(2)}
              className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center space-x-2"
            >
              <span>Begin Assessment</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Questionnaire */}
        {step === 2 && questions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <AlertCircle className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">PHQ-9 Questionnaire</h2>
              <p className="text-gray-600">Over the last 2 weeks, how often have you been bothered by the following?</p>
            </div>

            <div className="space-y-8">
              {questions.map((question, index) => (
                <div key={question.id} className="border-b border-gray-200 pb-8 last:border-b-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {index + 1}. {question.question}
                    {question.warning && (
                      <span className="block text-sm text-red-600 mt-2">{question.warning}</span>
                    )}
                  </h3>
                  
                  <div className="space-y-3">
                    {[
                      { value: 0, label: "Not at all" },
                      { value: 1, label: "Several days" },
                      { value: 2, label: "More than half the days" },
                      { value: 3, label: "Nearly every day" }
                    ].map((option) => (
                      <div key={option.value} className="flex items-center">
                        <input
                          id={`q${question.id}-${option.value}`}
                          name={`question-${question.id}`}
                          type="radio"
                          value={option.value}
                          checked={answers[question.id] === option.value}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                        />
                        <label
                          htmlFor={`q${question.id}-${option.value}`}
                          className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Optional Notes */}
            <div className="mt-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information you'd like to share..."
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="3"
              />
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
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing...' : 'Submit Assessment'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && result && (
          <div className="space-y-6">
            {/* Results Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${getSeverityBgColor(result.severity_level)}`}>
                  <Heart className={`w-12 h-12 ${getSeverityTextColor(result.severity_level)}`} />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Assessment Complete</h2>
                <p className="text-gray-600">Your mental health assessment results</p>
              </div>

              {/* High Risk Alert */}
              {result.high_risk && (
                <div className="bg-red-50 border-2 border-red-200 p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-bold text-red-800 mb-2">⚠️ IMMEDIATE ATTENTION REQUIRED</h3>
                  <p className="text-red-700 mb-4">Your responses indicate you may be at risk. Please seek help immediately:</p>
                  <div className="space-y-2 text-red-700">
                    <p>📞 <strong>National Suicide Prevention Lifeline:</strong> 988</p>
                    <p>💬 <strong>Crisis Text Line:</strong> Text HOME to 741741</p>
                    <p>🏥 <strong>Emergency Services:</strong> 911 or visit nearest ER</p>
                  </div>
                </div>
              )}

              {/* Severity Score */}
              <div className={`p-6 rounded-xl border-2 ${getSeverityBgColor(result.severity_level)} mb-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Severity Level</h3>
                  <span className={`text-3xl font-bold ${getSeverityTextColor(result.severity_level)}`}>
                    {result.raw_score}/27
                  </span>
                </div>
                <p className={`text-2xl font-bold ${getSeverityTextColor(result.severity_level)} mb-2`}>
                  {result.severity_level.replace('_', ' ').toUpperCase()}
                </p>
                <p className="text-gray-700 text-sm">
                  Specialist Recommended: <strong>{result.specialist_type}</strong>
                </p>
              </div>

              {/* Recommendations */}
              <div className="p-6 bg-blue-50 rounded-xl border border-blue-200 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
                  Personalized Recommendations
                </h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-gray-700 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommended Doctors */}
            {doctors.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <User className="w-6 h-6 mr-2 text-purple-600" />
                  Recommended Mental Health Professionals
                </h2>
                <p className="text-gray-600 mb-6">
                  Based on your severity level and doctor ratings, we recommend connecting with these specialists:
                </p>
                
                <div className="space-y-4">
                  {doctors.map((doctor) => (
                    <div key={doctor.user_id || doctor.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
                          <p className="text-purple-600 font-medium">{doctor.specialization}</p>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                            <span>{doctor.experience_years} years exp.</span>
                            {(doctor.average_rating || doctor.average_rating === 0) && (
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                                <span>{doctor.average_rating}</span>
                                {doctor.total_ratings && (
                                  <span className="ml-1">({doctor.total_ratings})</span>
                                )}
                              </div>
                            )}
                            <span className="font-semibold text-green-600">₹{doctor.consultation_fee}</span>
                          </div>
                          {doctor.match_score && (
                            <div className="mt-2 text-xs text-gray-500">
                              Match Score: {doctor.match_score}%
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setCurrentView('book-appointment')}
                          className="ml-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition flex items-center"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Book
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="grid md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setCurrentView('mood-tracker')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Track Your Mood Daily
                </button>
                <button 
                  onClick={() => setCurrentView('user-dashboard')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeverityAssessment;