import React, { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, User, ArrowLeft, CheckCircle } from 'lucide-react';
import { USER_API, APPOINTMENT_API, apiCall } from '../../config/api';

const BookAppointment = ({ user, token, setCurrentView }) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Doctor, 2: Schedule, 3: Confirm

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await apiCall(`${USER_API}/doctors/`);
      if (response.ok) {
        const data = await response.json();
        // Filter only approved doctors
        setDoctors(data.filter(d => d.doctor_status === 'approved'));
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setStep(2);
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
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= num 
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

        {/* Step 1: Select Doctor */}
        {step === 1 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Select Your Doctor</h2>
            
            {doctors.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <p className="text-gray-600">No approved doctors available at the moment.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctors.map((doctor) => (
                  <div 
                    key={doctor.user_id}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition cursor-pointer"
                    onClick={() => handleDoctorSelect(doctor)}
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
                        {doctor.name?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{doctor.name || 'Doctor'}</h3>
                        <p className="text-purple-600 text-sm font-semibold">{doctor.specialization}</p>
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
                ))}
              </div>
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
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{selectedDoctor.name}</h3>
                  <p className="text-purple-600 text-sm">{selectedDoctor.specialization}</p>
                  <p className="text-green-600 font-semibold">₹{selectedDoctor.consultation_fee}</p>
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

              {/* Time Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Select Time
                </label>
                <select
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="">Choose a time slot</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="16:00">04:00 PM</option>
                  <option value="17:00">05:00 PM</option>
                </select>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any specific concerns or information..."
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  rows="3"
                />
              </div>

              <button 
                onClick={handleBooking}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-xl text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Appointment Booked!</h2>
              <p className="text-gray-600 mb-8">Your appointment has been successfully scheduled.</p>

              <div className="bg-purple-50 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-bold text-gray-800 mb-4">Appointment Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-purple-600" />
                    <span className="text-gray-700">Dr. {selectedDoctor.name}</span>
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
                </div>
              </div>

              <div className="flex space-x-4">
                <button 
                  onClick={() => setCurrentView('my-appointments')}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  View My Appointments
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
      </div>
    </div>
  );
};

export default BookAppointment;