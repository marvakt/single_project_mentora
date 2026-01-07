import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Plus, Trash2, Save,
  AlertCircle, CheckCircle, X, Menu, Settings, Heart, LogOut,
  Home, User, Users, FileText
} from 'lucide-react';
import { USER_API, apiCall } from '../../config/api';
import { formatIndianTime } from '../../utils/dateUtils';

const DoctorAvailability = ({ user, token, handleLogout, setCurrentView }) => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form states
  const [selectedDay, setSelectedDay] = useState('monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [slotDuration, setSlotDuration] = useState('30');
  const [maxPatients, setMaxPatients] = useState('1');
  const [profile, setProfile] = useState(null);

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
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${USER_API}/profile/${user.user_id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

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
      const response = await apiCall(`${USER_API}/doctor/${user.user_id}/availability/add/`, {
        method: 'POST',
        body: JSON.stringify({
          day_of_week: DAY_TO_INDEX[selectedDay],
          start_time: startTime,
          end_time: endTime,
          slot_duration: parseInt(slotDuration),
          max_patients: parseInt(maxPatients)
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
    if (!window.confirm('Are you sure you want to delete this availability slot?')) return;

    try {
      const response = await apiCall(`${USER_API}/doctor/availability/${slotId}/delete/`, {
        method: 'DELETE'
      });

      if (response.ok) {
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


  const groupedAvailability = groupByDay();

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
              <p className="text-xs text-gray-400 font-medium">Doctor Portal</p>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Practice</p>
            <NavItem icon={Home} label="Overview" view="doctor-dashboard" />
            <NavItem icon={Calendar} label="Appointments" view="doctor-appointments" />
            <NavItem icon={Clock} label="Availability" view="doctor-availability" active={true} />
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Clinical</p>
            <NavItem icon={Users} label="My Patients" view="doctor-patients" />
            <NavItem icon={FileText} label="Templates" view="templates" />
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Account</p>
            <NavItem icon={User} label="Profile" view="doctor-profile" />
            <NavItem icon={Settings} label="Settings" view="settings" />
          </nav>
          <div className="p-4 border-t border-gray-100">
            <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold border-2 border-white shadow-sm overflow-hidden">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0) || 'D'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{profile?.name || 'Doctor'}</p>
                <button onClick={handleLogout} className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1">
                  <LogOut className="w-3 h-3" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center"><Heart className="w-4 h-4 text-white" fill="white" /></div>
            <span className="font-bold text-gray-800">Mentora</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"><Menu className="w-6 h-6" /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-teal-50/50 to-transparent pointer-events-none -z-10"></div>

          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Availability</h2>
                <p className="text-gray-500 font-medium">Manage your weekly schedule and working hours</p>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-teal-700 transition shadow-lg shadow-teal-500/20 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add Slot</span>
              </button>
            </div>

            {/* Info Alert */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-6 mb-8 border border-teal-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-teal-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-teal-900 mb-1">Scheduling Guide</h4>
                <p className="text-teal-800/80 text-sm leading-relaxed mb-2">
                  Define your recurring weekly availability here. Patients will be able to book appointments only during these slots.
                </p>
                <ul className="text-xs font-medium text-teal-700 space-y-1 list-disc list-inside opacity-80">
                  <li>Set consistent hours to build patient trust</li>
                  <li>Include buffer times between slots if needed</li>
                  <li>Emergency slots can be added manually</li>
                </ul>
              </div>
            </div>

            {/* Add Slot Form Modal */}
            {showAddForm && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddForm(false)}>
                <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Add Availability Slot</h3>
                    <p className="text-gray-500 text-sm">Configure a new recurring time block</p>
                  </div>

                  <form onSubmit={handleAddSlot} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Day of Week</label>
                      <select
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                        className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none transition capitalize"
                      >
                        {DAYS_OF_WEEK.map(day => (
                          <option key={day} value={day} className="capitalize">
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Start Time</label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none transition"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">End Time</label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none transition"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Duration (Min)</label>
                        <select
                          value={slotDuration}
                          onChange={(e) => setSlotDuration(e.target.value)}
                          className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none transition"
                        >
                          <option value="15">15 min</option>
                          <option value="30">30 min</option>
                          <option value="45">45 min</option>
                          <option value="60">60 min</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Max Patients</label>
                        <input
                          type="number"
                          value={maxPatients}
                          onChange={(e) => setMaxPatients(e.target.value)}
                          min="1"
                          max="10"
                          className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none transition"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-teal-700 transition shadow-lg shadow-teal-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                    >
                      {saving ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Save Slot</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* List Section */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mb-4"></div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Schedule...</p>
              </div>
            ) : availability.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 text-gray-200" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">No availability set</h4>
                <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">Add your first time slot to start accepting appointments from patients.</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-teal-600 font-bold text-sm hover:underline uppercase tracking-widest"
                >
                  Create Schedule
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {DAYS_OF_WEEK.map(day => {
                  const daySlots = groupedAvailability[day];
                  if (daySlots.length === 0) return null;

                  return (
                    <div key={day} className="animate-fade-in-up">
                      <div className="flex items-center gap-4 mb-4">
                        <h3 className="text-lg font-black text-gray-900 capitalize tracking-tight flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                          {day}
                        </h3>
                        <div className="h-px bg-gray-100 flex-1"></div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        {daySlots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                                <Clock className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-lg leading-none mb-1">
                                  {formatIndianTime(slot.start_time)} - {formatIndianTime(slot.end_time)}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{slot.slot_duration_minutes} min</span>
                                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{slot.max_patients_per_slot} patient(s)</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-rose-100 hover:text-rose-700"
                              title="Remove Slot"
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
        </div>
      </main>
    </div>
  );
};

export default DoctorAvailability;