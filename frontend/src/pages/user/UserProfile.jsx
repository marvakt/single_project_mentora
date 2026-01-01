
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Heart, Calendar, CheckCircle, Clock, TrendingUp, FileText,
  Home, Activity, Smile, Settings, LogOut, Menu, User, Camera,
  Mail, Phone, MapPin, Globe, Shield, ChevronRight
} from 'lucide-react';
import { USER_API } from '../../config/api';
import { logout } from '../../store/slices/authSlice';
import { setCurrentView } from '../../store/slices/uiSlice';
import { fetchUserProfile, updateUserProfile } from '../../store/slices/userProfileSlice';

const UserProfile = () => {
  const dispatch = useDispatch();

  // Redux selectors
  const { user } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.userProfile);

  // Local form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user?.user_id) {
      dispatch(fetchUserProfile(user.user_id));
    }
  }, [user?.user_id, dispatch]);

  useEffect(() => {
    if (profile) {
      setEmail(profile.email || '');
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setGender(profile.gender || '');
      setAddress(profile.address || '');
      setAvatar(profile.avatar || '');
    }
  }, [profile]);



  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await dispatch(updateUserProfile({
        userId: user.user_id,
        data: { name, phone, gender, address, avatar }
      })).unwrap();

      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(setCurrentView('landing'));
  };

  const handleNavigation = (view) => {
    dispatch(setCurrentView(view));
    setSidebarOpen(false);
  };

  // Sidebar Nav Item Helper
  const NavItem = ({ icon: Icon, label, view, active }) => (
    <button
      onClick={() => handleNavigation(view)}
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
            <NavItem icon={Smile} label="Mood Tracker" view="mood-tracker" />
            <NavItem icon={FileText} label="Treatment Plan" view="treatment-plan" />
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Account</p>
            <NavItem icon={User} label="Profile" view="user-profile" active={true} />
            <NavItem icon={Settings} label="Settings" view="settings" />
          </nav>
          <div className="p-4 border-t border-gray-100">
            <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold border-2 border-white shadow-sm overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0) || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{name || user?.name || sessionStorage.getItem('user_name') || 'User'}</p>
                <button onClick={handleLogout} className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1">
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

          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Your Profile</h2>
              <p className="text-gray-500 font-medium">Manage your personal information and account settings</p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* Left Column: Avatar & Overview */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-60"></div>
                  <div className="relative">
                    <div className="relative inline-block group mb-6">
                      <div className="w-32 h-32 rounded-3xl bg-teal-100 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden group-hover:scale-[1.02] transition duration-300">
                        {avatar ? (
                          <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-16 h-16 text-teal-600 opacity-60" />
                        )}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-gray-100 group-hover:scale-110 transition">
                        <Camera className="w-4 h-4 text-teal-600" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{name || 'Set Your Name'}</h3>
                    <p className="text-sm text-gray-500 font-medium mb-6">{email}</p>

                    <div className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider">
                      <Shield className="w-3 h-3" /> Verified Member
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Account Statistics</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                          <Activity className="w-4 h-4 text-teal-600" />
                        </div>
                        <span className="text-sm font-bold text-gray-700">Health Score</span>
                      </div>
                      <span className="text-sm font-black text-teal-600">92%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-sm font-bold text-gray-700">Days Active</span>
                      </div>
                      <span className="text-sm font-black text-emerald-600">48</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Update Form */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
                  <form onSubmit={handleUpdate} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* EMAIL (READ ONLY) */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Mail className="w-3 h-3" /> Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-gray-500 font-medium cursor-not-allowed outline-none"
                        />
                      </div>

                      {/* NAME */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <User className="w-3 h-3 text-teal-600" /> Full Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full bg-gray-50 border border-transparent focus:border-teal-100 focus:bg-white focus:ring-4 focus:ring-teal-500/5 rounded-2xl px-5 py-4 text-gray-900 font-bold transition outline-none"
                        />
                      </div>

                      {/* PHONE */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Phone className="w-3 h-3 text-teal-600" /> Phone Number
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full bg-gray-50 border border-transparent focus:border-teal-100 focus:bg-white focus:ring-4 focus:ring-teal-500/5 rounded-2xl px-5 py-4 text-gray-900 font-bold transition outline-none"
                        />
                      </div>

                      {/* GENDER */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Activity className="w-3 h-3 text-teal-600" /> Gender Identification
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full bg-gray-50 border border-transparent focus:border-teal-100 focus:bg-white focus:ring-4 focus:ring-teal-500/5 rounded-2xl px-5 py-4 text-gray-900 font-bold transition outline-none appearance-none"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other / Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    {/* AVATAR URL */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Globe className="w-3 h-3 text-teal-600" /> Avatar Image URL
                      </label>
                      <input
                        type="text"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-gray-50 border border-transparent focus:border-teal-100 focus:bg-white focus:ring-4 focus:ring-teal-500/5 rounded-2xl px-5 py-4 text-gray-900 font-bold transition outline-none"
                      />
                      <p className="text-[10px] text-gray-400 font-medium px-2 italic">Provide a direct link to a hosted image (JPG, PNG)</p>
                    </div>

                    {/* ADDRESS */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-teal-600" /> Physical Address
                      </label>
                      <textarea
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter your mailing or physical address"
                        className="w-full bg-gray-50 border border-transparent focus:border-teal-100 focus:bg-white focus:ring-4 focus:ring-teal-500/5 rounded-2xl px-5 py-4 text-gray-900 font-bold transition outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-teal-500/20 transition transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>Update Profile Details <CheckCircle className="w-5 h-5" /></>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
