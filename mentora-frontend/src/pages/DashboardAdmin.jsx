import { useEffect, useState } from "react";
import { Search, CheckCircle, XCircle } from "lucide-react";
import { getUserList, approveDoctor, rejectDoctor } from "../api/user";

export default function DashboardAdmin() {
  const [users, setUsers] = useState([]);
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

        {/* FILTERS */}
        <div className="bg-white p-5 rounded-lg shadow mb-6 flex items-center gap-4">

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
            className="btn-primary"
          >
            Apply
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
                    <td className="p-4">{u.role}</td>
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