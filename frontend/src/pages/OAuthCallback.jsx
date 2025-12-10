import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const processedRef = useRef(false); // prevents double-processing (StrictMode/dev reloads)

  useEffect(() => {
    if (processedRef.current) return; // already handled
    processedRef.current = true;

    const rawHash = window.location.hash || "";
    const cleanHash = rawHash.replace(/^#/, ""); // remove leading '#'
    const hashParams = new URLSearchParams(cleanHash);

    const queryParams = new URLSearchParams(window.location.search);

    const token =
      hashParams.get("token") || queryParams.get("token") || null;
    const email =
      hashParams.get("email") || queryParams.get("email") || null;
    const role =
      hashParams.get("role") || queryParams.get("role") || null;

    console.log("OAuth callback parsed:", token ? "token present" : "no token", email, role);

    if (!token || !role) {
        // Nothing to do — go back to login (or show error)
      navigate("/login");
      return;
    }

   // Save as your normal login flow does
    try {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify({ email, role }));
      // optionally set global auth header for axios/fetch here
      // axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (err) {
      console.error("Failed to save OAuth token to localStorage", err);
    }

    // Remove token from URL so re-loads/mounts don't see it again
    // We replace the current history entry with same path but no hash/search
    const cleanUrl =
      window.location.origin + window.location.pathname + window.location.search;
    window.history.replaceState({}, document.title, cleanUrl);

    // Navigate to role-based dashboard
    if (role === "teacher") navigate("/dashboard");
    else navigate("/student-dashboard");
  }, [navigate]);

  return <div>Signing you in…</div>;
}
