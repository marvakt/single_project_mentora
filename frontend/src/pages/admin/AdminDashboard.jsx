

// ═══════════════════════════════════════════════════════════════
// FILE: src/pages/admin/AdminDashboard.jsx (COMPLETE VERSION)
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { 
  Shield, LogOut, CheckCircle, XCircle, FileText, Eye, X, 
  User, Mail, Phone, Award, Briefcase, DollarSign, Calendar 
} from 'lucide-react';
import { USER_API } from '../../config/api';

const AdminDashboard = ({ user, token, handleLogout }) => {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorDocuments, setDoctorDocuments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [currentView, setCurrentView] = useState('pending'); // pending, approved, rejected, all

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
    switch(currentView) {
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
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⏳ Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '❌ Rejected' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-3 py-1 ${badge.bg} ${badge.text} text-xs font-semibold rounded-full`}>
        {badge.label}
      </span>
    );
  };

  const filteredDoctors = getFilteredDoctors();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-purple-600" />
              <span className="text-xl font-bold text-gray-800">Mentora Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-sm text-gray-600">
                Logged in as: <span className="font-semibold">{user?.email}</span>
              </div>
              <button 
                onClick={handleLogout} 
                className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition flex items-center space-x-2"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Doctor Management</h1>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <p className="text-gray-600 text-sm font-medium">Total Doctors</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{allDoctors.length}</p>
          </div>
          <div 
            className="bg-white rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition"
            onClick={() => setCurrentView('approved')}
          >
            <p className="text-gray-600 text-sm font-medium">Approved</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {allDoctors.filter(d => d.doctor?.doctor_status === 'approved').length}
            </p>
          </div>
          <div 
            className="bg-white rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition"
            onClick={() => setCurrentView('pending')}
          >
            <p className="text-gray-600 text-sm font-medium">Pending Approval</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {pendingDoctors.length}
            </p>
          </div>
          <div 
            className="bg-white rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition"
            onClick={() => setCurrentView('rejected')}
          >
            <p className="text-gray-600 text-sm font-medium">Rejected</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {allDoctors.filter(d => d.doctor?.doctor_status === 'rejected').length}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {['pending', 'approved', 'rejected', 'all'].map(view => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`py-4 border-b-2 font-semibold transition capitalize ${
                    currentView === view
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {view} ({view === 'all' ? allDoctors.length : 
                    view === 'pending' ? pendingDoctors.length :
                    view === 'approved' ? allDoctors.filter(d => d.doctor?.doctor_status === 'approved').length :
                    allDoctors.filter(d => d.doctor?.doctor_status === 'rejected').length})
                </button>
              ))}
            </div>
          </div>

          {/* Doctors List */}
          <div className="p-6">
            {loading ? (
              <p className="text-center text-gray-600 py-8">Loading doctors...</p>
            ) : filteredDoctors.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No doctors found in this category</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDoctors.map((doctor, idx) => (
                  <div 
                    key={idx} 
                    className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">
                              {doctor.name || 'Name not provided'}
                            </h3>
                            {getStatusBadge(doctor.doctor?.doctor_status)}
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-3 text-sm ml-15">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{doctor.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{doctor.phone || 'Not provided'}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Award className="w-4 h-4" />
                            <span>{doctor.doctor?.specialization || 'Not specified'}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Briefcase className="w-4 h-4" />
                            <span>{doctor.doctor?.experience_years || 0} years experience</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>₹{doctor.doctor?.consultation_fee || 0} per session</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Registered: {new Date(doctor.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => viewDoctorDetails(doctor)}
                        className="bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 transition flex items-center space-x-2 font-semibold"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Review Details</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Doctor Details Modal */}
      {showModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full my-8">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Doctor Verification Review</h2>
                <p className="text-sm text-gray-600 mt-1">Complete profile and document verification</p>
              </div>
              <button 
                onClick={closeModal} 
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              
              {/* Status Banner */}
              <div className={`p-4 rounded-lg border-l-4 ${
                selectedDoctor.doctor?.doctor_status === 'approved' 
                  ? 'bg-green-50 border-green-500' 
                  : selectedDoctor.doctor?.doctor_status === 'rejected'
                  ? 'bg-red-50 border-red-500'
                  : 'bg-yellow-50 border-yellow-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">
                      Current Status: {getStatusBadge(selectedDoctor.doctor?.doctor_status)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedDoctor.doctor?.doctor_status === 'approved' 
                        ? 'This doctor is approved and can accept appointments'
                        : selectedDoctor.doctor?.doctor_status === 'rejected'
                        ? 'This application has been rejected'
                        : 'Please review all information and documents before approval'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Doctor Profile Information */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                <h3 className="font-bold text-xl mb-4 text-gray-800 flex items-center space-x-2">
                  <User className="w-6 h-6 text-purple-600" />
                  <span>Doctor Profile Information</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Full Name</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {selectedDoctor.name || '❌ Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Email Address</p>
                      <p className="text-lg font-semibold text-gray-800">{selectedDoctor.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Phone Number</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {selectedDoctor.phone || '❌ Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Gender</p>
                      <p className="text-lg font-semibold text-gray-800 capitalize">
                        {selectedDoctor.gender || '❌ Not provided'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Specialization</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {selectedDoctor.doctor?.specialization || '❌ Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Years of Experience</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {selectedDoctor.doctor?.experience_years || 0} years
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Consultation Fee</p>
                      <p className="text-lg font-semibold text-green-600">
                        ₹{selectedDoctor.doctor?.consultation_fee || 0} per session
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Registration Date</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {new Date(selectedDoctor.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                {selectedDoctor.doctor?.bio && (
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <p className="text-sm text-gray-600 font-medium mb-2">Professional Bio</p>
                    <p className="text-gray-700 leading-relaxed">{selectedDoctor.doctor.bio}</p>
                  </div>
                )}
              </div>

              {/* Documents Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-bold text-xl mb-4 text-gray-800 flex items-center space-x-2">
                  <FileText className="w-6 h-6 text-purple-600" />
                  <span>Submitted Documents for Verification</span>
                </h3>
                
                {loadingDocs ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading documents...</p>
                  </div>
                ) : doctorDocuments.length === 0 ? (
                  <div className="bg-red-50 border-2 border-red-200 p-6 rounded-lg text-center">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-red-800 font-semibold text-lg">⚠️ No Documents Uploaded</p>
                    <p className="text-red-600 text-sm mt-2">
                      This doctor has not uploaded any verification documents yet.
                    </p>
                    <p className="text-red-600 text-sm font-semibold mt-2">
                      ❌ Cannot approve without documents!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {doctorDocuments.map((doc, idx) => (
                      <div key={idx} className="border-2 border-gray-300 rounded-lg p-4 hover:border-purple-400 hover:bg-purple-50 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                              <FileText className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-800 capitalize text-lg">
                                {doc.doc_type.replace(/_/g, ' ')}
                              </p>
                              <p className="text-sm text-gray-600">
                                Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()} at {new Date(doc.uploaded_at).toLocaleTimeString()}
                              </p>
                              {doc.verified ? (
                                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full mt-2">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Verified by Admin
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full mt-2">
                                  ⏳ Awaiting Verification
                                </span>
                              )}
                            </div>
                          </div>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 font-semibold"
                          >
                            <Eye className="w-5 h-5" />
                            <span>View Document</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Verification Checklist */}
              <div className="bg-blue-50 border border-blue-200 p-5 rounded-lg">
                <h4 className="font-bold text-blue-900 mb-3 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Verification Checklist</span>
                </h4>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={!!selectedDoctor.name} readOnly className="rounded" />
                    <span className="text-blue-800">Full name provided</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={!!selectedDoctor.phone} readOnly className="rounded" />
                    <span className="text-blue-800">Phone number provided</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={!!selectedDoctor.doctor?.specialization} readOnly className="rounded" />
                    <span className="text-blue-800">Specialization specified</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={doctorDocuments.length >= 3} readOnly className="rounded" />
                    <span className="text-blue-800">Minimum 3 documents uploaded</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={!!selectedDoctor.doctor?.bio} readOnly className="rounded" />
                    <span className="text-blue-800">Professional bio provided</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedDoctor.doctor?.doctor_status === 'pending' && (
                <div className="flex items-center space-x-4 pt-4 border-t-2">
                  <button
                    onClick={() => handleApprove(selectedDoctor.user_id)}
                    disabled={doctorDocuments.length === 0}
                    className="flex-1 bg-green-600 text-white px-6 py-4 rounded-xl hover:bg-green-700 transition flex items-center justify-center space-x-2 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    <CheckCircle className="w-6 h-6" />
                    <span>Approve Doctor</span>
                  </button>
                  <button
                    onClick={() => handleReject(selectedDoctor.user_id)}
                    className="flex-1 bg-red-600 text-white px-6 py-4 rounded-xl hover:bg-red-700 transition flex items-center justify-center space-x-2 font-bold text-lg shadow-lg"
                  >
                    <XCircle className="w-6 h-6" />
                    <span>Reject Application</span>
                  </button>
                </div>
              )}

              {selectedDoctor.doctor?.doctor_status === 'approved' && (
                <div className="bg-green-50 border border-green-300 p-4 rounded-lg text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-bold text-lg">This doctor is already approved!</p>
                  <p className="text-green-700 text-sm mt-1">They can accept appointments on the platform.</p>
                </div>
              )}

              {selectedDoctor.doctor?.doctor_status === 'rejected' && (
                <div className="bg-red-50 border border-red-300 p-4 rounded-lg text-center">
                  <XCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />
                  <p className="text-red-800 font-bold text-lg">This application has been rejected</p>
                </div>
              )}

              {/* Important Notice */}
              <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700">
                <p className="font-semibold mb-2">⚠️ Important:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Verify all documents carefully before approval</li>
                  <li>Check medical license validity and registration number</li>
                  <li>Ensure degree certificates are from recognized institutions</li>
                  <li>Approved doctors will be visible to patients immediately</li>
                  <li>An email notification will be sent to the doctor upon approval/rejection</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
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