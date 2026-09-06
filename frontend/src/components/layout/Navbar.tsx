import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

// Navigation bar component
export const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">LearnTube</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/profile"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Profile
            </Link>

            {/* User Info */}
            <div className="flex items-center gap-3 ml-6 pl-6 border-l border-gray-200">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-gray-700 font-medium">{user?.name}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
