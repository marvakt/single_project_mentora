import { BrowserRouter, Routes, Route } from "react-router-dom";

/* AUTH PAGES */
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

/* DASHBOARDS */
import DashboardUser from "./pages/DashboardUser";
import DashboardDoctor from "./pages/DashboardDoctor";
import DashboardAdmin from "./pages/DashboardAdmin";

/* USER PAGES */
import UserDashboard from "./pages/UserDashboard";
import UserProfile from "./pages/UserProfile";
import Notifications from "./pages/Notifications";

/* DOCTOR PAGES */
import DoctorOnboarding from "./pages/DoctorOnboarding";
import DoctorStatus from "./pages/DoctorStatus";
import DoctorAvailability from "./pages/DoctorAvailability";

/* ADMIN PAGES */
import AdminDoctorApproval from "./pages/AdminDoctorApproval";

/* PUBLIC PAGES */
import PublicDoctorListing from "./pages/PublicDoctorListing";

/* GUARDS */
import ProtectedRoute from "./components/ProtectedRoute";
import OnboardingGuard from "./routes/OnboardingGuard";

/* ONBOARDING */
import UserOnboarding from "./pages/onboarding/UserOnboarding";
import DoctorBasic from "./pages/onboarding/DoctorBasic";
import DoctorDocs from "./pages/onboarding/DoctorDocs";
import DoctorPending from "./pages/onboarding/DoctorPending";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ---------- AUTH ROUTES ---------- */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* ---------- PUBLIC ROUTES ---------- */}
        <Route path="/doctors" element={<PublicDoctorListing />} />

        {/* ---------- ONBOARDING ROUTES ---------- */}
        <Route path="/onboarding/user/:userId" element={<UserOnboarding />} />

        <Route path="/onboarding/doctor/basic/:userId" element={<DoctorBasic />} />
        <Route path="/onboarding/doctor/docs/:userId" element={<DoctorDocs />} />
        <Route path="/onboarding/doctor/pending" element={<DoctorPending />} />

        {/* ---------- USER DASHBOARD ---------- */}
        <Route
          path="/dashboard/user"
          element={
            <ProtectedRoute allowed={["user"]}>
              <OnboardingGuard>
                <DashboardUser />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
        
        {/* ---------- USER PAGES ---------- */}
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute allowed={["user"]}>
              <OnboardingGuard>
                <UserDashboard />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowed={["user"]}>
              <OnboardingGuard>
                <UserProfile />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowed={["user"]}>
              <OnboardingGuard>
                <Notifications />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />

        {/* ---------- DOCTOR DASHBOARD ---------- */}
        <Route
          path="/dashboard/doctor"
          element={
            <ProtectedRoute allowed={["doctor"]}>
              <OnboardingGuard>
                <DashboardDoctor />
              </OnboardingGuard>
            </ProtectedRoute>
          }
        />
        
        {/* ---------- DOCTOR PAGES ---------- */}
        <Route
          path="/doctor/onboarding"
          element={
            <ProtectedRoute allowed={["doctor"]}>
              <DoctorOnboarding />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/doctor/status"
          element={
            <ProtectedRoute allowed={["doctor"]}>
              <DoctorStatus />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/doctor/availability"
          element={
            <ProtectedRoute allowed={["doctor"]}>
              <DoctorAvailability />
            </ProtectedRoute>
          }
        />

        {/* ---------- ADMIN DASHBOARD (NO ONBOARDING) ---------- */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowed={["admin"]}>
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />
        
        {/* ---------- ADMIN PAGES ---------- */}
        <Route
          path="/admin/doctor-approvals"
          element={
            <ProtectedRoute allowed={["admin"]}>
              <AdminDoctorApproval />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
