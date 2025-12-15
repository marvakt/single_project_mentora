// ═══════════════════════════════════════════════════════════════
// FILE: src/App.jsx (FIXED IMPORT PATHS)
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';

// Pages - ✅ ALL PATHS FIXED
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DoctorRegisterPage from './pages/auth/DoctorRegisterPage';
import UserDashboard from './pages/user/UserDashboard';
import UserProfile from './pages/user/UserProfile';           // ✅ FIXED: was ./user/UserProfile
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorProfile from './pages/doctor/DoctorProfile';
import AdminDashboard from './pages/admin/AdminDashboard';

const App = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('access_token');
    const savedUser = sessionStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      const role = JSON.parse(savedUser).role;
      if (role === 'admin') {
        setCurrentView('admin-dashboard');
      } else if (role === 'doctor') {
        setCurrentView('doctor-dashboard');
      } else {
        setCurrentView('user-dashboard');
      }
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    setToken(null);
    setUser(null);
    setCurrentView('landing');
  };

  const renderView = () => {
    if (currentView === 'landing') {
      return <LandingPage setCurrentView={setCurrentView} />;
    } else if (currentView === 'login') {
      return <LoginPage setCurrentView={setCurrentView} setUser={setUser} setToken={setToken} />;
    } else if (currentView === 'register') {
      return <RegisterPage setCurrentView={setCurrentView} />;
    } else if (currentView === 'doctor-register') {
      return <DoctorRegisterPage setCurrentView={setCurrentView} />;
    } else if (currentView === 'user-dashboard') {
      return <UserDashboard user={user} token={token} handleLogout={handleLogout} setCurrentView={setCurrentView} />;
    } else if (currentView === 'doctor-dashboard') {
      return <DoctorDashboard user={user} token={token} handleLogout={handleLogout} setCurrentView={setCurrentView} />;
    } else if (currentView === 'admin-dashboard') {
      return <AdminDashboard user={user} token={token} handleLogout={handleLogout} setCurrentView={setCurrentView} />;
    } else if (currentView === 'user-profile') {
      return <UserProfile user={user} token={token} setCurrentView={setCurrentView} />;
    } else if (currentView === 'doctor-profile') {
      return <DoctorProfile user={user} token={token} setCurrentView={setCurrentView} />;
    } else {
      return <LandingPage setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {renderView()}
    </div>
  );
};

export default App;