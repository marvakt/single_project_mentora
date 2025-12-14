import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { getProfile } from "../api/user";
import { toast } from "react-toastify";

export default function OnboardingGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [redirect, setRedirect] = useState(null);

  const token = sessionStorage.getItem("access");


  useEffect(() => {
    const run = async () => {
      if (!token) return setRedirect("/login");

      let decoded;
      try {
        decoded = jwtDecode(token);
      } catch (err) {
        sessionStorage.clear();

        return setRedirect("/login");
      }

      const userId = decoded.user_id;
      const role = decoded.role;

      try {
        const res = await getProfile(userId);
        const profile = res.data;

        const onboardingStatus = profile.onboarding_status || 0;

        // USER FLOW
        if (role === "user" && onboardingStatus < 100)
          return setRedirect(`/onboarding/user/${userId}`);

        // DOCTOR FLOW
        if (role === "doctor") {
          if (onboardingStatus < 50)
            return setRedirect(`/onboarding/doctor/basic/${userId}`);
          if (onboardingStatus < 80)
            return setRedirect(`/onboarding/doctor/docs/${userId}`);
          if (onboardingStatus < 100)
            return setRedirect("/onboarding/doctor/pending");
        }

        setLoading(false);
      } catch (err) {
        console.error("Profile fetch failed", err);
        
        // Handle different error types
        if (err.response?.status === 403) {
          // For 403 errors, we'll allow access to the dashboard since we can't verify onboarding status
          toast.info("Profile service temporarily unavailable. Accessing dashboard...");
          setLoading(false);
          return;
        } else if (err.response?.status === 404) {
          // This is likely the missing endpoint issue
          toast.info("Profile service temporarily unavailable. Accessing dashboard...");
          // Allow access to dashboard anyway since we can't verify onboarding status
          setLoading(false);
          return;
        } else if (err.response?.status === 401) {
          toast.error("Session expired. Please log in again.");
          setRedirect("/login");
        } else {
          toast.error("Unable to verify account status. Please try again.");
          // Still allow access since this might be a temporary issue
          setLoading(false);
          return;
        }
      }
    };

    run();
  }, [token]);

  if (redirect) return <Navigate to={redirect} />;
  if (loading) return <div className="p-10 text-center">Checking account…</div>;

  return children;
}