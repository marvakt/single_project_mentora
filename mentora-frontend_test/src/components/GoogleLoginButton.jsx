import { useEffect } from "react";
import api from "../api/axios";

export default function GoogleLoginButton() {
  function handleCredentialResponse(response) {
    const id_token = response.credential;

    api.post("/api/accounts/google/", { id_token })
      .then(res => {
        const { access, refresh, role } = res.data;
        sessionStorage.setItem("access", access);
        sessionStorage.setItem("refresh", refresh);
        sessionStorage.setItem("role", role);

        window.location.href = `/dashboard/${role}`;
      })
      .catch(() => alert("Google login failed"));
  }

  useEffect(() => {
    /* global google */
    google.accounts.id.initialize({
      client_id: "YOUR_GOOGLE_CLIENT_ID",
      callback: handleCredentialResponse,
    });

    google.accounts.id.renderButton(
      document.getElementById("googleBtn"),
      { theme: "filled_blue", size: "large" }
    );
  }, []);

  return <div id="googleBtn"></div>;
}
