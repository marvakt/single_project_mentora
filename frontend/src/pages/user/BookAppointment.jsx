import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, DollarSign, User, ArrowLeft, CheckCircle,
  Star, Activity, AlertCircle, TrendingUp
} from 'lucide-react';
import { USER_API, APPOINTMENT_API, MEDICAL_API, apiCall } from '../../config/api';
import PaymentProcessing from './PaymentProcessing';

const BookAppointment = ({ user, token, setCurrentView }) => {
  const [doctors, setDoctors] = useState([]);
  const [suggestedDoctors, setSuggestedDoctors] = useState([]);
  const [showAllDoctors, setShowAllDoctors] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [bookingResult, setBookingResult] = useState(null);
  const [userSeverity, setUserSeverity] = useState(null);

  useEffect(() => {
    fetchUserSeverity();
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchAvailability(selectedDoctor.user_id);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (appointmentDate && availability.length > 0) {
      const slots = getAvailableSlots(appointmentDate, availability);
      setAvailableSlots(slots);
      setAppointmentTime(''); // Reset time when date changes
    }
  }, [appointmentDate, availability]);

  const fetchUserSeverity = async () => {
    try {
      const response = await apiCall(`${MEDICAL_API}/questionnaire/latest`);
      if (response.ok) {
        const data = await response.json();
        if (data.assessment) {
          setUserSeverity(data.assessment);
          fetchSuggestedDoctors(data.assessment.severity_level);
        }
      }
    } catch (err) {
      console.error('Failed to fetch severity:', err);
    }
  };

  const fetchSuggestedDoctors = async (severityLevel) => {
    try {
      const response = await apiCall(`${USER_API}/doctors/`);
      if (response.ok) {
        const allDoctors = await response.json();
        const approved = allDoctors.filter(d => d.doctor_status === 'approved');

        let filtered = approved;
        if (severityLevel === 'severe' || severityLevel === 'moderately_severe') {
          filtered = approved.filter(d =>
            d.specialization?.toLowerCase().includes('psychiatrist') ||
            d.specialization?.toLowerCase().includes('psychiatric')
          );
        } else if (severityLevel === 'moderate') {
          filtered = approved.filter(d =>
            d.specialization?.toLowerCase().includes('psychologist') ||
            d.specialization?.toLowerCase().includes('psychology')
          );
        } else {
          filtered = approved.filter(d =>
            d.specialization?.toLowerCase().includes('counselor') ||
            d.specialization?.toLowerCase().includes('therapist')
          );
        }

        if (filtered.length === 0) filtered = approved;
        setSuggestedDoctors(filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0)));
      }
    } catch (err) {
      console.error('Failed to fetch suggested doctors:', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await apiCall(`${USER_API}/doctors/`);
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
      console.error('Failed to fetch availability:', err);
      setAvailability([]);
    }
  };

  const getAvailableSlots = (dateString, availabilityData) => {
    if (!availabilityData || availabilityData.length === 0) return [];

    const date = new Date(dateString);
    // Convert JS day (0=Sunday, 1=Monday, ..., 6=Saturday) to our backend format (0=Monday, 1=Tuesday, ..., 6=Sunday)
    let dayOfWeek = date.getDay();
    if (dayOfWeek === 0) {
      // Sunday case: JS returns 0, backend expects 6
      dayOfWeek = 6;
    } else {
      // Other days: JS returns 1-6 (Mon-Sat), backend expects 0-5 (Mon-Sat)
      dayOfWeek = dayOfWeek - 1;
    }

    const daySchedule = availabilityData.find(d => d.day_of_week === dayOfWeek);

    if (!daySchedule) return [];

    const slots = [];
    // Parse start and end times including minutes (format could be HH:MM:SS or HH:MM)
    const timeParts = daySchedule.start_time.split(':');
    const [startHour, startMinute] = [parseInt(timeParts[0]), parseInt(timeParts[1])];
    const endTimeParts = daySchedule.end_time.split(':');
    const [endHour, endMinute] = [parseInt(endTimeParts[0]), parseInt(endTimeParts[1])];

    // Generate time slots in 30-minute intervals
    let currentHour = startHour;
    let currentMinute = startMinute;

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      // Add current time slot
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      slots.push(timeString);
      
      // Increment by 30 minutes
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
      
      // Break if we exceed the end time
      if (currentHour > endHour || (currentHour === endHour && currentMinute >= endMinute)) {
        break;
      }
    }

    return slots;
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
      const scheduledAt = `${appointmentDate}T${appointmentTime}:00`;

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
        console.log("Appointment Created Response:", data); // DEBUG LOG
        if (!data.appointment_id && !data.id) {
          console.error("MISSING APPOINTMENT ID in response:", data);
          alert("Error: Server didn't return an appointment ID. Please try again.");
          return;
        }
        setBookingResult(data);
        setStep(3);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to book appointment');
      }
    } catch (err) {
      console.error('Booking error:', err);
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (level) => {
    if (!level) return null;
    const colors = {
      'severe': 'bg-red-100 text-red-800 border-red-200',
      'moderately_severe': 'bg-orange-100 text-orange-800 border-orange-200',
      'moderate': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'mild': 'bg-green-100 text-green-800 border-green-200',
      'minimal': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[level] || colors.mild;
  };

  const DoctorCard = ({ doctor, isSuggested = false }) => (
    <div
      className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition cursor-pointer relative ${isSuggested ? 'ring-2 ring-purple-400' : ''
        }`}
      onClick={() => handleDoctorSelect(doctor)}
    >
      {isSuggested && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-xl font-semibold">
          RECOMMENDED
        </div>
      )}

      <div className="flex items-center space-x-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
          {doctor.name?.charAt(0) || 'D'}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-800">{doctor.name || 'Doctor'}</h3>
          <p className="text-purple-600 text-sm font-semibold">{doctor.specialization}</p>

          {doctor.average_rating > 0 && (
            <div className="flex items-center space-x-1 mt-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-semibold text-gray-700">
                {doctor.average_rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">
                ({doctor.total_ratings} reviews)
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-gray-600 text-sm">
          <span className="font-semibold">Experience:</span> {doctor.experience_years} years
        </p>
        {doctor.bio && (
          <p className="text-gray-600 text-sm line-clamp-2">{doctor.bio}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center space-x-2 text-green-600 font-bold">
          <DollarSign className="w-5 h-5" />
          <span>₹{doctor.consultation_fee}</span>
        </div>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
          Select
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => step === 1 ? setCurrentView('user-dashboard') : setStep(step - 1)}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= num
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gray-200 text-gray-500'
                  }`}>
                  {num}
                </div>
                {num < 3 && (
                  <div className={`w-20 h-1 ${step > num ? 'bg-purple-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-md mx-auto mt-2 text-sm text-gray-600">
            <span>Select Doctor</span>
            <span>Schedule</span>
            <span>Confirm</span>
          </div>
        </div>

        {/* Severity Context Alert */}
        {step === 1 && userSeverity && (
          <div className={`mb-6 border-2 rounded-xl p-4 ${getSeverityBadge(userSeverity.severity_level)}`}>
            <div className="flex items-start space-x-3">
              <Activity className="w-6 h-6 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Your Mental Health Status</h3>
                <p className="text-sm mb-2">
                  Based on your latest assessment, your severity level is:
                  <span className="font-bold ml-1 capitalize">
                    {userSeverity.severity_level.replace('_', ' ')}
                  </span>
                </p>
                <p className="text-sm">
                  We recommend consulting with a <strong>{userSeverity.specialist_type}</strong>.
                  {suggestedDoctors.length > 0 && (
                    <span> We've highlighted recommended specialists below.</span>
                  )}
                </p>
                {userSeverity.high_risk && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <AlertCircle className="w-5 h-5 text-red-600 inline mr-2" />
                    <span className="text-sm text-red-800 font-semibold">
                      High-risk indicators detected. Please book an appointment as soon as possible.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Select Doctor */}
        {step === 1 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Select Your Mental Health Professional
            </h2>

            {doctors.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <p className="text-gray-600">No approved doctors available at the moment.</p>
              </div>
            ) : (
              <>
                {/* Suggested Doctors Section */}
                {suggestedDoctors.length > 0 && !showAllDoctors && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-6 h-6 text-purple-600" />
                        <h3 className="text-xl font-bold text-gray-800">
                          Recommended for You
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowAllDoctors(true)}
                        className="text-purple-600 hover:text-purple-800 font-semibold text-sm"
                      >
                        View All Doctors →
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {suggestedDoctors.slice(0, 6).map((doctor) => (
                        <DoctorCard key={doctor.user_id} doctor={doctor} isSuggested={true} />
                      ))}
                    </div>
                  </div>
                )}

                {/* All Doctors Section */}
                {(showAllDoctors || suggestedDoctors.length === 0) && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-800">
                        {suggestedDoctors.length > 0 ? 'All Available Doctors' : 'Available Doctors'}
                      </h3>
                      {suggestedDoctors.length > 0 && showAllDoctors && (
                        <button
                          onClick={() => setShowAllDoctors(false)}
                          className="text-purple-600 hover:text-purple-800 font-semibold text-sm"
                        >
                          ← Show Recommended Only
                        </button>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {doctors.map((doctor) => (
                        <DoctorCard key={doctor.user_id} doctor={doctor} isSuggested={false} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Schedule Appointment */}
        {step === 2 && selectedDoctor && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Schedule Appointment</h2>

            <div className="bg-white rounded-xl p-8 shadow-xl">
              {/* Selected Doctor Info */}
              <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedDoctor.name?.charAt(0) || 'D'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800">{selectedDoctor.name}</h3>
                  <p className="text-purple-600 text-sm">{selectedDoctor.specialization}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <p className="text-green-600 font-semibold">₹{selectedDoctor.consultation_fee}</p>
                    {selectedDoctor.average_rating > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-semibold">{selectedDoctor.average_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Select Date
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              </div>

              {/* Time Selection - DYNAMIC */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Select Time
                </label>

                {appointmentDate ? (
                  availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {availableSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setAppointmentTime(time)}
                          className={`py-2 px-3 rounded-lg border text-sm font-medium transition ${appointmentTime === time
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-purple-500 hover:text-purple-600'
                            }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 text-sm">
                      No matching slots available for this date.
                    </div>
                  )
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm">
                    Please select a date first to see available times.
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific concerns, symptoms, or information the doctor should know..."
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  rows="4"
                />
              </div>

              <button
                onClick={handleBooking}
                disabled={loading || !appointmentDate || !appointmentTime}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && bookingResult && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-xl text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              <h2 className="text-3xl font-bold text-gray-800 mb-4">Appointment Booked Successfully!</h2>
              <p className="text-gray-600 mb-2">Your appointment has been confirmed.</p>

              {bookingResult.priority && bookingResult.priority === 'high' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <AlertCircle className="w-5 h-5 text-yellow-600 inline mr-2" />
                  <span className="text-yellow-800 text-sm font-semibold">
                    High priority appointment - The doctor has been notified
                  </span>
                </div>
              )}

              <div className="bg-purple-50 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-bold text-gray-800 mb-4">Appointment Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">{selectedDoctor.name}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">{appointmentDate}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">{appointmentTime}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700 font-semibold">₹{selectedDoctor.consultation_fee}</span>
                  </div>
                  {bookingResult.severity_level && (
                    <div className="flex items-center space-x-3">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">
                        Priority: <span className="font-semibold capitalize">{bookingResult.priority}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Next Step: Please proceed with payment to confirm your appointment.
              </p>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  Proceed to Payment
                </button>
                <button
                  onClick={() => setCurrentView('user-dashboard')}
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Payment Processing */}
        {step === 4 && bookingResult && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setStep(3)}
              className="mb-6 flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Details</span>
            </button>

            <PaymentProcessing
              appointmentId={bookingResult.appointment_id}
              amount={selectedDoctor.consultation_fee}
              onSuccess={(response) => {
                alert('Payment Successful! Payment ID: ' + response.razorpay_payment_id);
                setCurrentView('my-appointments');
              }}
              onCancel={() => setStep(3)}
              setCurrentView={setCurrentView}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;
