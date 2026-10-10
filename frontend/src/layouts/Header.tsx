import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Landmark, Menu, X, ShieldCheck, Compass, User, LogOut } from 'lucide-react';
import { useAuth } from '../features/auth/context/AuthContext';
import { NotificationBell } from '../features/notifications/components/NotificationBell';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const hasAdminRole = user && ['ADMIN', 'SCHEME_MANAGER', 'VERIFIER', 'SUPER_ADMIN'].includes(user.role);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Schemes', path: '/schemes' },
    { name: 'Compare', path: '/compare' },
    ...(isAuthenticated
      ? [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Recommendations', path: '/recommendations' },
          { name: 'Saved Schemes', path: '/saved' },
          { name: 'Documents', path: '/documents' },
          { name: 'Notifications', path: '/notifications' },
          { name: 'AI Assistant', path: '/assistant' },
          { name: 'My Profile', path: '/profile' },
        ]
      : []),
    ...(hasAdminRole
      ? [
          { name: 'Scheme Management', path: '/admin/schemes' },
          { name: 'Analytics & Audit', path: '/admin/analytics' },
        ]
      : []),
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Top Government banner strip */}
      <div className="bg-gov-900 text-white text-xs py-1.5 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-medium tracking-wide">
            Public Benefit Discovery Platform &bull; Official Information &amp; Decision Support System
          </span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-slate-300">
          <span>Accessibility: Screen Reader Friendly</span>
          <span className="text-slate-500">|</span>
          <span className="text-amber-400 font-semibold">Standard v1.0</span>
        </div>
      </div>

      {/* Main navigation container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Brand identity */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-gov-700 rounded-md p-1">
          <div className="w-10 h-10 rounded-lg bg-gov-900 text-amber-400 flex items-center justify-center shadow-sm group-hover:bg-gov-800 transition-colors">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-gov-900 leading-tight">
              Smart Scheme &amp; Scholarship Portal
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Verified Public Welfare &amp; Education Benefits
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-gov-900 bg-gov-50 font-semibold'
                    : 'text-slate-600 hover:text-gov-900 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Auth action buttons */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link
                to="/profile"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
              >
                <User className="w-3.5 h-3.5 text-gov-700" />
                <span className="max-w-[140px] truncate">{user.email}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-md border border-red-200 transition-colors"
                title="Sign out of your citizen account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-gov-900 hover:bg-slate-100 rounded-md border border-slate-300 transition-colors"
              >
                Citizen Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gov-900 hover:bg-gov-800 rounded-md transition-colors shadow-sm"
              >
                Register Profile
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger & Bell */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated && user && <NotificationBell />}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-gov-700"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-gov-900"
            >
              <Compass className="w-4 h-4 text-gov-700" />
              {link.name}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-800 bg-slate-100 rounded-md"
                >
                  <User className="w-4 h-4 text-gov-700" />
                  <span>My Profile ({user.email})</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-md border border-red-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2 text-sm font-medium text-gov-900 bg-slate-100 rounded-md"
                >
                  Citizen Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2 text-sm font-medium text-white bg-gov-900 rounded-md"
                >
                  Register Profile
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
