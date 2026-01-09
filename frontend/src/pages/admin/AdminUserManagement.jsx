import React, { useState, useEffect } from 'react';
import {
  Shield, Search, Filter, Users, UserCheck, UserX, Eye, X,
  Mail, Phone, Calendar, User, Award, Briefcase, DollarSign,
  CheckCircle, XCircle, Clock, FileText, AlertCircle, ChevronRight,
  Menu, Home, Settings, Activity, LogOut
} from 'lucide-react';
import { USER_API } from '../../config/api';

const AdminUserManagement = ({ user, token, handleLogout, setCurrentView }) => {
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleBlockUser = async (userId, userType = 'user') => {
    const reason = prompt('Please provide a reason for blocking (optional):');
    if (reason === null) return; // User cancelled

    if (!confirm(`Are you sure you want to BLOCK this ${userType}?`)) return;

    try {
      const response = await fetch(`${USER_API}/admin/users/${userId}/block/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        alert(`✅ ${userType.charAt(0).toUpperCase() + userType.slice(1)} blocked successfully!`);
        fetchAllUsers(); // Refresh
        if (selectedUser?.user_id === userId) {
          // Optionally update selected user or close modal, for now just hiding modal is safest to refetch
          setShowModal(false);
          setSelectedUser(null);
        }
      } else {
        const data = await response.json();
        alert(`Failed to block user: ${data.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Error blocking ${userType}`);
      console.error(err);
    }
  };

  const handleUnblockUser = async (userId, userType = 'user') => {
    if (!confirm(`Are you sure you want to UNBLOCK this ${userType}?`)) return;

    try {
      const response = await fetch(`${USER_API}/admin/users/${userId}/unblock/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert(`✅ ${userType.charAt(0).toUpperCase() + userType.slice(1)} unblocked successfully!`);
        fetchAllUsers();
        if (selectedUser?.user_id === userId) {
          setShowModal(false);
          setSelectedUser(null);
        }
      } else {
        const data = await response.json();
        alert(`Failed to unblock user: ${data.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Error unblocking ${userType}`);
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId, userType = 'user') => {
    if (!confirm(`⚠️ ARE YOU SURE?\n\nThis will permanently delete this ${userType} and ALL their data. This action cannot be undone.`)) return;

    try {
      const response = await fetch(`${USER_API}/admin/users/${userId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert(`🗑️ ${userType.charAt(0).toUpperCase() + userType.slice(1)} deleted successfully!`);
        fetchAllUsers();
        if (selectedUser?.user_id === userId) {
          setShowModal(false);
          setSelectedUser(null);
        }
      } else {
        const data = await response.json();
        alert(`Failed to delete user: ${data.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Error deleting ${userType}`);
      console.error(err);
    }
  };

  const handleViewDocument = async (documentId) => {
    try {
      if (!token) {
        console.error('No token available for API request');
        return;
      }

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

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setDoctorDocuments([]);
  };

  const getRoleBadge = (role) => {
    const badges = {
      user: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'User', icon: User },
      doctor: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Doctor', icon: Award },
      admin: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Admin', icon: Shield }
    };
    const badge = badges[role] || badges.user;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 ${badge.bg} ${badge.text} text-xs font-bold uppercase tracking-wider rounded-lg border border-transparent`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending', icon: Clock },
      approved: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Approved', icon: CheckCircle },
      rejected: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Rejected', icon: XCircle }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${badge.bg} ${badge.text} text-[10px] font-bold uppercase tracking-wider rounded-lg`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const NavItem = ({ icon: Icon, label, view, active }) => (
    <button
      onClick={() => { if (view) setCurrentView(view); setSidebarOpen(false); }}
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
            <NavItem icon={Home} label="Overview" view="admin-dashboard" />
            <NavItem icon={Users} label="User Management" view="admin-users" active={true} />
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
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">System Users</h2>
                <p className="text-gray-500 font-medium mt-1">Manage global user accounts and permissions</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-2"><Users className="w-5 h-5" /></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</p>
                <p className="text-xl font-black text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2"><User className="w-5 h-5" /></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Users</p>
                <p className="text-xl font-black text-gray-900">{stats.users}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-2"><Award className="w-5 h-5" /></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Doctors</p>
                <p className="text-xl font-black text-gray-900">{stats.doctors}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-2"><Clock className="w-5 h-5" /></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending</p>
                <p className="text-xl font-black text-gray-900">{stats.pendingDoctors}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-2"><CheckCircle className="w-5 h-5" /></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Approved</p>
                <p className="text-xl font-black text-gray-900">{stats.approvedDoctors}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-2"><XCircle className="w-5 h-5" /></div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rejected</p>
                <p className="text-xl font-black text-gray-900">{stats.rejectedDoctors}</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><Filter className="w-5 h-5" /></div>
                <h3 className="text-lg font-bold text-gray-900">Search & Filter</h3>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-300 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or ID..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-semibold text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div className="relative">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-semibold text-gray-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition appearance-none"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">Users Only</option>
                    <option value="doctor">Doctors Only</option>
                    <option value="admin">Admins Only</option>
                  </select>
                  <div className="absolute right-4 top-3.5 pointer-events-none text-gray-400"><ChevronRight className="w-5 h-5 rotate-90" /></div>
                </div>

                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-semibold text-gray-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition appearance-none"
                  >
                    <option value="all">All System Status</option>
                    <option value="pending">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <div className="absolute right-4 top-3.5 pointer-events-none text-gray-400"><ChevronRight className="w-5 h-5 rotate-90" /></div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                <span>Filtered Results: <span className="text-indigo-600">{filteredUsers.length}</span></span>
                <span className="opacity-50">Total Database: {allUsers.length}</span>
              </div>
            </div>

            {/* Users List */}
            <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Database...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
                  <UserX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No users match your filters.</p>
                </div>
              ) : (
                filteredUsers.map((userObj, idx) => (
                  <div
                    key={userObj.user_id}
                    className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black text-white shadow-lg ${userObj.role === 'admin' ? 'bg-indigo-600 shadow-indigo-200' :
                        userObj.role === 'doctor' ? 'bg-purple-600 shadow-purple-200' :
                          'bg-blue-500 shadow-blue-200'
                        }`}>
                        {userObj.name ? userObj.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 text-lg">{userObj.name || 'Unnamed User'}</h3>
                          {getRoleBadge(userObj.role)}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {userObj.email}</span>
                          {userObj.role === 'doctor' && userObj.doctor?.doctor_status && (
                            getStatusBadge(userObj.doctor.doctor_status)
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => viewUserDetails(userObj)}
                        className="px-5 py-2.5 bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                      >
                        <Eye className="w-4 h-4" /> View
                      </button>
                      <button
                        onClick={() => handleBlockUser(userObj.user_id, userObj.role)}
                        className="px-3 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-xs transition border border-rose-100"
                      >
                        Block
                      </button>
                      <button
                        onClick={() => handleUnblockUser(userObj.user_id, userObj.role)}
                        className="px-3 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl font-bold text-xs transition border border-emerald-100"
                      >
                        Unblock
                      </button>
                      <button
                        onClick={() => handleDeleteUser(userObj.user_id, userObj.role)}
                        className="px-3 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-xs transition border border-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* User Details Modal */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">User Profile</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">ID: {selectedUser.user_id}</p>
                  </div>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition text-gray-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Basic Info */}
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Account Details</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Full Name</p>
                        <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <p className="font-semibold text-gray-900">{selectedUser.email}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Role</p>
                        <div>{getRoleBadge(selectedUser.role)}</div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Joined Date</p>
                        <p className="font-semibold text-gray-900">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Doctor Specifics */}
                {selectedUser.role === 'doctor' && selectedUser.doctor && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Doctor Profile</h3>
                    <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-100 mb-6">
                      <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Specialization</p>
                          <p className="font-bold text-gray-900">{selectedUser.doctor.specialization || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Experience</p>
                          <p className="font-bold text-gray-900">{selectedUser.doctor.experience_years} Years</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Current Status</p>
                          <div className="mt-1">{getStatusBadge(selectedUser.doctor.doctor_status)}</div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Fee</p>
                          <p className="font-bold text-gray-900">₹{selectedUser.doctor.consultation_fee}</p>
                        </div>
                      </div>
                      {selectedUser.doctor.bio && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Bio</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{selectedUser.doctor.bio}</p>
                        </div>
                      )}
                    </div>

                    {/* Documents */}
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Verification Documents</h3>
                    {loadingDocs ? (
                      <div className="text-center py-4 text-gray-400 text-sm">Loading docs...</div>
                    ) : doctorDocuments.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No documents found.</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {doctorDocuments.map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <p className="text-sm font-bold text-gray-900 truncate capitalize">{doc.doc_type.replace(/_/g, ' ')}</p>
                                <p className="text-[10px] text-gray-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleViewDocument(doc.id);
                              }}
                              className="p-2 text-gray-400 hover:text-indigo-600 transition cursor-pointer"
                              title="View Document"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Admin Actions for Pending Doctors */}
                    {selectedUser.doctor.doctor_status === 'pending' && (
                      <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-200 flex gap-4">
                        <button
                          onClick={() => handleRejectDoctor(selectedUser.user_id)}
                          className="flex-1 py-3 rounded-xl font-bold bg-white border border-gray-200 text-gray-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition shadow-sm"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveDoctor(selectedUser.user_id)}
                          className="flex-1 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Block/Unblock Actions for All Users */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
                  <button
                    onClick={() => handleBlockUser(selectedUser.user_id, selectedUser.role)}
                    className="flex-1 py-3 rounded-xl font-bold bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition"
                  >
                    Block User
                  </button>
                  <button
                    onClick={() => handleUnblockUser(selectedUser.user_id, selectedUser.role)}
                    className="flex-1 py-3 rounded-xl font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition"
                  >
                    Unblock User
                  </button>
                  <button
                    onClick={() => handleDeleteUser(selectedUser.user_id, selectedUser.role)}
                    className="flex-1 py-3 rounded-xl font-bold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminUserManagement;
