// ═══════════════════════════════════════════════════════════════
// FILE: src/pages/doctor/DoctorAvailability.jsx
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, Calendar, Clock, Plus, Trash2, Save, 
  AlertCircle, CheckCircle, X 
} from 'lucide-react';
import { USER_API } from '../../config/api';

const DoctorAvailability = ({ user, token, setCurrentView }) => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form states
  const [selectedDay, setSelectedDay] = useState('monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState('30');
  const [maxPatients, setMaxPatients] = useState('1');

  const DAYS_OF_WEEK = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  const DAY_TO_INDEX = {
    'monday': 0,
    'tuesday': 1,
    'wednesday': 2,
    'thursday': 3,
    'friday': 4,
    'saturday': 5,
    'sunday': 6
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${USER_API}/doctor/${user.user_id}/availability/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      }
    } catch (err) {
      console.error('Failed to fetch availability', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    
    // Validation
    if (startTime >= endTime) {
      alert('End time must be after start time');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${USER_API}/doctor/${user.user_id}/availability/add/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          day_of_week: DAY_TO_INDEX[selectedDay],
          start_time: startTime,
          end_time: endTime,
          slot_duration_minutes: parseInt(slotDuration),
          max_patients_per_slot: parseInt(maxPatients)
        })
      });

      if (response.ok) {
        alert('✅ Availability slot added successfully!');
        setShowAddForm(false);
        resetForm();
        fetchAvailability();
      } else {
        const data = await response.json();
        alert(`Failed to add slot: ${data.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Error adding availability slot');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) return;

    try {
      const response = await fetch(`${USER_API}/doctor/availability/${slotId}/delete/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('✅ Slot deleted successfully!');
        fetchAvailability();
      } else {
        alert('Failed to delete slot');
      }
    } catch (err) {
      alert('Error deleting slot');
      console.error(err);
    }
  };

  const resetForm = () => {
    setSelectedDay('monday');
    setStartTime('09:00');
    setEndTime('17:00');
    setSlotDuration('30');
    setMaxPatients('1');
  };

  const groupByDay = () => {
    const grouped = {};
    DAYS_OF_WEEK.forEach((day, index) => {
      grouped[day] = availability.filter(slot => slot.day_of_week === index);
    });
    return grouped;
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const groupedAvailability = groupByDay();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => setCurrentView('doctor-dashboard')} 
              className="text-purple-600 hover:text-purple-800 flex items-center space-x-2"
            >
              <ChevronRight className="w-5 h-5 transform rotate-180" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800">Availability Management</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Manage Your Availability</h1>
              <p className="text-purple-100">Set your working hours and appointment slots</p>
            </div>
            <Calendar className="w-16 h-16 opacity-30" />
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-blue-900 font-semibold">How it works:</p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
              <li>Add your available time slots for each day of the week</li>
              <li>Set slot duration (e.g., 30 or 60 minutes per appointment)</li>
              <li>Define max patients per slot (usually 1 for individual sessions)</li>
              <li>Patients can only book during your available hours</li>
            </ul>
          </div>
        </div>

        {/* Add New Slot Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-purple-600 text-white px-6 py-4 rounded-xl hover:bg-purple-700 transition flex items-center justify-center space-x-2 font-bold mb-6 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Availability Slot</span>
          </button>
        )}

        {/* Add Slot Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Add New Availability</h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day of Week <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent capitalize"
                    required
                  >
                    {DAYS_OF_WEEK.map(day => (
                      <option key={day} value={day} className="capitalize">
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slot Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    required
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Patients Per Slot <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={maxPatients}
                  onChange={(e) => setMaxPatients(e.target.value)}
                  min="1"
                  max="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Typically 1 for individual therapy sessions
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>{saving ? 'Adding...' : 'Add Availability Slot'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Current Availability */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            <span>Your Weekly Schedule</span>
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading availability...</p>
            </div>
          ) : availability.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">No availability slots set</p>
              <p className="text-sm text-gray-500">Add your first slot to start accepting appointments</p>
            </div>
          ) : (
            <div className="space-y-6">
              {DAYS_OF_WEEK.map(day => {
                const daySlots = groupedAvailability[day];
                if (daySlots.length === 0) return null;

                return (
                  <div key={day} className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-bold text-lg text-gray-800 mb-3 capitalize">
                      {day}
                    </h3>
                    <div className="space-y-3">
                      {daySlots.map((slot, idx) => (
                        <div 
                          key={idx} 
                          className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between hover:bg-purple-100 transition"
                        >
                          <div className="flex items-center space-x-4">
                            <Clock className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="font-semibold text-gray-800">
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </p>
                              <p className="text-sm text-gray-600">
                                {slot.slot_duration_minutes} min slots • 
                                Max {slot.max_patients_per_slot} patient{slot.max_patients_per_slot > 1 ? 's' : ''} per slot
                              </p>
                              {slot.is_available ? (
                                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full mt-1">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full mt-1">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                            title="Delete slot"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-lg mt-6">
          <h3 className="font-bold text-blue-900 mb-3">💡 Tips for Setting Availability</h3>
          <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
            <li>Add buffer time between appointments for notes and breaks</li>
            <li>Be consistent with your schedule to build patient trust</li>
            <li>Leave some slots open for emergency or urgent cases</li>
            <li>Consider your peak productivity hours when scheduling</li>
            <li>Update your availability if your schedule changes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailability;