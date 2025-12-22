



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
//       return <LandingPage setCurrentView={setCurrentView} />;
//     }
    
//     if (currentView === 'login') {
//       return <LoginPage setCurrentView={setCurrentView} setUser={setUser} setToken={setToken} />;
//     }
    
//     if (currentView === 'register') {
//       return <RegisterPage setCurrentView={setCurrentView} />;
//     }
    
//     if (currentView === 'doctor-register') {
//       return <DoctorRegisterPage setCurrentView={setCurrentView} />;
//     }

//     // User Views
//     if (currentView === 'user-dashboard') {
//       return <UserDashboard user={user} token={token} handleLogout={handleLogout} setCurrentView={setCurrentView} />;
//     }
    
//     if (currentView === 'user-profile') {
//       return <UserProfile user={user} token={token} setCurrentView={setCurrentView} />;
//     }
    
//     if (currentView === 'severity-assessment') {
//       return <SeverityAssessment user={user} token={token} setCurrentView={setCurrentView} />;
//     }
    
//     if (currentView === 'mood-tracker') {
//       return <MoodTracker user={user} token={token} setCurrentView={setCurrentView} />;
//     }
    
//     if (currentView === 'book-appointment') {
//       return <BookAppointment user={user} token={token} setCurrentView={setCurrentView} />;
//     }
    
//     if (currentView === 'my-appointments') {
//       return <MyAppointments user={user} token={token} setCurrentView={setCurrentView} />;
//     }

//     // Doctor Views
//     if (currentView === 'doctor-dashboard') {
//       return <DoctorDashboard user={user} token={token} handleLogout={handleLogout} setCurrentView={setCurrentView} />;
//     }
    
//     if (currentView === 'doctor-profile') {
//       return <DoctorProfile user={user} token={token} setCurrentView={setCurrentView} />;
//     }

//     if (currentView === 'doctor-availability') {
//       return <DoctorAvailability user={user} token={token} setCurrentView={setCurrentView} />;
//     }

//     // Admin Views
//     if (currentView === 'admin-dashboard') {
//       return <AdminDashboard user={user} token={token} handleLogout={handleLogout} setCurrentView={setCurrentView} />;
//     }

//     if (currentView === 'admin-users') {
//       return <AdminUserManagement user={user} token={token} setCurrentView={setCurrentView} />;
//     }

//     // Default
//     return <LandingPage setCurrentView={setCurrentView} />;
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
//       {renderView()}
//     </div>
//   );
// };

// export default App;

// src/App.jsx - COMPLETE INTEGRATION WITH ALL SERVICES
import React, { useState, useEffect } from 'react';

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
import AIChat from './pages/user/AIChat';
import TreatmentPlan from './pages/user/TreatmentPlan';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorProfile from './pages/doctor/DoctorProfile';
import DoctorAvailability from './pages/doctor/DoctorAvailability';
import DoctorAppointments from './pages/doctor/DoctorAppointments';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserManagement from './pages/admin/AdminUserManagement';

// Shared Components
import VideoConsultation from './components/VideoConsultation';
import RealTimeChat from './components/RealTimeChat';
const App = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  
  // Appointment-related state
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('access_token');
    const savedUser = sessionStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      const role = JSON.parse(savedUser).role;
      
      // Route to appropriate dashboard
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

  // Helper functions for appointment navigation
  const viewAppointmentDetail = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setCurrentView('appointment-detail');
  };

  const processPayment = (appointmentId, amount) => {
    setPaymentData({ appointmentId, amount });
    setCurrentView('payment-processing');
  };

  const joinVideoCall = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setCurrentView('video-consultation');
  };

  const renderView = () => {
    // ==========================================
    // AUTH & LANDING PAGES
    // ==========================================
    if (currentView === 'landing') {
      return <LandingPage setCurrentView={setCurrentView} />;
    }
    
    if (currentView === 'login') {
      return (
        <LoginPage 
          setCurrentView={setCurrentView} 
          setUser={setUser} 
          setToken={setToken} 
        />
      );
    }
    
    if (currentView === 'register') {
      return <RegisterPage setCurrentView={setCurrentView} />;
    }
    
    if (currentView === 'doctor-register') {
      return <DoctorRegisterPage setCurrentView={setCurrentView} />;
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
          setCurrentView={setCurrentView} 
        />
      );
    }
    
    if (currentView === 'user-profile') {
      return (
        <UserProfile 
          user={user} 
          token={token} 
          setCurrentView={setCurrentView} 
        />
      );
    }
    
    if (currentView === 'severity-assessment') {
      return (
        <SeverityAssessment 
          user={user} 
          token={token} 
          setCurrentView={setCurrentView} 
        />
      );
    }
    
    if (currentView === 'mood-tracker') {
      return (
        <MoodTracker 
          user={user} 
          token={token} 
          setCurrentView={setCurrentView} 
        />
      );
    }
    
    if (currentView === 'ai-chat') {
      return (
        <AIChat 
          user={user} 
          token={token} 
          setCurrentView={setCurrentView} 
        />
      );
    }
    
    if (currentView === 'treatment-plan') {
      return (
        <TreatmentPlan 
          user={user} 
          token={token} 
          setCurrentView={setCurrentView} 
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
          setCurrentView={setCurrentView}
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
          setCurrentView={setCurrentView}
          onViewDetail={viewAppointmentDetail}
          onProcessPayment={processPayment}
          onJoinVideo={joinVideoCall}
        />
      );
    }

    if (currentView === 'appointment-detail') {
      return (
        <AppointmentDetail
          appointmentId={selectedAppointmentId}
          token={token}
          setCurrentView={setCurrentView}
          onProcessPayment={processPayment}
          onJoinVideo={joinVideoCall}
        />
      );
    }

    if (currentView === 'real-time-chat') {
      return (
        <RealTimeChat
          appointmentId={selectedAppointmentId}
          user={user}
          token={token}
          setCurrentView={setCurrentView}
          onBack={() => setCurrentView('appointment-detail')}
        />
      );
    }

    if (currentView === 'payment-processing') {      return (
        <PaymentProcessing
          appointmentId={paymentData?.appointmentId}
          amount={paymentData?.amount}
          token={token}
          onSuccess={() => {
            // After payment success, go to appointments
            setCurrentView('my-appointments');
          }}
          onCancel={() => {
            setCurrentView('my-appointments');
          }}
          setCurrentView={setCurrentView}
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
          setCurrentView={setCurrentView} 
        />
      );
    }
    
    if (currentView === 'doctor-profile') {
      return (
        <DoctorProfile 
          user={user} 
          token={token} 
          setCurrentView={setCurrentView} 
        />
      );
    }

    if (currentView === 'doctor-availability') {
      return (
        <DoctorAvailability 
          user={user} 
          token={token} 
          setCurrentView={setCurrentView} 
        />
      );
    }

    if (currentView === 'doctor-appointments') {
      return (
        <DoctorAppointments
          user={user}
          token={token}
          setCurrentView={setCurrentView}
          onViewDetail={viewAppointmentDetail}
          onJoinVideo={joinVideoCall}
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
              setCurrentView('doctor-appointments');
            } else {
              setCurrentView('my-appointments');
            }
          }}
          setCurrentView={setCurrentView}
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
          setCurrentView={setCurrentView} 
        />
      );
    }

    if (currentView === 'admin-users') {
      return (
        <AdminUserManagement 
          user={user} 
          token={token} 
          setCurrentView={setCurrentView} 
        />
      );
    }

    // ==========================================
    // DEFAULT FALLBACK
    // ==========================================
    return <LandingPage setCurrentView={setCurrentView} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {renderView()}
    </div>
  );
};

export default App;