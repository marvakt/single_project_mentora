



// // ═══════════════════════════════════════════════════════════════
// // FILE: src/App.jsx - UPDATED WITH NEW ROUTES
// // ═══════════════════════════════════════════════════════════════

// import React, { useState, useEffect } from 'react';

// // Auth & Landing
// import LandingPage from './pages/LandingPage';
// import LoginPage from './pages/auth/LoginPage';
// import RegisterPage from './pages/auth/RegisterPage';
// import DoctorRegisterPage from './pages/auth/DoctorRegisterPage';

// // User Pages
// import UserDashboard from './pages/user/UserDashboard';
// import UserProfile from './pages/user/UserProfile';
// import SeverityAssessment from './pages/user/SeverityAssessment';
// import MoodTracker from './pages/user/MoodTracker';
// import BookAppointment from './pages/user/BookAppointment';
// import MyAppointments from './pages/user/MyAppointments';

// // Doctor Pages
// import DoctorDashboard from './pages/doctor/DoctorDashboard';
// import DoctorProfile from './pages/doctor/DoctorProfile';
// import DoctorAvailability from './pages/doctor/DoctorAvailability';

// // Admin Pages
// import AdminDashboard from './pages/admin/AdminDashboard';
// import AdminUserManagement from './pages/admin/AdminUserManagement';

// const App = () => {
//   const [currentView, setCurrentView] = useState('landing');
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(null);

//   useEffect(() => {
//     const savedToken = sessionStorage.getItem('access_token');
//     const savedUser = sessionStorage.getItem('user');
//     if (savedToken && savedUser) {
//       setToken(savedToken);
//       setUser(JSON.parse(savedUser));
//       const role = JSON.parse(savedUser).role;
//       if (role === 'admin') {
//         setCurrentView('admin-dashboard');
//       } else if (role === 'doctor') {
//         setCurrentView('doctor-dashboard');
//       } else {
//         setCurrentView('user-dashboard');
//       }
//     }
//   }, []);

//   const handleLogout = () => {
//     sessionStorage.clear();
//     setToken(null);
//     setUser(null);
//     setCurrentView('landing');
//   };

//   const renderView = () => {
//     // Auth & Landing
//     if (currentView === 'landing') {
//       return <LandingPage setCurrentView={handleSetCurrentView} />;
//     }

//     if (currentView === 'login') {
//       return <LoginPage setCurrentView={handleSetCurrentView} setUser={setUser} setToken={setToken} />;
//     }

//     if (currentView === 'register') {
//       return <RegisterPage setCurrentView={handleSetCurrentView} />;
//     }

//     if (currentView === 'doctor-register') {
//       return <DoctorRegisterPage setCurrentView={handleSetCurrentView} />;
//     }

//     // User Views
//     if (currentView === 'user-dashboard') {
//       return <UserDashboard user={user} token={token} handleLogout={handleLogout} setCurrentView={handleSetCurrentView} />;
//     }

//     if (currentView === 'user-profile') {
//       return <UserProfile user={user} token={token} setCurrentView={handleSetCurrentView} />;
//     }

//     if (currentView === 'severity-assessment') {
//       return <SeverityAssessment user={user} token={token} setCurrentView={handleSetCurrentView} />;
//     }

//     if (currentView === 'mood-tracker') {
//       return <MoodTracker user={user} token={token} setCurrentView={handleSetCurrentView} />;
//     }

//     if (currentView === 'book-appointment') {
//       return <BookAppointment user={user} token={token} setCurrentView={handleSetCurrentView} />;
//     }

//     if (currentView === 'my-appointments') {
//       return <MyAppointments user={user} token={token} setCurrentView={handleSetCurrentView} />;
//     }

//     // Doctor Views
//     if (currentView === 'doctor-dashboard') {
//       return <DoctorDashboard user={user} token={token} handleLogout={handleLogout} setCurrentView={handleSetCurrentView} />;
//     }

//     if (currentView === 'doctor-profile') {
//       return <DoctorProfile user={user} token={token} setCurrentView={handleSetCurrentView} />;
//     }

//     if (currentView === 'doctor-availability') {
//       return <DoctorAvailability user={user} token={token} setCurrentView={handleSetCurrentView} />;
//     }

//     // Admin Views
//     if (currentView === 'admin-dashboard') {
//       return <AdminDashboard user={user} token={token} handleLogout={handleLogout} setCurrentView={handleSetCurrentView} />;
//     }

//     if (currentView === 'admin-users') {
//       return <AdminUserManagement user={user} token={token} setCurrentView={handleSetCurrentView} />;
//     }

//     // Default
//     return <LandingPage setCurrentView={handleSetCurrentView} />;
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
//       {renderView()}
//     </div>
//   );
// };

// export default App;

// src/App.jsx - COMPLETE INTEGRATION WITH ALL SERVICES
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './store/slices/authSlice';
import { setCurrentView } from './store/slices/uiSlice';

// Auth & Landing
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DoctorRegisterPage from './pages/auth/DoctorRegisterPage';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import UserProfile from './pages/user/UserProfile';
import SeverityAssessment from './pages/user/SeverityAssessment';
import MoodTracker from './pages/user/MoodTracker';
import BookAppointment from './pages/user/BookAppointment';
import MyAppointments from './pages/user/MyAppointments';
import AppointmentDetail from './pages/user/AppointmentDetail';
import PaymentProcessing from './pages/user/PaymentProcessing';

import TreatmentPlan from './pages/user/TreatmentPlan';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorProfile from './pages/doctor/DoctorProfile';
import DoctorAvailability from './pages/doctor/DoctorAvailability';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorAppointmentDetail from './pages/doctor/DoctorAppointmentDetail';
import DoctorPatients from './pages/doctor/DoctorPatients';


// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminSystemLogs from './pages/admin/AdminSystemLogs';
import AdminSettings from './pages/admin/AdminSettings';

// Shared Components
import VideoConsultation from './components/VideoConsultation';
import RealTimeChat from './components/RealTimeChat';
import { useNotifications } from './hooks/useNotifications';
const App = () => {
  const dispatch = useDispatch();

  // Redux selectors
  const { user, token, isAuthenticated, role } = useSelector((state) => state.auth);
  const { currentView } = useSelector((state) => state.ui);
  const { selectedAppointment } = useSelector((state) => state.appointments);

  // Local state for navigation helpers
  const [selectedAppointmentId, setSelectedAppointmentId] = React.useState(null);
  const [paymentData, setPaymentData] = React.useState(null);

  const { requestPermission, listenForMessages } = useNotifications();

  useEffect(() => {
    // Route to appropriate dashboard if authenticated
    if (isAuthenticated && role) {
      if (role === 'admin') {
        dispatch(setCurrentView('admin-dashboard'));
      } else if (role === 'doctor') {
        dispatch(setCurrentView('doctor-dashboard'));
      } else {
        dispatch(setCurrentView('user-dashboard'));
      }

      // Request notification permission on login
      requestPermission();
      listenForMessages();
    }
  }, [isAuthenticated, role, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(setCurrentView('landing'));
  };

  const handleSetCurrentView = (view) => {
    dispatch(setCurrentView(view));
  };

  // Helper functions for appointment navigation
  const viewAppointmentDetail = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    dispatch(setCurrentView('appointment-detail'));
  };

  const viewDoctorAppointmentDetail = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    dispatch(setCurrentView('doctor-appointment-detail'));
  };

  const openChat = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    dispatch(setCurrentView('real-time-chat'));
  };

  const processPayment = (appointmentId, amount) => {
    setPaymentData({ appointmentId, amount });
    dispatch(setCurrentView('payment-processing'));
  };

  const joinVideoCall = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    dispatch(setCurrentView('video-consultation'));
  };

  const renderView = () => {
    // ==========================================
    // AUTH & LANDING PAGES
    // ==========================================
    if (currentView === 'landing') {
      return <LandingPage setCurrentView={handleSetCurrentView} />;
    }

    if (currentView === 'login') {
      return (
        <LoginPage
          setCurrentView={handleSetCurrentView}
        />
      );
    }

    if (currentView === 'register') {
      return <RegisterPage setCurrentView={handleSetCurrentView} />;
    }

    if (currentView === 'doctor-register') {
      return <DoctorRegisterPage setCurrentView={handleSetCurrentView} />;
    }

    // ==========================================
    // USER VIEWS
    // ==========================================
    if (currentView === 'user-dashboard') {
      return (
        <UserDashboard
          user={user}
          token={token}
          handleLogout={handleLogout}
          setCurrentView={handleSetCurrentView}
        />
      );
    }

    if (currentView === 'user-profile') {
      return (
        <UserProfile
          user={user}
          token={token}
          setCurrentView={handleSetCurrentView}
        />
      );
    }

    if (currentView === 'severity-assessment') {
      return (
        <SeverityAssessment
          user={user}
          token={token}
          setCurrentView={handleSetCurrentView}
        />
      );
    }

    if (currentView === 'mood-tracker') {
      return (
        <MoodTracker
          user={user}
          token={token}
          setCurrentView={handleSetCurrentView}
        />
      );
    }



    if (currentView === 'treatment-plan') {
      return (
        <TreatmentPlan
          user={user}
          token={token}
          setCurrentView={handleSetCurrentView}
        />
      );
    }



    // ==========================================
    // APPOINTMENT VIEWS (USER)
    // ==========================================
    if (currentView === 'book-appointment') {
      return (
        <BookAppointment
          user={user}
          token={token}
          setCurrentView={handleSetCurrentView}
          onBookingSuccess={(appointmentId, amount) => {
            // After booking, redirect to payment
            processPayment(appointmentId, amount);
          }}
        />
      );
    }

    if (currentView === 'my-appointments') {
      return (
        <MyAppointments
          user={user}
          token={token}
          setCurrentView={handleSetCurrentView}
          onViewDetail={viewAppointmentDetail}
          onProcessPayment={processPayment}
          onJoinVideo={joinVideoCall}
          onViewChat={openChat}
        />
      );
    }

    if (currentView === 'appointment-detail') {
      return (
        <AppointmentDetail
          appointmentId={selectedAppointmentId}
          token={token}
          setCurrentView={handleSetCurrentView}
          onProcessPayment={processPayment}
          onJoinVideo={joinVideoCall}
          onViewChat={openChat}
        />
      );
    }

    if (currentView === 'real-time-chat') {
      return (
        <RealTimeChat
          appointmentId={selectedAppointmentId}
          user={user}
          token={token}
          setCurrentView={handleSetCurrentView}
          onBack={() => {
            if (user?.role === 'doctor') {
              dispatch(setCurrentView('doctor-appointment-detail'));
            } else {
              dispatch(setCurrentView('appointment-detail'));
            }
          }}
        />
      );
    }

    if (currentView === 'payment-processing') {
      return (
        <PaymentProcessing
          appointmentId={paymentData?.appointmentId}
          amount={paymentData?.amount}
          token={token}
          onSuccess={() => {
            // After payment success, go to appointments
            dispatch(setCurrentView('my-appointments'));
          }}
          onCancel={() => {
            dispatch(setCurrentView('my-appointments'));
          }}
          setCurrentView={handleSetCurrentView}
        />
      );
    }

    // ==========================================
    // DOCTOR VIEWS
    // ==========================================
    if (currentView === 'doctor-dashboard') {
      return (
        <DoctorDashboard
          user={user}
          token={token}
          handleLogout={handleLogout}
          setCurrentView={handleSetCurrentView}
        />
      );
    }

    if (currentView === 'doctor-profile') {
      return (
        <DoctorProfile
          user={user}
          token={token}
          setCurrentView={handleSetCurrentView}
        />
      );
    }

    if (currentView === 'doctor-availability') {
      return (
        <DoctorAvailability
          user={user}
          token={token}
          setCurrentView={handleSetCurrentView}
        />
      );
    }

    if (currentView === 'doctor-appointments') {
      return (
        <DoctorAppointments
          user={user}
          token={token}
          handleLogout={handleLogout}
          setCurrentView={handleSetCurrentView}
          onViewDetail={viewDoctorAppointmentDetail}
          onJoinVideo={joinVideoCall}
        />
      );
    }

    if (currentView === 'doctor-appointment-detail') {
      return (
        <DoctorAppointmentDetail
          appointmentId={selectedAppointmentId}
          token={token}
          handleLogout={handleLogout}
          setCurrentView={handleSetCurrentView}
          onJoinVideo={joinVideoCall}
          onViewChat={openChat}
        />
      );
    }

    if (currentView === 'doctor-patients') {
      return (
        <DoctorPatients
          user={user}
          token={token}
          handleLogout={handleLogout}
          setCurrentView={handleSetCurrentView}
        />
      );
    }

    // ==========================================
    // VIDEO CONSULTATION (SHARED)
    // ==========================================
    if (currentView === 'video-consultation') {
      return (
        <VideoConsultation
          appointmentId={selectedAppointmentId}
          token={token}
          userRole={user?.role}
          onEndCall={() => {
            // After ending call, go back to appropriate appointments page
            if (user?.role === 'doctor') {
              dispatch(setCurrentView('doctor-appointments'));
            } else {
              dispatch(setCurrentView('my-appointments'));
            }
          }}
          setCurrentView={handleSetCurrentView}
        />
      );
    }

    // ==========================================
    // ADMIN VIEWS
    // ==========================================
    if (currentView === 'admin-dashboard') {
      return (
        <AdminDashboard
          user={user}
          token={token}
          handleLogout={handleLogout}
          setCurrentView={handleSetCurrentView}
        />
      );
    }

    if (currentView === 'admin-users') {
      return (
        <AdminUserManagement
          user={user}
          token={token}
          setCurrentView={handleSetCurrentView}
        />
      );
    }

    if (currentView === 'admin-logs') {
      return (
        <AdminSystemLogs
          user={user}
          token={token}
          setCurrentView={handleSetCurrentView}
          handleLogout={handleLogout}
        />
      );
    }

    if (currentView === 'admin-settings') {
      return (
        <AdminSettings
          user={user}
          token={token}
          setCurrentView={handleSetCurrentView}
          handleLogout={handleLogout}
        />
      );
    }

    // ==========================================
    // DEFAULT FALLBACK
    // ==========================================
    return <LandingPage setCurrentView={handleSetCurrentView} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {renderView()}
    </div>
  );
};

export default App;
