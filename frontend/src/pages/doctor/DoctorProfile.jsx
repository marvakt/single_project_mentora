import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  ChevronRight, Upload, FileText, CheckCircle, Clock, Trash2,
  User, Mail, Phone, MapPin, Award, Heart, Shield, Edit2, Save, X,
  Menu, Home, Calendar, Users, Settings, LogOut, AlertCircle
} from 'lucide-react';
import { USER_API, apiCall } from '../../config/api';
import { logout } from '../../store/slices/authSlice';
import { setCurrentView } from '../../store/slices/uiSlice';
import { fetchDoctorProfile, updateDoctorProfile } from '../../store/slices/doctorProfileSlice';


const DoctorProfile = () => {
  const dispatch = useDispatch();

  // Redux selectors
  const { user } = useSelector((state) => state.auth);
  const { doctorProfile } = useSelector((state) => state.doctorProfile);

  // Local state
  const [activeTab, setActiveTab] = useState('info');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [fee, setFee] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('license');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (user?.user_id) {
      dispatch(fetchDoctorProfile(user.user_id));
      fetchDocuments();
    }
  }, [user?.user_id, dispatch]);

  useEffect(() => {
    if (doctorProfile) {
      setName(doctorProfile.name || '');
      setPhone(doctorProfile.phone || '');
      // Access doctor fields from the nested doctor object
      setSpecialization(doctorProfile.doctor?.specialization || '');
      setExperience(doctorProfile.doctor?.experience_years || '');
      setFee(doctorProfile.doctor?.consultation_fee || '');
      setBio(doctorProfile.doctor?.bio || '');
    }
  }, [doctorProfile]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(setCurrentView('landing'));
  };

  const handleNavigation = (view) => {
    dispatch(setCurrentView(view));
    setSidebarOpen(false);
  };

  const fetchProfile = async () => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await fetch(`${USER_API}/profile/${user.user_id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setName(data.name || '');
        setPhone(data.phone || '');
        setSpecialization(data.doctor?.specialization || '');
        setExperience(data.doctor?.experience_years || '');
        setFee(data.doctor?.consultation_fee || '');
        setBio(data.doctor?.bio || '');
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await apiCall(`${USER_API}/doctor/${user.user_id}/documents/`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Failed to fetch documents', err);
    }
  };

  const handleViewDocument = async (documentId) => {
    try {
      const token = sessionStorage.getItem('access_token');
      
      const response = await fetch(`${USER_API}/doctor/document/${documentId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Open the presigned URL in a new tab
        window.open(data.presigned_url, '_blank');
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to access document');
      }
    } catch (err) {
      console.error('Error accessing document:', err);
      alert('Error accessing document');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update user profile
      const profileResponse = await apiCall(`${USER_API}/profile/${user.user_id}/update/`, {
        method: 'PUT',
        body: JSON.stringify({ name, phone })
      });

      if (!profileResponse.ok) {
        const profileError = await profileResponse.json();
        throw new Error(profileError.detail || 'Failed to update profile');
      }
      
      // Update doctor profile (now also handles user profile fields)
      const doctorResponse = await apiCall(`${USER_API}/doctor/${user.user_id}/profile/`, {
        method: 'POST',
        body: JSON.stringify({
          name, // Include user profile fields in doctor profile update
          phone,
          specialization,
          experience_years: parseInt(experience) || 0,
          consultation_fee: parseInt(fee) || 500,
          bio
        })
      });

      if (!doctorResponse.ok) {
        const doctorError = await doctorResponse.json();
        throw new Error(doctorError.detail || 'Failed to update doctor profile');
      }
      
      alert('Profile updated successfully!');
      dispatch(fetchDoctorProfile(user.user_id));
    } catch (err) {
      console.error('Error updating profile:', err);
      alert(`Failed to update profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    setUploadingDoc(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('doc_type', selectedDocType);

      // Get the JWT token
      const token = sessionStorage.getItem('access_token');
      
      const response = await fetch(`${USER_API}/doctor/${user.user_id}/document/upload/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type header, let browser set it with boundary
        }
      });

      if (response.ok) {
        alert('Document uploaded successfully!');
        setSelectedFile(null);
        setSelectedDocType('license');
        fetchDocuments();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to upload document');
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      alert('Error uploading document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const getDocumentStatusBadge = (doc) => {
    if (doc.verified) {
      return (
        <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md border border-emerald-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-md border border-amber-200">
        <Clock className="w-3 h-3 mr-1" />
        Pending Review
      </span>
    );
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
              <p className="text-xs text-gray-400 font-medium">Doctor Portal</p>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Practice</p>
            <NavItem icon={Home} label="Overview" view="doctor-dashboard" />
            <NavItem icon={Calendar} label="Appointments" view="doctor-appointments" />
            <NavItem icon={Clock} label="Availability" view="doctor-availability" />
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Clinical</p>
            <NavItem icon={Users} label="My Patients" view="doctor-patients" />
            <NavItem icon={FileText} label="Templates" view="templates" />
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Account</p>
            <NavItem icon={User} label="Profile" view="doctor-profile" active={true} />
            <NavItem icon={Settings} label="Settings" view="settings" />
          </nav>
          <div className="p-4 border-t border-gray-100">
            <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold border-2 border-white shadow-sm overflow-hidden">
                {doctorProfile?.avatar ? (
                  <img src={doctorProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  doctorProfile?.name?.charAt(0) || 'D'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{doctorProfile?.name || 'Doctor'}</p>
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
            <div className="mb-8 relative z-10">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Professional Profile</h1>
              <p className="text-gray-500 font-medium">Manage your clinical information and credentials</p>
            </div>

            {/* Status Alert */}
            {doctorProfile?.doctor_status === 'pending' && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-2xl mb-8 flex items-start gap-4 shadow-sm">
                <div className="bg-amber-100 rounded-xl p-2 shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-lg">Verification Pending</p>
                  <p className="text-sm opacity-90 mt-1 leading-relaxed">Please complete your profile details and upload all required verification documents. Our admin team will review your application shortly.</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
              <div className="border-b border-gray-100">
                <div className="flex p-2 gap-2">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'info'
                      ? 'bg-teal-50 text-teal-700 shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    <User className="w-4 h-4" />
                    Basic Information
                  </button>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'documents'
                      ? 'bg-teal-50 text-teal-700 shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    <Shield className="w-4 h-4" />
                    Documents
                    {documents.length > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-teal-200/50 text-teal-800 text-[10px] rounded-full">
                        {documents.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6 md:p-8">
                {/* Basic Information Tab */}
                {activeTab === 'info' && (
                  <form onSubmit={handleUpdateProfile} className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-900 outline-none transition"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                          Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-900 outline-none transition"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Specialization <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Award className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-900 outline-none transition appearance-none cursor-pointer"
                          required
                        >
                          <option value="">Select Specialization</option>
                          <option value="Counselor">Counselor</option>
                          <option value="Psychologist">Psychologist</option>
                          <option value="Psychiatrist">Psychiatrist</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                          Experience (Years) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            min="0"
                            className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-900 outline-none transition"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                          Consultation Fee (₹) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">₹</span>
                          <input
                            type="number"
                            value={fee}
                            onChange={(e) => setFee(e.target.value)}
                            min="0"
                            className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-gray-900 outline-none transition"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Professional Bio
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-2xl px-4 py-3 text-sm font-medium text-gray-900 outline-none transition resize-none"
                        placeholder="Tell patients about your experience, approach, and specialties..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-teal-700 transition shadow-lg shadow-teal-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-4 hover:scale-[1.01]"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Updating Information...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Documents Tab */}
                {activeTab === 'documents' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    {/* Upload Form */}
                    <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-6 rounded-3xl border border-teal-100">
                      <h3 className="font-bold text-lg mb-4 text-teal-900 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-teal-600" />
                        Upload New Document
                      </h3>
                      <form onSubmit={handleDocumentUpload} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-teal-700 uppercase tracking-widest mb-2">
                            Document Type
                          </label>
                          <select
                            value={selectedDocType}
                            onChange={(e) => setSelectedDocType(e.target.value)}
                            className="w-full bg-white border border-teal-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none transition cursor-pointer"
                          >
                            <option value="license">Medical License</option>
                            <option value="degree">Degree Certificate</option>
                            <option value="id_proof">ID Proof</option>
                            <option value="experience_certificate">Experience Certificate</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-teal-700 uppercase tracking-widest mb-2">
                            Select File
                          </label>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <label className="flex-1 cursor-pointer">
                              <input
                                type="file"
                                onChange={handleFileSelect}
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                              />
                              <div className="w-full bg-white border border-dashed border-teal-300 rounded-2xl px-4 py-3 text-sm font-medium text-gray-500 hover:bg-teal-50 transition flex items-center justify-center gap-2">
                                {selectedFile ? (
                                  <span className="text-teal-700 font-bold truncate">{selectedFile.name}</span>
                                ) : (
                                  <>
                                    <FileText className="w-4 h-4" />
                                    <span>Choose file (PDF, JPG, PNG)</span>
                                  </>
                                )}
                              </div>
                            </label>

                            <button
                              type="submit"
                              disabled={!selectedFile || uploadingDoc}
                              className="bg-teal-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
                            >
                              {uploadingDoc ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                              <span>Upload</span>
                            </button>
                          </div>
                          <p className="text-[10px] text-teal-600/70 font-bold uppercase tracking-widest mt-2 ml-1">
                            Max size: 5MB
                          </p>
                        </div>
                      </form>
                    </div>

                    {/* Uploaded Documents List */}
                    <div>
                      <h3 className="font-bold text-lg mb-4 text-gray-900">Your Documents</h3>
                      {documents.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-100 rounded-3xl p-12 text-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-gray-300" />
                          </div>
                          <p className="font-bold text-gray-900">No documents uploaded</p>
                          <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                            Upload your license, degree, and ID proof to get verified by our team.
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {documents.map((doc, idx) => (
                            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                                  <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="font-bold text-gray-900 capitalize text-sm">
                                    {doc.doc_type.replace(/_/g, ' ')}
                                  </p>
                                  <p className="text-xs text-gray-400 font-medium">
                                    Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {getDocumentStatusBadge(doc)}
                                <a
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleViewDocument(doc.id);
                                  }}
                                  className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-teal-50 hover:text-teal-600 transition"
                                  title="View Document"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorProfile;