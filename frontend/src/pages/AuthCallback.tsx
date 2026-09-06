import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      const token = searchParams.get("token");
      console.log(
        "AuthCallback - Token from URL:",
        token ? token.substring(0, 20) + "..." : "NONE"
      );

      if (token) {
        // 1. Store token
        localStorage.setItem("auth_token", token);
        console.log("AuthCallback - Token saved to localStorage");

        // 2. Small delay to ensure storage is complete
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 3. Update auth context
        const success = await checkAuth();
        console.log("AuthCallback - Auth check result:", success);

        // 4. Navigate based on result
        if (success) {
          console.log("AuthCallback - Navigating to dashboard");
          navigate("/dashboard", { replace: true });
        } else {
          console.log("AuthCallback - Auth failed, going to login");
          navigate("/login", { replace: true });
        }
      } else {
        console.log("AuthCallback - No token found");
        navigate("/login", { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Authenticating...</p>
    </div>
  );
};
