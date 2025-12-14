import { useEffect, useState } from "react";
import { Search, CheckCircle, XCircle, Users, UserPlus, Calendar, Stethoscope } from "lucide-react";
import { getUserList, approveDoctor, rejectDoctor } from "../api/user";

export default function DashboardAdmin() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    pendingApprovals: 0,
    activeDoctors: 0
  });
  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    status: "all",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const res = await getUserList({
      search: filters.search,
      role: filters.role,
      status: filters.status,
    });
    
    setUsers(res.data);
    
    // Calculate stats
    const doctors = res.data.filter(u => u.role === 'doctor');
    const pendingDoctors = doctors.filter(u => u.onboarding_status < 100);
    const activeDoctors = doctors.filter(u => u.onboarding_status === 100);
    
    setStats({
      totalUsers: res.data.filter(u => u.role === 'user').length,
      totalDoctors: doctors.length,
      pendingApprovals: pendingDoctors.length,
      activeDoctors: activeDoctors.length
    });
  };

  const approve = async (id) => {
    await approveDoctor(id);
    loadUsers();
  };

  const reject = async (id) => {
    await rejectDoctor(id);
    loadUsers();
  };

  return (
    <div className="min-h-screen flex bg-gray-100">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white shadow-md p-6">
        <h1 className="text-2xl font-bold text-blue-600 mb-6">Mentora Admin</h1>

        <nav className="space-y-4">
          <p className="font-semibold text-gray-700">Dashboard</p>
          <p className="font-semibold text-gray-700">Users</p>
          <p className="font-semibold text-gray-700">Doctors</p>
          <p className="font-semibold text-gray-700">Approvals</p>
          <p className="font-semibold text-gray-700">Settings</p>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10">

        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Users size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Stethoscope size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Doctors</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalDoctors}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <UserPlus size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingApprovals}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <Calendar size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Doctors</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeDoctors}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* QUICK LINKS */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Users className="text-blue-600 mr-2" size={20} />
              <span className="font-medium text-gray-700">Manage Users</span>
            </button>
            <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Stethoscope className="text-green-600 mr-2" size={20} />
              <span className="font-medium text-gray-700">Manage Doctors</span>
            </button>
            <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <CheckCircle className="text-purple-600 mr-2" size={20} />
              <span className="font-medium text-gray-700">Review Approvals</span>
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white p-5 rounded-lg shadow mb-6 flex items-center gap-4 flex-wrap">

          <div className="flex items-center border px-3 rounded-lg bg-gray-50">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search…"
              className="p-2 bg-transparent outline-none"
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <select
            className="input"
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="doctor">Doctors</option>
          </select>

          <select
            className="input"
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
          </select>

          <button
            onClick={loadUsers}
            className="btn-primary whitespace-nowrap"
          >
            Apply Filters
          </button>
        </div>

        {/* USERS TABLE */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-6 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="p-4">{u.user_id}</td>
                    <td className="p-4">{u.name || "—"}</td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${u.role === 'doctor' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.onboarding_status === 100 ? (
                        <span className="px-3 py-1 text-sm rounded bg-green-100 text-green-600">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-sm rounded bg-yellow-100 text-yellow-600">
                          Pending
                        </span>
                      )}
                    </td>

                    {/* ACTION BUTTONS */}
                    <td className="p-4 flex gap-3">

                      {u.role === "doctor" && (
                        <>
                          <button
                            onClick={() => approve(u.user_id)}
                            className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <CheckCircle size={16} /> Approve
                          </button>

                          <button
                            onClick={() => reject(u.user_id)}
                            className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <XCircle size={16} /> Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}