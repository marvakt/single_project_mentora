import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { getProfile } from "../api/user";

export default function OnboardingGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [redirect, setRedirect] = useState(null);

  const token = localStorage.getItem("access");

  useEffect(() => {
    const run = async () => {
      if (!token) return setRedirect("/login");

      let decoded;
      try {
        decoded = jwtDecode(token);
      } catch (err) {
        localStorage.clear();
        return setRedirect("/login");
      }

      const userId = decoded.user_id;

      try {
        const res = await getProfile(userId);
        const profile = res.data;

        const role = profile.role;
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
        setRedirect("/login");
      }
    };

    run();
  }, [token]);

  if (redirect) return <Navigate to={redirect} />;
  if (loading) return <div className="p-10 text-center">Checking account…</div>;

  return children;
}