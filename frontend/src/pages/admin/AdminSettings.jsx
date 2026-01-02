import React, { useState } from 'react';
import {
    Home, Users, Activity, Settings, Shield, LogOut,
    Save, Bell, Lock, User, Mail, Globe, Database,
    CheckCircle, AlertTriangle, Menu, X, ChevronRight, ToggleLeft, ToggleRight, Clock
} from 'lucide-react';

const AdminSettings = ({ user, token, handleLogout, setCurrentView }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Mock Settings State
    const [settings, setSettings] = useState({
        siteName: 'Mentora Platform',
        supportEmail: 'support@mentora.com',
        maintenanceMode: false,
        allowRegistrations: true,
        emailNotifications: true,
        autoApproveDoctors: false,
        sessionTimeout: 60,
    });

    const handleCreate = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setSuccessMessage('Settings saved successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        }, 1000);
    };

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

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
                        <NavItem icon={Activity} label="System Logs" view="admin-logs" />

                        <div className="my-6 border-t border-gray-100 dark:border-gray-800"></div>

                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Configuration</p>
                        <NavItem icon={Settings} label="Settings" view="admin-settings" active={true} />
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
                        <span className="font-bold text-gray-900">Settings</span>
                    </div>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-auto bg-[#F8FAFC] p-4 lg:p-8">
                    <div className="max-w-4xl mx-auto space-y-6">

                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
                                <p className="text-gray-500 mt-1">Manage system configurations and preferences</p>
                            </div>
                            {successMessage && (
                                <div className="hidden md:flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 animate-fade-in">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>{successMessage}</span>
                                </div>
                            )}
                        </div>

                        {/* Settings Tabs */}
                        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
                            {['general', 'security', 'notifications'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                        }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Settings Content */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <form onSubmit={handleCreate} className="p-6 space-y-8">

                                {/* General Settings */}
                                {activeTab === 'general' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
                                                <div className="relative">
                                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={settings.siteName}
                                                        onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="email"
                                                        value={settings.supportEmail}
                                                        onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-gray-100">
                                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-emerald-600" />
                                                System Status
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div>
                                                        <p className="font-medium text-gray-900">Maintenance Mode</p>
                                                        <p className="text-sm text-gray-500">Disable access for all non-admin users</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggle('maintenanceMode')}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${settings.maintenanceMode ? 'bg-emerald-600' : 'bg-gray-200'}`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div>
                                                        <p className="font-medium text-gray-900">Allow Registrations</p>
                                                        <p className="text-sm text-gray-500">Enable new users and doctors to sign up</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggle('allowRegistrations')}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${settings.allowRegistrations ? 'bg-emerald-600' : 'bg-gray-200'}`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.allowRegistrations ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Security Settings */}
                                {activeTab === 'security' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                                                <div className="relative">
                                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="number"
                                                        value={settings.sessionTimeout}
                                                        onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div>
                                                <p className="font-medium text-gray-900">Auto-approve Doctors</p>
                                                <p className="text-sm text-gray-500">Automatically verify doctor accounts upon registration (Not Recommended)</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleToggle('autoApproveDoctors')}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${settings.autoApproveDoctors ? 'bg-emerald-600' : 'bg-gray-200'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autoApproveDoctors ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>

                                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                                            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-sm font-semibold text-amber-800">Administrator Access</h4>
                                                <p className="text-sm text-amber-600 mt-1">
                                                    Changing security settings can affect all users. Please ensure you have reviewed the implications.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Notifications Settings */}
                                {activeTab === 'notifications' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div>
                                                <p className="font-medium text-gray-900">Email Notifications</p>
                                                <p className="text-sm text-gray-500">Receive system alerts via email</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleToggle('emailNotifications')}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${settings.emailNotifications ? 'bg-emerald-600' : 'bg-gray-200'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="pt-6 flex items-center justify-end gap-3 border-t border-gray-100">
                                    <button
                                        type="button"
                                        className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                                    >
                                        Reset Defaults
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-200 flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                <span>Save Changes</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
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


export default AdminSettings;
