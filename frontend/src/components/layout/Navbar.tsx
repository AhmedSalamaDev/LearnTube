import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { SearchCourseModal } from '../dashboard/SearchCourseModal';

// Navigation bar component
export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const links = [
    { path: '/dashboard', label: 'Dashboard', icon: 'space_dashboard' },
    { path: '/analytics', label: 'Analytics', icon: 'analytics' },
    { path: '/profile', label: 'Profile', icon: 'person' },
  ];

  useEffect(() => {
    const closeMenuOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', closeMenuOnOutsideClick);
    return () =>
      document.removeEventListener('mousedown', closeMenuOnOutsideClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--lt-border)] bg-[rgba(23,27,38,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1520px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="flex shrink-0 items-center gap-2">
          <span className="material-symbols-outlined text-[25px] text-[var(--lt-primary)]">
            school
          </span>
          <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold tracking-tight">
            Learn<span className="text-[var(--lt-primary)]">Tube</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => {
            const active =
              location.pathname === link.path ||
              (link.path === '/profile' &&
                location.pathname.startsWith('/profile/'));
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? 'bg-[var(--lt-surface-high)] text-[var(--lt-primary)]' : 'text-[var(--lt-muted)] hover:bg-[var(--lt-surface-high)] hover:text-[var(--lt-text)]'}`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="hidden w-56 items-center gap-2 rounded-lg border border-[var(--lt-border)] bg-[var(--lt-surface)] px-3 py-2 text-left text-xs text-[var(--lt-muted)] hover:border-[var(--lt-primary)] sm:flex"
          >
            <span className="material-symbols-outlined text-[18px]">
              search
            </span>
            Search your courses
          </button>
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--lt-muted)] hover:bg-[var(--lt-surface-high)] hover:text-[var(--lt-text)] sm:hidden"
            aria-label="Search YouTube"
          >
            <span className="material-symbols-outlined">search</span>
          </button>
          <div
            ref={menuRef}
            className="relative border-l border-[var(--lt-border)] pl-3"
          >
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full p-1 hover:bg-[var(--lt-surface-high)]"
              aria-expanded={isMenuOpen}
              aria-label="Open account menu"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--lt-primary)] text-sm font-bold text-[#171b26]">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="material-symbols-outlined hidden text-[18px] text-[var(--lt-muted)] sm:inline">
                expand_more
              </span>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-[var(--lt-border)] bg-[var(--lt-surface-high)] p-2 shadow-2xl">
                <div className="border-b border-[var(--lt-border)] px-3 py-2">
                  <p className="font-semibold text-[var(--lt-text)]">
                    {user?.name}
                  </p>
                  <p className="truncate text-xs text-[var(--lt-muted)]">
                    {user?.email}
                  </p>
                </div>
                {links.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--lt-muted)] hover:bg-[var(--lt-surface)] hover:text-[var(--lt-text)]"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                  className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[var(--lt-rose)] hover:bg-[var(--lt-surface)]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    logout
                  </span>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <SearchCourseModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSuccess={() => setIsSearchOpen(false)}
      />
    </header>
  );
};
