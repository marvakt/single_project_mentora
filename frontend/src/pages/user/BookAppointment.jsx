
import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, DollarSign, User, ArrowLeft, CheckCircle,
  Star, Activity, AlertCircle, TrendingUp, Heart, Home, Smile,
  Settings, LogOut, Menu, FileText, X, GraduationCap, MapPin, ArrowRight, Search
} from 'lucide-react';
import DoctorProfileModal from '../../components/DoctorProfileModal';
import { USER_API, APPOINTMENT_API, MEDICAL_API, apiCall } from '../../config/api';
import { formatIndianTime } from '../../utils/dateUtils';
import PaymentProcessing from './PaymentProcessing';

const BookAppointment = ({ user, token, setCurrentView, onBookingSuccess, selectedDoctorId: propDoctorId = null, recommendationSnapshotId: propSnapshotId = null }) => {
  // Initialize state from keys or props, handling the sessionStorage read once on mount
  const [targetDoctorId] = useState(() => {
    return propDoctorId || sessionStorage.getItem('selectedDoctorId');
  });

  const [targetSnapshotId] = useState(() => {
    return propSnapshotId || sessionStorage.getItem('recommendationSnapshotId');
  });

  // Clear sessionStorage on mount to prevent stale state on reload/navigate back
  useEffect(() => {
    // We only clear if we found them, but safe to try remove always
    sessionStorage.removeItem('selectedDoctorId');
    sessionStorage.removeItem('recommendationSnapshotId');
    sessionStorage.removeItem('showAllDoctors');
  }, []);

  const [doctors, setDoctors] = useState([]);
  const [suggestedDoctors, setSuggestedDoctors] = useState([]);
  // Initialize showAllDoctors from sessionStorage to support "Browse All" from Dashboard
  const [showAllDoctors, setShowAllDoctors] = useState(() => sessionStorage.getItem('showAllDoctors') === 'true');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [bookingResult, setBookingResult] = useState(null);
  const [userSeverity, setUserSeverity] = useState(null);

  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileViewDoctor, setProfileViewDoctor] = useState(null);

  useEffect(() => {
    // If a specific doctor ID is provided, fetch all doctors and select that specific one
    if (targetDoctorId) {
      // Reset user severity to avoid showing severity-based recommendations
      setUserSeverity(null);
      fetchAllDoctors();
    } else {
      // Otherwise, fetch all doctors and get user severity for suggestions
      fetchUserSeverity();
      fetchDoctors(); // Initial fetch
    }
  }, [targetDoctorId]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Trigger fetch when debounced search changes
  useEffect(() => {
    if (!targetDoctorId) {
      fetchDoctors();
    }
  }, [debouncedSearch]);

  // Additional effect to ensure that when we have a selected doctor, we don't show severity recommendations
  useEffect(() => {
    if (targetDoctorId && selectedDoctor) {
      // Make sure severity info is not displayed when a specific doctor is selected
      setUserSeverity(null);
    }
  }, [targetDoctorId, selectedDoctor]);

  // Effect to ensure userSeverity remains null when a specific doctor is selected
  useEffect(() => {
    if (targetDoctorId) {
      setUserSeverity(null);
    }
  }, [targetDoctorId]);

  useEffect(() => {
    if (selectedDoctor) {
      fetchAvailability(selectedDoctor.user_id);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (appointmentDate && availability.length > 0 && selectedDoctor) {
      // Validate date format (YYYY-MM-DD) and value
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(appointmentDate)) {
        console.error('Invalid date format:', appointmentDate);
        return;
      }

      // Validate that the date is reasonable with more robust checks
      const date = new Date(appointmentDate);
      if (isNaN(date.getTime()) || date.getFullYear() < 2024 || date.getFullYear() > 2030 || date.getFullYear().toString().length !== 4) {
        console.error('Invalid date value:', appointmentDate);
        return;
      }

      // Additional check: ensure the date string actually represents the expected date
      const [year, month, day] = appointmentDate.split('-').map(Number);
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        console.error('Date mismatch:', appointmentDate, 'parsed as:', date);
        return;
      }

      const fetchSlots = async () => {
        const slots = await getAvailableSlots(appointmentDate, availability, selectedDoctor.user_id);
        setAvailableSlots(slots);
        setAppointmentTime('');
      };
      fetchSlots();
    }
  }, [appointmentDate, availability, selectedDoctor]);

  const fetchUserSeverity = async () => {
    try {
      const response = await apiCall(`${MEDICAL_API}/questionnaire/latest`);
      if (response.ok) {
        const data = await response.json();
        if (data.assessment) {
          setUserSeverity(data.assessment);
          // Only fetch suggested doctors if no specific doctor is selected
          if (!targetDoctorId) {
            // Use raw_score if available, otherwise default to a moderate score (10)
            const score = data.assessment.raw_score !== undefined ? data.assessment.raw_score : 10;
            fetchSuggestedDoctors(score);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch severity:', err);
    }
  };

  const fetchSuggestedDoctors = async (score) => {
    try {
      // Ensure score is a valid integer between 0-27 (PHQ-9 range) or default to 5
      const severityScore = score !== null && score !== undefined ? Math.min(Math.max(Math.floor(score), 0), 27) : 5;

      const response = await apiCall(`${USER_API}/doctors/suggest/`, {
        method: 'POST',
        body: JSON.stringify({ severity_score: severityScore })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.suggested_doctors && data.suggested_doctors.length > 0) {
          // Sort by rating as a secondary measure (backend might already sort)
          const sorted = data.suggested_doctors.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
          setSuggestedDoctors(sorted);
        } else {
          // Fallback if no specific suggestions returned
          setSuggestedDoctors([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch suggested doctors:', err);
      setSuggestedDoctors([]);
    }
  };

  // Fetch all doctors but don't filter by severity if a specific doctor is selected
  const fetchAllDoctors = async () => {
    try {
      const response = await apiCall(`${USER_API}/doctors/`);
      if (response.ok) {
        const data = await response.json();
        const sortedDoctors = data
          .filter(d => d.doctor_status === 'approved')
          .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        setDoctors(sortedDoctors);

        // If a specific doctor ID is provided and no doctor is selected yet, select that doctor
        if (targetDoctorId && !selectedDoctor) {
          const doctor = sortedDoctors.find(d => String(d.user_id) === String(targetDoctorId));
          if (doctor) {
            setSelectedDoctor(doctor);
            setStep(2); // Go directly to booking step
            // The availability will be fetched by the useEffect when selectedDoctor changes
          } else {
            console.error(`Doctor with ID ${targetDoctorId} not found or not approved. Available doctors:`, sortedDoctors.map(d => d.user_id));
            // If doctor not found, show an alert to the user and fall back to showing all doctors
            alert(`The doctor you selected is no longer available. Showing all available specialists instead.`);
            // If doctor not found, fall back to showing all doctors but stay on step 1
            setStep(1);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);

      const response = await apiCall(`${USER_API}/doctors/?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const sortedDoctors = data
          .filter(d => d.doctor_status === 'approved')
          .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        setDoctors(sortedDoctors);
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };



  const fetchAvailability = async (doctorId) => {
    try {
      const response = await apiCall(`${USER_API}/doctor/${doctorId}/availability/`);
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      } else {
        setAvailability([]);
      }
    } catch (err) {
      setAvailability([]);
    }
  };

  const getAvailableSlots = async (dateString, availabilityData, doctorId) => {
    if (!availabilityData || availabilityData.length === 0 || !doctorId) return [];

    // Validate date format and value before processing
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || date.getFullYear() < 2024 || date.getFullYear() > 2030 || date.getFullYear().toString().length !== 4) {
      console.warn('Invalid date selected:', dateString);
      return [];
    }

    // Additional check: ensure the date string actually represents the expected date
    const [year, month, day] = dateString.split('-').map(Number);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      console.warn('Date mismatch:', dateString, 'parsed as:', date);
      return [];
    }

    let dayOfWeek = date.getDay();
    // Convert Sunday (0) to 6, else day-1
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const daySchedule = availabilityData.find(d => d.day_of_week === dayOfWeek);
    if (!daySchedule) return [];

    const allPossibleSlots = [];
    const [startHour, startMinute] = daySchedule.start_time.split(':').map(Number);
    const [endHour, endMinute] = daySchedule.end_time.split(':').map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      allPossibleSlots.push(timeString);
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
      if (currentHour > endHour || (currentHour === endHour && currentMinute >= endMinute)) break;
    }

    try {
      const response = await apiCall(`${APPOINTMENT_API}/appointments/doctors/${doctorId}/available-slots/?date=${dateString}`);
      if (response.ok) {
        const data = await response.json();
        return data.available_slots;
      }
      return allPossibleSlots;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      return allPossibleSlots;
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setStep(2);
    setAppointmentDate('');
    setAppointmentTime('');
    setAvailableSlots([]);
  };

  const handleBooking = async () => {
    if (!appointmentDate || !appointmentTime) {
      alert('Please select date and time');
      return;
    }

    setLoading(true);
    try {
      // Validate the date format first
      const dateObj = new Date(appointmentDate);
      if (isNaN(dateObj.getTime()) || dateObj.getFullYear() < 2024 || dateObj.getFullYear() > 2030) {
        alert('Invalid date selected. Please select a valid date.');
        setLoading(false);
        return;
      }

      // Validate the time format
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(appointmentTime)) {
        alert('Invalid time format. Please select a valid time.');
        setLoading(false);
        return;
      }

      // Create a Date object from the selected date and time
      // Ensure we handle the date properly to avoid invalid dates
      const [year, month, day] = appointmentDate.split('-').map(Number);
      const [hours, minutes] = appointmentTime.split(':').map(Number);

      // Create date in local time (not UTC) to avoid timezone issues
      const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);

      // Validate the created date is valid
      if (isNaN(appointmentDateTime.getTime())) {
        alert('Invalid date or time selected. Please try again.');
        setLoading(false);
        return;
      }

      // Check if the year is reasonable (not in the past like 0020)
      if (appointmentDateTime.getFullYear() < 2024 || appointmentDateTime.getFullYear() > 2030) {
        alert('Invalid date selected. Please select a valid date.');
        setLoading(false);
        return;
      }

      // Additional validation: ensure the appointment is in the future
      const now = new Date();
      if (appointmentDateTime <= now) {
        alert('Appointment must be scheduled in the future. Please select a later time.');
        setLoading(false);
        return;
      }

      // Use toISOString() to convert to ISO format
      const scheduledAt = appointmentDateTime.toISOString();
      const response = await apiCall(`${APPOINTMENT_API}/appointments/`, {
        method: 'POST',
        body: JSON.stringify({
          doctor_id: selectedDoctor.user_id,
          scheduled_at: scheduledAt,
          notes: notes
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.appointment_id && !data.id) {
          alert("Error: Server didn't return an appointment ID. Please try again.");
          return;
        }

        // Use either the explicit appointment_id or the object id
        const aptId = data.appointment_id || data.id;

        // Pass result to parent to trigger payment or next step
        if (onBookingSuccess) {
          onBookingSuccess(aptId, selectedDoctor.consultation_fee);
        } else {
          // Fallback local flow
          setBookingResult({ ...data, appointment_id: aptId });
          setStep(3);
        }

      } else {
        const error = await response.json();
        alert(error.error || 'Failed to book appointment');
      }
    } catch (err) {
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (level) => {
    if (!level) return null;
    const colors = {
      'severe': 'bg-rose-50 text-rose-800 border-rose-200',
      'moderately_severe': 'bg-orange-50 text-orange-800 border-orange-200',
      'moderate': 'bg-amber-50 text-amber-800 border-amber-200',
      'mild': 'bg-emerald-50 text-emerald-800 border-emerald-200',
      'minimal': 'bg-teal-50 text-teal-800 border-teal-200'
    };
    return colors[level] || colors.mild;
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

  const DoctorCard = ({ doctor, isSuggested = false }) => (
    <div
      className={`bg-white rounded-2xl p-6 shadow-sm border transition-all cursor-pointer relative group hover:shadow-lg ${isSuggested ? 'border-teal-200 ring-4 ring-teal-50' : 'border-gray-100 hover:border-teal-100'}`}
      onClick={() => setProfileViewDoctor(doctor)}
    >
      {isSuggested && (
        <div className="absolute top-4 right-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-[10px] px-2 py-1 rounded-full font-bold tracking-wider shadow-sm">
          RECOMMENDED
        </div>
      )}

      <div className="flex items-center space-x-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center text-teal-700 text-xl font-bold border-2 border-white shadow-sm group-hover:scale-105 transition-transform">
          {doctor.name?.charAt(0) || 'D'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate">{doctor.name || 'Doctor'}</h3>
          <p className="text-teal-600 text-xs font-semibold uppercase tracking-wide truncate">{doctor.specialization}</p>

          {doctor.average_rating > 0 && (
            <div className="flex items-center space-x-1 mt-1">
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
              <span className="text-xs font-bold text-gray-700">
                {doctor.average_rating.toFixed(1)}
              </span>
              <span className="text-[10px] text-gray-400">
                ({doctor.total_ratings})
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-gray-500 text-xs">
          <span className="font-semibold text-gray-700">Experience:</span> {doctor.experience_years} years
        </p>
        {doctor.bio && (
          <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{doctor.bio}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex items-center space-x-1 text-teal-700 font-bold text-lg">
          <DollarSign className="w-4 h-4" />
          <span>{doctor.consultation_fee}</span>
        </div>
        <button className="bg-gray-50 text-gray-600 group-hover:bg-teal-500 group-hover:text-white px-4 py-2 rounded-lg transition text-xs font-bold">
          Select
        </button>
      </div>
    </div>
  );

  const StepIndicator = () => (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {[1, 2, 3].map((num) => (
        <div key={num} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= num
            ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30'
            : 'bg-gray-100 text-gray-400'
            }`}>
            {num}
          </div>
          {num < 3 && (
            <div className={`w-12 h-1 mx-2 rounded-full ${step > num ? 'bg-teal-200' : 'bg-gray-100'}`} />
          )}
        </div>
      ))}
    </div>
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
            <NavItem icon={Clock} label="Book Session" view="book-appointment" active={true} />
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

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {/* Subtle BG Gradient */}
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-50/50 to-transparent pointer-events-none -z-10"></div>

          <div className="max-w-4xl mx-auto">
            <StepIndicator />

            {/* Step 1: Select Doctor */}
            {step === 1 && (
              <div>
                {/* Suggestion Alert - only show if no specific doctor was selected from assessment */}
                {userSeverity && !targetDoctorId && (
                  <div className={`mb-8 border rounded-2xl p-6 ${getSeverityBadge(userSeverity.severity_level)} shadow-sm`}>
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-white/50 rounded-xl">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">Recommended Care Path</h3>
                        <p className="text-sm opacity-90 mb-2 leading-relaxed">
                          Based on your assessment (Severity: <span className="font-bold capitalize">{userSeverity.severity_level.replace('_', ' ')}</span>),
                          we recommend booking a session with a <strong>{userSeverity.specialist_type}</strong>.
                        </p>
                        {userSeverity.high_risk && (
                          <div className="mt-2 bg-rose-500/10 rounded-lg px-3 py-2 text-xs font-bold flex items-center gap-2 w-fit">
                            <AlertCircle className="w-4 h-4" /> Please prioritize your booking.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Available Specialists</h2>
                  {/* Only show the Recommended/All toggle if no specific doctor was selected from assessment */}
                  {!targetDoctorId && (
                    <div className="flex items-center gap-4">
                      {/* Quiet Search Input added here */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (e.target.value) setShowAllDoctors(true);
                          }}
                          className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none w-32 focus:w-48 transition-all"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setShowAllDoctors(false)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${!showAllDoctors ? 'bg-teal-50 text-teal-700' : 'text-gray-500 hover:bg-gray-50'}`}>Recommended</button>
                        <button onClick={() => setShowAllDoctors(true)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${showAllDoctors ? 'bg-teal-50 text-teal-700' : 'text-gray-500 hover:bg-gray-50'}`}>All Doctors</button>
                      </div>
                    </div>
                  )}
                </div>

                {doctors.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
                    <p className="text-gray-400">No doctors currently available.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {(!showAllDoctors && suggestedDoctors.length > 0 ? suggestedDoctors : doctors).map(doc => (
                      <DoctorCard key={doc.user_id} doctor={doc} isSuggested={!showAllDoctors && suggestedDoctors.some(sd => sd.user_id === doc.user_id)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Schedule & Confirm */}
            {step === 2 && selectedDoctor && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <button onClick={() => setStep(1)} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-gray-900 font-semibold transition text-sm">
                  <ArrowLeft className="w-4 h-4" /> Change Doctor
                </button>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 text-2xl font-bold">
                    {selectedDoctor.name?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedDoctor.name}</h2>
                    <p className="text-teal-600 font-medium">{selectedDoctor.specialization}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Select Date</label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        // Additional validation on date change
                        if (selectedDate) {
                          const date = new Date(selectedDate);
                          const [year] = selectedDate.split('-').map(Number);

                          // Check if the date is valid and year is reasonable
                          if (!isNaN(date.getTime()) && year >= 2024 && year <= 2030 && year.toString().length === 4) {
                            setAppointmentDate(selectedDate);
                          } else {
                            console.error('Invalid date selected:', selectedDate);
                            alert('Please select a valid date between 2024 and 2030');
                          }
                        } else {
                          setAppointmentDate(selectedDate); // Allow empty value
                        }
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Select Time</label>
                    {availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {availableSlots.map(time => (
                          <button
                            key={time}
                            onClick={() => setAppointmentTime(time)}
                            className={`py-2 px-1 rounded-lg text-xs font-bold transition ${appointmentTime === time ? 'bg-teal-500 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                          >
                            {formatIndianTime(time)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic p-3 bg-gray-50 rounded-xl text-center">
                        {appointmentDate ? "No slots available" : "Select a date to view slots"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Notes for Doctor (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50 h-24"
                    placeholder="Briefly describe what you'd like to discuss..."
                  />
                </div>

                <button
                  onClick={handleBooking}
                  disabled={loading || !appointmentDate || !appointmentTime}
                  className="w-full mt-8 bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-teal-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Confirm Appointment'}
                </button>
              </div>
            )}

            {/* Step 3: Success / Payment Hint (Fallback if onBookingSuccess not used) */}
            {step === 3 && bookingResult && (
              <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                <p className="text-gray-500 mb-8">Appointment ID: #{bookingResult.appointment_id}</p>

                <PaymentProcessing
                  appointmentId={bookingResult.appointment_id}
                  amount={selectedDoctor.consultation_fee}
                  token={token}
                  onSuccess={() => {
                    alert("Payment Successful!");
                    setCurrentView('my-appointments');
                  }}
                  onCancel={() => setCurrentView('my-appointments')}
                  setCurrentView={setCurrentView}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      {/* Doctor Profile Modal */}
      {profileViewDoctor && (
        <DoctorProfileModal
          doctor={profileViewDoctor}
          onClose={() => setProfileViewDoctor(null)}
          onBook={(doc) => {
            setProfileViewDoctor(null);
            handleDoctorSelect(doc);
          }}
        />
      )}
    </div>
  );
};

export default BookAppointment;
