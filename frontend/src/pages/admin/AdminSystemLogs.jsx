import React, { useState } from 'react';
import {
    Home, Users, Activity, Settings, Search, Filter,
    AlertCircle, CheckCircle, Info, Clock, Download,
    Menu, X, ChevronRight, RefreshCw, Server, Shield, LogOut
} from 'lucide-react';

const AdminSystemLogs = ({ user, token, handleLogout, setCurrentView }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Mock Data for Logs
    const [logs] = useState([
        { id: 1, type: 'error', message: 'Database connection timeout', module: 'Auth Service', timestamp: '2024-12-31 10:23:45', user: 'System' },
        { id: 2, type: 'info', message: 'User registration completed', module: 'User Management', timestamp: '2024-12-31 10:20:12', user: 'john.doe@example.com' },
        { id: 3, type: 'warning', message: 'High memory usage detected', module: 'Monitor', timestamp: '2024-12-31 09:45:00', user: 'System' },
        { id: 4, type: 'success', message: 'Doctor verification approved', module: 'Admin Actions', timestamp: '2024-12-31 09:30:22', user: 'admin@mentora.com' },
        { id: 5, type: 'info', message: 'Appointment scheduled', module: 'Appointments', timestamp: '2024-12-31 09:15:10', user: 'patient123' },
        { id: 6, type: 'error', message: 'Failed to send email notification', module: 'Notification Service', timestamp: '2024-12-31 08:55:00', user: 'System' },
        { id: 7, type: 'info', message: 'System backup completed', module: 'Maintenance', timestamp: '2024-12-31 04:00:00', user: 'System' },
        { id: 8, type: 'warning', message: 'API rate limit approaching', module: 'API Gateway', timestamp: '2024-12-31 03:30:00', user: 'external_client' },
    ]);

    const getLogIcon = (type) => {
        switch (type) {
            case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'warning': return <AlertCircle className="w-5 h-5 text-amber-500" />;
            case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'info': default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getLogColor = (type) => {
        switch (type) {
            case 'error': return 'bg-red-50 text-red-700 border-red-200';
            case 'warning': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'success': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'info': default: return 'bg-blue-50 text-blue-700 border-blue-200';
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesFilter = filterType === 'all' || log.type === filterType;
        const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.user.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const NavItem = ({ icon: Icon, label, view, active = false }) => (
        <button
            onClick={() => setCurrentView(view)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
        >
            <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400 group-hover:text-emerald-600'}`} />
            <span className="font-medium">{label}</span>
            {active && <ChevronRight className="w-4 h-4 ml-auto" />}
        </button>
    );

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            {/* Sidebar Navigation */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="h-full flex flex-col">
                    {/* Logo Area */}
                    <div className="h-20 flex items-center px-8 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 p-2 rounded-lg">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 to-teal-600">
                                Mentora<span className="text-emerald-500 text-sm ml-1">Admin</span>
                            </span>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Platform</p>
                        <NavItem icon={Home} label="Overview" view="admin-dashboard" />
                        <NavItem icon={Users} label="User Management" view="admin-users" />
                        <NavItem icon={Activity} label="System Logs" view="admin-logs" active={true} />

                        <div className="my-6 border-t border-gray-100 dark:border-gray-800"></div>

                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Configuration</p>
                        <NavItem icon={Settings} label="Settings" view="admin-settings" />
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t border-gray-100">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                                {user?.name?.[0] || 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Administrator'}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@mentora.com'}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg hover:bg-white hover:text-red-600 hover:shadow-sm transition-all text-gray-400"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
                {/* Mobile Header */}
                <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-emerald-600 p-1.5 rounded-lg">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-gray-900">System Logs</span>
                    </div>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto bg-[#F8FAFC] p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">

                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">System Activity Logs</h1>
                                <p className="text-gray-500 mt-1">Monitor system events, errors, and user activities</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 shadow-sm transition-all">
                                    <Download className="w-4 h-4" />
                                    <span>Export CSV</span>
                                </button>
                                <button
                                    onClick={() => setSearchQuery('')} // In real app, re-fetch
                                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition-all"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Refresh</span>
                                </button>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase">Total Events</p>
                                    <p className="text-2xl font-bold text-gray-900">1,248</p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <Activity className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase">Errors</p>
                                    <p className="text-2xl font-bold text-gray-900">23</p>
                                </div>
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase">Warnings</p>
                                    <p className="text-2xl font-bold text-gray-900">45</p>
                                </div>
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase">Server Status</p>
                                    <p className="text-2xl font-bold text-emerald-600">Healthy</p>
                                </div>
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <Server className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* Filters & Search */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search logs by message, user, or module..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Filter className="w-4 h-4 text-gray-400" />
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full md:w-auto p-2.5 outline-none"
                                >
                                    <option value="all">All Event Types</option>
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                    <option value="error">Error</option>
                                    <option value="success">Success</option>
                                </select>
                            </div>
                        </div>

                        {/* Logs Table */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Message</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Module</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredLogs.length > 0 ? (
                                            filteredLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getLogColor(log.type)}`}>
                                                            {getLogIcon(log.type)}
                                                            <span className="capitalize">{log.type}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                                                        {log.message}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">
                                                            {log.module}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {log.user}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {log.timestamp}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                            <Search className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                        <p className="font-medium text-gray-900">No logs found</p>
                                                        <p className="text-sm">Try adjusting your search or filters</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-sm text-gray-500">
                                <span>Showing {filteredLogs.length} events</span>
                                <div className="flex gap-2">
                                    <button disabled className="px-3 py-1 bg-white border border-gray-200 rounded text-gray-400 cursor-not-allowed">Previous</button>
                                    <button disabled className="px-3 py-1 bg-white border border-gray-200 rounded text-gray-400 cursor-not-allowed">Next</button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};



export default AdminSystemLogs;
