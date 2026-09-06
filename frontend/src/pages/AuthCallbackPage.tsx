import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Spinner } from "../components/ui/Spinner";

export const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");

      if (!token) {
        console.error("[AuthCallback] No token found in URL");
        navigate("/login");
        return;
      }

      console.log(
        "[AuthCallback] Token received:",
        token.substring(0, 20) + "..."
      );

      // Store the token in localStorage
      localStorage.setItem("auth_token", token);
      console.log("[AuthCallback] Token stored in localStorage");

      // Wait a bit for everything to settle
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Check if we're authenticated now
      console.log("[AuthCallback] Checking authentication...");
      await checkAuth();

      // Redirect to dashboard
      console.log("[AuthCallback] Redirecting to dashboard...");
      navigate("/", { replace: true });
    };

    handleCallback();
  }, [searchParams, navigate, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spinner />
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};
