// ═══════════════════════════════════════════════════════════════
// FILE: src/pages/admin/AdminUserManagement.jsx
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, Filter, Users, UserCheck, UserX, Eye, X,
  Mail, Phone, Calendar, User, Award, Briefcase, DollarSign,
  CheckCircle, XCircle, Clock, FileText, AlertCircle, ChevronRight
} from 'lucide-react';
import { USER_API } from '../../config/api';

const AdminUserManagement = ({ user, token, setCurrentView }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [doctorDocuments, setDoctorDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    users: 0,
    doctors: 0,
    pendingDoctors: 0,
    approvedDoctors: 0,
    rejectedDoctors: 0
  });

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allUsers, searchQuery, roleFilter, statusFilter]);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${USER_API}/admin/users/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
        calculateStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (users) => {
    const stats = {
      total: users.length,
      users: users.filter(u => u.role === 'user').length,
      doctors: users.filter(u => u.role === 'doctor').length,
      pendingDoctors: users.filter(u => u.role === 'doctor' && u.doctor?.doctor_status === 'pending').length,
      approvedDoctors: users.filter(u => u.role === 'doctor' && u.doctor?.doctor_status === 'approved').length,
      rejectedDoctors: users.filter(u => u.role === 'doctor' && u.doctor?.doctor_status === 'rejected').length
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...allUsers];

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Status filter for doctors
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        filtered = filtered.filter(u => u.role === 'doctor' && u.doctor?.doctor_status === 'pending');
      } else if (statusFilter === 'approved') {
        filtered = filtered.filter(u => u.role === 'doctor' && u.doctor?.doctor_status === 'approved');
      } else if (statusFilter === 'rejected') {
        filtered = filtered.filter(u => u.role === 'doctor' && u.doctor?.doctor_status === 'rejected');
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.user_id?.toLowerCase().includes(query) ||
        u.phone?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const viewUserDetails = async (userObj) => {
    setSelectedUser(userObj);
    setShowModal(true);

    // Fetch documents if doctor
    if (userObj.role === 'doctor') {
      setLoadingDocs(true);
      try {
        const response = await fetch(`${USER_API}/doctor/${userObj.user_id}/documents/`, {
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
    }
  };

  const handleApproveDoctor = async (userId) => {
    if (!confirm('Are you sure you want to APPROVE this doctor?')) return;

    try {
      const response = await fetch(`${USER_API}/doctor/${userId}/approve/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        alert('✅ Doctor approved successfully!');
        setShowModal(false);
        setSelectedUser(null);
        fetchAllUsers();
      } else {
        const data = await response.json();
        alert(`Failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Error approving doctor');
      console.error(err);
    }
  };

  const handleRejectDoctor = async (userId) => {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return;

    if (!confirm('Are you sure you want to REJECT this doctor?')) return;

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
        alert('❌ Doctor application rejected');
        setShowModal(false);
        setSelectedUser(null);
        fetchAllUsers();
      } else {
        alert('Failed to reject doctor');
      }
    } catch (err) {
      alert('Error rejecting doctor');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setDoctorDocuments([]);
  };

  const getRoleBadge = (role) => {
    const badges = {
      user: { bg: 'bg-blue-100', text: 'text-blue-800', label: '👤 User' },
      doctor: { bg: 'bg-purple-100', text: 'text-purple-800', label: '🩺 Doctor' },
      admin: { bg: 'bg-red-100', text: 'text-red-800', label: '👑 Admin' }
    };
    const badge = badges[role] || badges.user;
    return (
      <span className={`px-3 py-1 ${badge.bg} ${badge.text} text-xs font-semibold rounded-full`}>
        {badge.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⏳ Pending', icon: Clock },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Approved', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '❌ Rejected', icon: XCircle }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-3 py-1 ${badge.bg} ${badge.text} text-xs font-semibold rounded-full`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => setCurrentView('admin-dashboard')} 
              className="text-purple-600 hover:text-purple-800 flex items-center space-x-2"
            >
              <ChevronRight className="w-5 h-5 transform rotate-180" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800">User & Doctor Management</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-5 shadow-lg">
            <Users className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-sm font-medium opacity-90">Total Users</p>
            <p className="text-3xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl p-5 shadow-lg">
            <User className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-sm font-medium opacity-90">Patients</p>
            <p className="text-3xl font-bold mt-1">{stats.users}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-5 shadow-lg">
            <UserCheck className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-sm font-medium opacity-90">Total Doctors</p>
            <p className="text-3xl font-bold mt-1">{stats.doctors}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl p-5 shadow-lg">
            <Clock className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-sm font-medium opacity-90">Pending</p>
            <p className="text-3xl font-bold mt-1">{stats.pendingDoctors}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-5 shadow-lg">
            <CheckCircle className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-sm font-medium opacity-90">Approved</p>
            <p className="text-3xl font-bold mt-1">{stats.approvedDoctors}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-5 shadow-lg">
            <XCircle className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-sm font-medium opacity-90">Rejected</p>
            <p className="text-3xl font-bold mt-1">{stats.rejectedDoctors}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-lg text-gray-800">Filters & Search</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, email, ID, phone..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role Filter</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="user">Users Only</option>
                <option value="doctor">Doctors Only</option>
                <option value="admin">Admins Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing <span className="font-semibold text-purple-600">{filteredUsers.length}</span> of {allUsers.length} total users
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span>User Directory</span>
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No users found</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((userObj, idx) => (
                <div 
                  key={idx} 
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-purple-300 transition bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          userObj.role === 'doctor' ? 'bg-purple-100' : 
                          userObj.role === 'admin' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          {userObj.role === 'doctor' ? (
                            <Award className={`w-6 h-6 text-purple-600`} />
                          ) : userObj.role === 'admin' ? (
                            <Shield className={`w-6 h-6 text-red-600`} />
                          ) : (
                            <User className={`w-6 h-6 text-blue-600`} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">
                            {userObj.name || 'Name not provided'}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {getRoleBadge(userObj.role)}
                            {userObj.role === 'doctor' && userObj.doctor && 
                              getStatusBadge(userObj.doctor.doctor_status)
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-3 text-sm ml-15">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{userObj.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{userObj.phone || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span className="text-xs">ID: {userObj.user_id}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Joined: {new Date(userObj.created_at).toLocaleDateString()}</span>
                        </div>
                        {userObj.role === 'doctor' && userObj.doctor && (
                          <>
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Award className="w-4 h-4" />
                              <span>{userObj.doctor.specialization || 'Not specified'}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Briefcase className="w-4 h-4" />
                              <span>{userObj.doctor.experience_years || 0} years exp.</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => viewUserDetails(userObj)}
                      className="bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 transition flex items-center space-x-2 font-semibold"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full my-8">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">User Profile Details</h2>
                <p className="text-sm text-gray-600 mt-1">Complete information and verification status</p>
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
              
              {/* User Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <h3 className="font-bold text-xl mb-4 text-gray-800 flex items-center space-x-2">
                  <User className="w-6 h-6 text-blue-600" />
                  <span>Basic Information</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Full Name</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {selectedUser.name || '❌ Not provided'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Email</p>
                      <p className="text-lg font-semibold text-gray-800">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Phone</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {selectedUser.phone || '❌ Not provided'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">User ID</p>
                      <p className="text-lg font-semibold text-gray-800 text-xs">{selectedUser.user_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Role</p>
                      <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Registration Date</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {new Date(selectedUser.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor-specific info */}
              {selectedUser.role === 'doctor' && selectedUser.doctor && (
                <>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                    <h3 className="font-bold text-xl mb-4 text-gray-800 flex items-center space-x-2">
                      <Award className="w-6 h-6 text-purple-600" />
                      <span>Doctor Profile</span>
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Specialization</p>
                          <p className="text-lg font-semibold text-gray-800">
                            {selectedUser.doctor.specialization || '❌ Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Experience</p>
                          <p className="text-lg font-semibold text-gray-800">
                            {selectedUser.doctor.experience_years || 0} years
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Consultation Fee</p>
                          <p className="text-lg font-semibold text-green-600">
                            ₹{selectedUser.doctor.consultation_fee || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Status</p>
                          <div className="mt-1">
                            {getStatusBadge(selectedUser.doctor.doctor_status)}
                          </div>
                        </div>
                      </div>
                    </div>
                    {selectedUser.doctor.bio && (
                      <div className="mt-4 pt-4 border-t border-purple-200">
                        <p className="text-sm text-gray-600 font-medium mb-2">Bio</p>
                        <p className="text-gray-700">{selectedUser.doctor.bio}</p>
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-bold text-xl mb-4 text-gray-800 flex items-center space-x-2">
                      <FileText className="w-6 h-6 text-purple-600" />
                      <span>Documents</span>
                    </h3>
                    {loadingDocs ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-gray-600 mt-4">Loading documents...</p>
                      </div>
                    ) : doctorDocuments.length === 0 ? (
                      <div className="bg-red-50 border-2 border-red-200 p-6 rounded-lg text-center">
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <p className="text-red-800 font-semibold">No documents uploaded</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {doctorDocuments.map((doc, idx) => (
                          <div key={idx} className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <FileText className="w-5 h-5 text-purple-600" />
                                <div>
                                  <p className="font-semibold capitalize">
                                    {doc.doc_type.replace(/_/g, ' ')}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {new Date(doc.uploaded_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                              >
                                View
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {selectedUser.doctor.doctor_status === 'pending' && (
                    <div className="flex space-x-4 pt-4 border-t-2">
                      <button
                        onClick={() => handleApproveDoctor(selectedUser.user_id)}
                        disabled={doctorDocuments.length === 0}
                        className="flex-1 bg-green-600 text-white px-6 py-4 rounded-xl hover:bg-green-700 transition flex items-center justify-center space-x-2 font-bold disabled:opacity-50"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>Approve Doctor</span>
                      </button>
                      <button
                        onClick={() => handleRejectDoctor(selectedUser.user_id)}
                        className="flex-1 bg-red-600 text-white px-6 py-4 rounded-xl hover:bg-red-700 transition flex items-center justify-center space-x-2 font-bold"
                      >
                        <XCircle className="w-5 h-5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;