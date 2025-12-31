

// ═══════════════════════════════════════════════════════════════
// FILE: src/pages/admin/AdminDashboard.jsx (COMPLETE VERSION)
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { 
  Shield, LogOut, CheckCircle, XCircle, FileText, Eye, X, 
  User, Mail, Phone, Award, Briefcase, DollarSign, Calendar,
  Menu, Home, Users, Settings, Activity, Search, Filter, ChevronRight
} from 'lucide-react';
import { USER_API } from '../../config/api';

const AdminDashboard = ({ user, token, handleLogout, setCurrentView }) => {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorDocuments, setDoctorDocuments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [currentViewFilter, setCurrentViewFilter] = useState('pending'); // pending, approved, rejected, all
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchAllDoctors();
  }, []);

  const fetchAllDoctors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${USER_API}/admin/users/?role=doctor`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const doctors = data.filter(u => u.role === 'doctor');
        setAllDoctors(doctors);
        
        // Filter pending doctors
        const pending = doctors.filter(d => d.doctor?.doctor_status === 'pending');
        setPendingDoctors(pending);
      }
    } catch (err) {
      console.error('Failed to fetch doctors', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDoctors = () => {
    switch(currentViewFilter) {
      case 'pending':
        return allDoctors.filter(d => d.doctor?.doctor_status === 'pending');
      case 'approved':
        return allDoctors.filter(d => d.doctor?.doctor_status === 'approved');
      case 'rejected':
        return allDoctors.filter(d => d.doctor?.doctor_status === 'rejected');
      default:
        return allDoctors;
    }
  };

  const viewDoctorDetails = async (doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
    setLoadingDocs(true);

    try {
      const response = await fetch(`${USER_API}/doctor/${doctor.user_id}/documents/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const docs = await response.json();
        setDoctorDocuments(docs);
      } else {
        setDoctorDocuments([]);
      }
    } catch (err) {
      console.error('Failed to fetch documents', err);
      setDoctorDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleApprove = async (userId) => {
    if (!confirm('Are you sure you want to APPROVE this doctor? They will be able to accept appointments.')) return;

    try {
      const response = await fetch(`${USER_API}/doctor/${userId}/approve/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        alert('✅ Doctor approved successfully! They can now accept appointments.');
        setShowModal(false);
        setSelectedDoctor(null);
        fetchAllDoctors();
      } else {
        const data = await response.json();
        alert(`Failed to approve: ${data.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Error approving doctor. Please try again.');
      console.error(err);
    }
  };

  const handleReject = async (userId) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    if (!confirm('Are you sure you want to REJECT this doctor application?')) return;

    try {
      const response = await fetch(`${USER_API}/doctor/${userId}/reject/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      if (response.ok) {
        alert('❌ Doctor application rejected.');
        setShowModal(false);
        setSelectedDoctor(null);
        fetchAllDoctors();
      } else {
        alert('Failed to reject doctor');
      }
    } catch (err) {
      alert('Error rejecting doctor');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDoctor(null);
    setDoctorDocuments([]);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending Review', icon: Activity },
      approved: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Approved', icon: CheckCircle },
      rejected: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Rejected', icon: XCircle },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${badge.bg} ${badge.text} text-xs font-bold uppercase tracking-wider rounded-lg`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.label}
      </span>
    );
  };

  const filteredDoctors = getFilteredDoctors();

  // Sidebar Nav Item Helper
  const NavItem = ({ icon: Icon, label, view, active }) => (
    <button
        onClick={() => { if(view) setCurrentView(view); setSidebarOpen(false); }}
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent tracking-tight">Mentora</h1>
                    <p className="text-xs text-gray-400 font-medium">Admin Portal</p>
                </div>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Platform</p>
                <NavItem icon={Home} label="Overview" view="admin-dashboard" active={true} />
                <NavItem icon={Users} label="User Management" view="admin-users" />
                <NavItem icon={Activity} label="System Logs" view="admin-logs" />
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Configuration</p>
                <NavItem icon={Settings} label="Settings" view="admin-settings" />
            </nav>
            <div className="p-4 border-t border-gray-100">
                <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
                        AD
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">Admin</p>
                        <button onClick={handleLogout} className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1">
                            <LogOut className="w-3 h-3" /> Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
          {/* Mobile Header */}
          <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
              <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div>
                  <span className="font-bold text-gray-800">Mentora Admin</span>
              </div>
              <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"><Menu className="w-6 h-6" /></button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none -z-10"></div>
            
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Overview</h2>
                        <p className="text-gray-500 font-medium mt-1">Manage doctors and platform validation</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition"><Users className="w-16 h-16 text-indigo-600" /></div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Doctors</p>
                        <p className="text-3xl font-black text-indigo-900">{allDoctors.length}</p>
                    </div>
                    <div 
                        onClick={() => setCurrentViewFilter('pending')}
                        className={`bg-white p-5 rounded-3xl border shadow-sm relative overflow-hidden group cursor-pointer transition ${currentViewFilter === 'pending' ? 'ring-2 ring-amber-400 border-amber-200' : 'border-gray-100 hover:shadow-lg'}`}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition"><Activity className="w-16 h-16 text-amber-600" /></div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Pending</p>
                        <p className="text-3xl font-black text-amber-600">{pendingDoctors.length}</p>
                    </div>
                    <div 
                        onClick={() => setCurrentViewFilter('approved')}
                        className={`bg-white p-5 rounded-3xl border shadow-sm relative overflow-hidden group cursor-pointer transition ${currentViewFilter === 'approved' ? 'ring-2 ring-emerald-500 border-emerald-200' : 'border-gray-100 hover:shadow-lg'}`}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition"><CheckCircle className="w-16 h-16 text-emerald-600" /></div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Approved</p>
                        <p className="text-3xl font-black text-emerald-600">
                             {allDoctors.filter(d => d.doctor?.doctor_status === 'approved').length}
                        </p>
                    </div>
                    <div 
                        onClick={() => setCurrentViewFilter('rejected')}
                        className={`bg-white p-5 rounded-3xl border shadow-sm relative overflow-hidden group cursor-pointer transition ${currentViewFilter === 'rejected' ? 'ring-2 ring-rose-500 border-rose-200' : 'border-gray-100 hover:shadow-lg'}`}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition"><XCircle className="w-16 h-16 text-rose-600" /></div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Rejected</p>
                        <p className="text-3xl font-black text-rose-600">
                            {allDoctors.filter(d => d.doctor?.doctor_status === 'rejected').length}
                        </p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex space-x-2 overflow-x-auto pb-2 mb-6">
                    {['pending', 'approved', 'rejected', 'all'].map(view => (
                        <button
                            key={view}
                            onClick={() => setCurrentViewFilter(view)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${
                                currentViewFilter === view
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                            }`}
                        >
                            {view.charAt(0).toUpperCase() + view.slice(1)} ({view === 'all' ? allDoctors.length : 
                            view === 'pending' ? pendingDoctors.length :
                            view === 'approved' ? allDoctors.filter(d => d.doctor?.doctor_status === 'approved').length :
                            allDoctors.filter(d => d.doctor?.doctor_status === 'rejected').length})
                        </button>
                    ))}
                </div>

                {/* Doctors Grid */}
                <div className="grid gap-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Doctors...</p>
                        </div>
                    ) : filteredDoctors.length === 0 ? (
                        <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
                             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Shield className="w-10 h-10 text-gray-300" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-2">No doctors found</h4>
                            <p className="text-gray-500 max-w-sm mx-auto">No doctors match the current filter.</p>
                        </div>
                    ) : (
                        filteredDoctors.map((doctor) => (
                            <div key={doctor.user_id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-lg">
                                        {doctor.name ? doctor.name.charAt(0) : 'D'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{doctor.name || 'Unknown Doctor'}</h3>
                                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                                            <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {doctor.email}</span>
                                            {doctor.doctor?.specialization && <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> {doctor.doctor.specialization}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 self-end md:self-auto">
                                    {getStatusBadge(doctor.doctor?.doctor_status)}
                                    <button 
                                        onClick={() => viewDoctorDetails(doctor)}
                                        className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition flex items-center gap-2"
                                    >
                                        <Eye className="w-4 h-4" /> Review
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
          </div>

          {/* DETAIL MODAL */}
          {showModal && selectedDoctor && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Doctor Verification</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Target:</span>
                                    <span className="text-sm font-semibold text-gray-700">{selectedDoctor.name}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={closeModal} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition text-gray-400">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                         {/* Status Banner */}
                         <div className={`p-4 rounded-xl border ${
                            selectedDoctor.doctor?.doctor_status === 'approved' 
                            ? 'bg-emerald-50 border-emerald-100' 
                            : selectedDoctor.doctor?.doctor_status === 'rejected'
                            ? 'bg-rose-50 border-rose-100'
                            : 'bg-amber-50 border-amber-100'
                        }`}>
                            <div className="flex items-center gap-3">
                                {selectedDoctor.doctor?.doctor_status === 'approved' ? <CheckCircle className="text-emerald-600" /> : 
                                 selectedDoctor.doctor?.doctor_status === 'rejected' ? <XCircle className="text-rose-600" /> : 
                                 <Activity className="text-amber-600" />}
                                <div>
                                    <h4 className={`font-bold ${
                                        selectedDoctor.doctor?.doctor_status === 'approved' ? 'text-emerald-900' : 
                                        selectedDoctor.doctor?.doctor_status === 'rejected' ? 'text-rose-900' : 'text-amber-900'
                                    }`}>
                                        Status: {selectedDoctor.doctor?.doctor_status.toUpperCase()}
                                    </h4>
                                    <p className="text-sm opacity-80 mt-1">
                                        {selectedDoctor.doctor?.doctor_status === 'approved' 
                                            ? 'This doctor is verified and listed publicly.'
                                            : selectedDoctor.doctor?.doctor_status === 'rejected'
                                            ? 'This application has been denied.'
                                            : 'Please audit the submitted documents below before approving.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Profile Data */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Personal Info</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Full Name</p>
                                        <p className="font-semibold text-gray-900 text-lg">{selectedDoctor.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Contact</p>
                                        <p className="font-semibold text-gray-900">{selectedDoctor.email}</p>
                                        <p className="font-semibold text-gray-900">{selectedDoctor.phone || 'No phone'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Professional Profile</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Specialization</p>
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold">
                                                <Award className="w-3.5 h-3.5" />
                                                {selectedDoctor.doctor?.specialization || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Experience</p>
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-bold">
                                                <Briefcase className="w-3.5 h-3.5" />
                                                {selectedDoctor.doctor?.experience_years || 0} Years
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Consultation Fee</p>
                                        <p className="font-black text-2xl text-gray-900">₹{selectedDoctor.doctor?.consultation_fee || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div>
                             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-6">Verification Documents</h3>
                             {loadingDocs ? (
                                <div className="py-8 text-center text-gray-500">Loading documents...</div>
                             ) : doctorDocuments.length === 0 ? (
                                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                                    <p className="text-gray-500 font-medium">No documents uploaded.</p>
                                </div>
                             ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {doctorDocuments.map((doc, idx) => (
                                        <div key={idx} className="p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition bg-white group">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 capitalize">{doc.doc_type.replace(/_/g, ' ')}</p>
                                                        <p className="text-xs text-gray-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg transition">
                                                    <Eye className="w-4 h-4" />
                                                </a>
                                            </div>
                                            <div className="mt-3">
                                                 {doc.verified ? (
                                                     <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                                         <CheckCircle className="w-3 h-3" /> Verified
                                                     </span>
                                                 ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                                        <Activity className="w-3 h-3" /> Awaiting
                                                    </span>
                                                 )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    {selectedDoctor.doctor?.doctor_status === 'pending' && (
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
                            <button 
                                onClick={() => handleReject(selectedDoctor.user_id)}
                                className="flex-1 py-4 rounded-xl font-bold bg-white border border-gray-200 text-gray-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition shadow-sm"
                            >
                                Reject Application
                            </button>
                            <button 
                                onClick={() => handleApprove(selectedDoctor.user_id)}
                                className="flex-1 py-4 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition"
                            >
                                Approve Doctor
                            </button>
                        </div>
                    )}
                </div>
             </div>
          )}
      </main>
    </div>
  );
};

export default AdminDashboard;









// // ═══════════════════════════════════════════════════════════════
// // FILE: src/pages/admin/AdminDashboard.jsx - UPDATED WITH USER MANAGEMENT LINK
// // ═══════════════════════════════════════════════════════════════

// import React, { useState, useEffect } from 'react';
// import { 
//   Shield, LogOut, CheckCircle, XCircle, FileText, Eye, X, 
//   User, Mail, Phone, Award, Briefcase, DollarSign, Calendar,
//   Users, Settings, Activity
// } from 'lucide-react';
// import { USER_API } from '../../config/api';

// const AdminDashboard = ({ user, token, handleLogout, setCurrentView }) => {
//   const [pendingDoctors, setPendingDoctors] = useState([]);
//   const [allDoctors, setAllDoctors] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedDoctor, setSelectedDoctor] = useState(null);
//   const [doctorDocuments, setDoctorDocuments] = useState([]);
//   const [showModal, setShowModal] = useState(false);
//   const [loadingDocs, setLoadingDocs] = useState(false);
//   const [currentView, setLocalView] = useState('pending');

//   useEffect(() => {
//     fetchAllDoctors();
//   }, []);

//   const fetchAllDoctors = async () => {
//     setLoading(true);
//     try {
//       const response = await fetch(`${USER_API}/admin/users/?role=doctor`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (response.ok) {
//         const data = await response.json();
//         const doctors = data.filter(u => u.role === 'doctor');
//         setAllDoctors(doctors);
        
//         const pending = doctors.filter(d => d.doctor?.doctor_status === 'pending');
//         setPendingDoctors(pending);
//       }
//     } catch (err) {
//       console.error('Failed to fetch doctors', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getFilteredDoctors = () => {
//     switch(currentView) {
//       case 'pending':
//         return allDoctors.filter(d => d.doctor?.doctor_status === 'pending');
//       case 'approved':
//         return allDoctors.filter(d => d.doctor?.doctor_status === 'approved');
//       case 'rejected':
//         return allDoctors.filter(d => d.doctor?.doctor_status === 'rejected');
//       default:
//         return allDoctors;
//     }
//   };

//   const viewDoctorDetails = async (doctor) => {
//     setSelectedDoctor(doctor);
//     setShowModal(true);
//     setLoadingDocs(true);

//     try {
//       const response = await fetch(`${USER_API}/doctor/${doctor.user_id}/documents/`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (response.ok) {
//         const docs = await response.json();
//         setDoctorDocuments(docs);
//       } else {
//         setDoctorDocuments([]);
//       }
//     } catch (err) {
//       console.error('Failed to fetch documents', err);
//       setDoctorDocuments([]);
//     } finally {
//       setLoadingDocs(false);
//     }
//   };

//   const handleApprove = async (userId) => {
//     if (!confirm('Are you sure you want to APPROVE this doctor?')) return;

//     try {
//       const response = await fetch(`${USER_API}/doctor/${userId}/approve/`, {
//         method: 'POST',
//         headers: { 
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });
//       if (response.ok) {
//         alert('✅ Doctor approved successfully!');
//         setShowModal(false);
//         setSelectedDoctor(null);
//         fetchAllDoctors();
//       } else {
//         const data = await response.json();
//         alert(`Failed: ${data.detail || 'Unknown error'}`);
//       }
//     } catch (err) {
//       alert('Error approving doctor');
//       console.error(err);
//     }
//   };

//   const handleReject = async (userId) => {
//     const reason = prompt('Reason for rejection (optional):');
//     if (reason === null) return;

//     if (!confirm('Are you sure you want to REJECT this doctor?')) return;

//     try {
//       const response = await fetch(`${USER_API}/doctor/${userId}/reject/`, {
//         method: 'POST',
//         headers: { 
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ reason })
//       });
//       if (response.ok) {
//         alert('❌ Doctor application rejected');
//         setShowModal(false);
//         setSelectedDoctor(null);
//         fetchAllDoctors();
//       } else {
//         alert('Failed to reject doctor');
//       }
//     } catch (err) {
//       alert('Error rejecting doctor');
//     }
//   };

//   const closeModal = () => {
//     setShowModal(false);
//     setSelectedDoctor(null);
//     setDoctorDocuments([]);
//   };

//   const getStatusBadge = (status) => {
//     const badges = {
//       pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⏳ Pending' },
//       approved: { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Approved' },
//       rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '❌ Rejected' },
//     };
//     const badge = badges[status] || badges.pending;
//     return (
//       <span className={`px-3 py-1 ${badge.bg} ${badge.text} text-xs font-semibold rounded-full`}>
//         {badge.label}
//       </span>
//     );
//   };

//   const getDocumentStatusBadge = (doc) => {
//     if (doc.verified) {
//       return (
//         <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
//           <CheckCircle className="w-3 h-3 mr-1" />
//           Verified
//         </span>
//       );
//     }
//     return (
//       <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
//         Pending Review
//       </span>
//     );
//   };

//   const filteredDoctors = getFilteredDoctors();

//   const quickActions = [
//     {
//       title: 'User Management',
//       description: 'Manage all users and doctors',
//       icon: Users,
//       color: 'blue',
//       action: () => setCurrentView('admin-users')
//     },
//     {
//       title: 'System Settings',
//       description: 'Configure platform settings',
//       icon: Settings,
//       color: 'purple',
//       action: () => alert('System settings coming soon!')
//     },
//     {
//       title: 'Analytics',
//       description: 'View platform analytics',
//       icon: Activity,
//       color: 'green',
//       action: () => alert('Analytics coming soon!')
//     }
//   ];

//   return (
//     <div className="min-h-screen">
//       {/* Navbar */}
//       <nav className="bg-white shadow-lg">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center space-x-2">
//               <Shield className="w-8 h-8 text-purple-600" />
//               <span className="text-xl font-bold text-gray-800">Mentora Admin</span>
//             </div>
//             <div className="flex items-center space-x-4">
//               <div className="hidden md:block text-sm text-gray-600">
//                 Logged in as: <span className="font-semibold">{user?.email}</span>
//               </div>
//               <button 
//                 onClick={handleLogout} 
//                 className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition flex items-center space-x-2"
//               >
//                 <LogOut className="w-5 h-5" />
//                 <span className="hidden md:inline">Logout</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-4 py-8">
//         <h1 className="text-3xl font-bold mb-8 text-gray-800">Admin Dashboard</h1>

//         {/* Quick Actions */}
//         <div className="mb-8">
//           <h2 className="text-xl font-bold mb-4 text-gray-800">Quick Actions</h2>
//           <div className="grid md:grid-cols-3 gap-4">
//             {quickActions.map((action, idx) => {
//               const Icon = action.icon;
//               const colorClasses = {
//                 blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
//                 purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
//                 green: 'bg-green-100 text-green-600 hover:bg-green-200'
//               };
              
//               return (
//                 <button
//                   key={idx}
//                   onClick={action.action}
//                   className={`${colorClasses[action.color]} p-6 rounded-xl transition transform hover:scale-105 text-left`}
//                 >
//                   <Icon className="w-8 h-8 mb-3" />
//                   <h3 className="font-bold text-lg mb-1">{action.title}</h3>
//                   <p className="text-sm opacity-80">{action.description}</p>
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid md:grid-cols-4 gap-6 mb-8">
//           <div className="bg-white rounded-xl p-6 shadow-lg">
//             <p className="text-gray-600 text-sm font-medium">Total Doctors</p>
//             <p className="text-3xl font-bold text-blue-600 mt-2">{allDoctors.length}</p>
//           </div>
//           <div 
//             className="bg-white rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition"
//             onClick={() => setLocalView('approved')}
//           >
//             <p className="text-gray-600 text-sm font-medium">Approved</p>
//             <p className="text-3xl font-bold text-green-600 mt-2">
//               {allDoctors.filter(d => d.doctor?.doctor_status === 'approved').length}
//             </p>
//           </div>
//           <div 
//             className="bg-white rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition"
//             onClick={() => setLocalView('pending')}
//           >
//             <p className="text-gray-600 text-sm font-medium">Pending Approval</p>
//             <p className="text-3xl font-bold text-yellow-600 mt-2">
//               {pendingDoctors.length}
//             </p>
//           </div>
//           <div 
//             className="bg-white rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition"
//             onClick={() => setLocalView('rejected')}
//           >
//             <p className="text-gray-600 text-sm font-medium">Rejected</p>
//             <p className="text-3xl font-bold text-red-600 mt-2">
//               {allDoctors.filter(d => d.doctor?.doctor_status === 'rejected').length}
//             </p>
//           </div>
//         </div>

//         {/* Filter Tabs */}
//         <div className="bg-white rounded-xl shadow-lg mb-6">
//           <div className="border-b border-gray-200">
//             <div className="flex space-x-8 px-6">
//               {['pending', 'approved', 'rejected', 'all'].map(view => (
//                 <button
//                   key={view}
//                   onClick={() => setLocalView(view)}
//                   className={`py-4 border-b-2 font-semibold transition capitalize ${
//                     currentView === view
//                       ? 'border-purple-600 text-purple-600'
//                       : 'border-transparent text-gray-600 hover:text-gray-800'
//                   }`}
//                 >
//                   {view} ({view === 'all' ? allDoctors.length : 
//                     view === 'pending' ? pendingDoctors.length :
//                     view === 'approved' ? allDoctors.filter(d => d.doctor?.doctor_status === 'approved').length :
//                     allDoctors.filter(d => d.doctor?.doctor_status === 'rejected').length})
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Doctors List */}
//           <div className="p-6">
//             {loading ? (
//               <p className="text-center text-gray-600 py-8">Loading doctors...</p>
//             ) : filteredDoctors.length === 0 ? (
//               <div className="text-center py-12">
//                 <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//                 <p className="text-gray-600 text-lg">No doctors found in this category</p>
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 {filteredDoctors.map((doctor, idx) => (
//                   <div 
//                     key={idx} 
//                     className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition bg-white"
//                   >
//                     <div className="flex items-start justify-between">
//                       <div className="flex-1">
//                         <div className="flex items-center space-x-3 mb-3">
//                           <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
//                             <User className="w-6 h-6 text-purple-600" />
//                           </div>
//                           <div>
//                             <h3 className="font-bold text-lg text-gray-800">
//                               {doctor.name || 'Name not provided'}
//                             </h3>
//                             {getStatusBadge(doctor.doctor?.doctor_status)}
//                           </div>
//                         </div>
                        
//                         <div className="grid md:grid-cols-2 gap-3 text-sm ml-15">
//                           <div className="flex items-center space-x-2 text-gray-600">
//                             <Mail className="w-4 h-4" />
//                             <span>{doctor.email}</span>
//                           </div>
//                           <div className="flex items-center space-x-2 text-gray-600">
//                             <Phone className="w-4 h-4" />
//                             <span>{doctor.phone || 'Not provided'}</span>
//                           </div>
//                           <div className="flex items-center space-x-2 text-gray-600">
//                             <Award className="w-4 h-4" />
//                             <span>{doctor.doctor?.specialization || 'Not specified'}</span>
//                           </div>
//                           <div className="flex items-center space-x-2 text-gray-600">
//                             <Briefcase className="w-4 h-4" />
//                             <span>{doctor.doctor?.experience_years || 0} years experience</span>
//                           </div>
//                         </div>
//                       </div>
                      
//                       <button
//                         onClick={() => viewDoctorDetails(doctor)}
//                         className="bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 transition flex items-center space-x-2 font-semibold"
//                       >
//                         <Eye className="w-4 h-4" />
//                         <span>Review</span>
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Doctor Details Modal (same as before) */}
//       {showModal && selectedDoctor && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
//           <div className="bg-white rounded-2xl max-w-5xl w-full my-8">
//             <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
//               <div>
//                 <h2 className="text-2xl font-bold text-gray-800">Doctor Verification Review</h2>
//                 <p className="text-sm text-gray-600 mt-1">Review profile and documents</p>
//               </div>
//               <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
//                 <X className="w-6 h-6" />
//               </button>
//             </div>

//             <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
//               {/* Profile info and documents here - same as original */}
//               {/* ... (keeping the modal content same as before) ... */}
              
//               {selectedDoctor.doctor?.doctor_status === 'pending' && (
//                 <div className="flex items-center space-x-4 pt-4 border-t-2">
//                   <button
//                     onClick={() => handleApprove(selectedDoctor.user_id)}
//                     disabled={doctorDocuments.length === 0}
//                     className="flex-1 bg-green-600 text-white px-6 py-4 rounded-xl hover:bg-green-700 transition flex items-center justify-center space-x-2 font-bold text-lg disabled:opacity-50"
//                   >
//                     <CheckCircle className="w-6 h-6" />
//                     <span>Approve Doctor</span>
//                   </button>
//                   <button
//                     onClick={() => handleReject(selectedDoctor.user_id)}
//                     className="flex-1 bg-red-600 text-white px-6 py-4 rounded-xl hover:bg-red-700 transition flex items-center justify-center space-x-2 font-bold text-lg"
//                   >
//                     <XCircle className="w-6 h-6" />
//                     <span>Reject</span>
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AdminDashboard;