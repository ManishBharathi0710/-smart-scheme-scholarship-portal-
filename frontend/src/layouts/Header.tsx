import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Landmark,
  Menu,
  X,
  ShieldCheck,
  Compass,
  User,
  LogOut,
  ChevronDown,
  Bookmark,
  FileText,
  Sparkles,
  LayoutDashboard,
  GitCompare,
  Search,
  Bell,
  Settings,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../features/auth/context/AuthContext';
import { NotificationBell } from '../features/notifications/components/NotificationBell';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const servicesRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (servicesRef.current && !servicesRef.current.contains(target)) {
        setServicesDropdownOpen(false);
      }
      if (adminRef.current && !adminRef.current.contains(target)) {
        setAdminDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(target)) {
        setUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setServicesDropdownOpen(false);
        setAdminDropdownOpen(false);
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close mobile drawer and dropdowns on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setServicesDropdownOpen(false);
    setAdminDropdownOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const hasAdminRole =
    user && ['ADMIN', 'SCHEME_MANAGER', 'VERIFIER', 'SUPER_ADMIN'].includes(user.role);

  // User initials for avatar
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  const isLinkActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-sm/50">
      {/* Top Government banner strip */}
      <div className="bg-gov-900 text-white text-[11px] py-1 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b border-gov-800">
        <div className="flex items-center gap-2 truncate">
          <ShieldCheck className="w-3.5 h-3.5 text-violet-300 shrink-0" />
          <span className="font-medium tracking-wide truncate">
            Public Benefit Discovery Platform &bull; Official Information &amp; Decision Support System
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-slate-300 text-[11px] shrink-0 pl-2">
          <span>Screen Reader Friendly</span>
          <span className="text-slate-600">|</span>
          <span className="text-violet-300 font-semibold">Standard v1.0</span>
        </div>
      </div>

      {/* Main navigation container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Identity */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-gov-700 rounded-lg p-1 shrink-0"
            title="Smart Scheme & Scholarship Portal"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:from-indigo-500 group-hover:to-violet-600 transition-all shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold text-gov-900 leading-tight tracking-tight">
                Smart Scheme Portal
              </span>
              <span className="text-[11px] text-slate-500 font-medium leading-tight hidden xs:block">
                National Welfare &amp; Scholarships
              </span>
            </div>
          </Link>

          {/* Desktop Navigation (>= 1024px) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5" aria-label="Main Navigation">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isLinkActive('/')
                  ? 'text-gov-900 bg-gov-50 font-semibold'
                  : 'text-slate-600 hover:text-gov-900 hover:bg-slate-50'
              }`}
            >
              Home
            </Link>

            <Link
              to="/schemes"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isLinkActive('/schemes')
                  ? 'text-gov-900 bg-gov-50 font-semibold'
                  : 'text-slate-600 hover:text-gov-900 hover:bg-slate-50'
              }`}
            >
              Schemes
            </Link>

            <Link
              to="/compare"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isLinkActive('/compare')
                  ? 'text-gov-900 bg-gov-50 font-semibold'
                  : 'text-slate-600 hover:text-gov-900 hover:bg-slate-50'
              }`}
            >
              Compare
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/recommendations"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isLinkActive('/recommendations')
                      ? 'text-gov-900 bg-gov-50 font-semibold'
                      : 'text-slate-600 hover:text-gov-900 hover:bg-slate-50'
                  }`}
                >
                  Recommendations
                </Link>

                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isLinkActive('/dashboard')
                      ? 'text-gov-900 bg-gov-50 font-semibold'
                      : 'text-slate-600 hover:text-gov-900 hover:bg-slate-50'
                  }`}
                >
                  Dashboard
                </Link>

                {/* Citizen Services Dropdown */}
                <div className="relative" ref={servicesRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setServicesDropdownOpen(!servicesDropdownOpen);
                      setAdminDropdownOpen(false);
                      setUserDropdownOpen(false);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      servicesDropdownOpen ||
                      ['/saved', '/documents', '/assistant', '/notifications'].some((p) =>
                        location.pathname.startsWith(p)
                      )
                        ? 'text-gov-900 bg-gov-50 font-semibold'
                        : 'text-slate-600 hover:text-gov-900 hover:bg-slate-50'
                    }`}
                    aria-expanded={servicesDropdownOpen}
                    aria-haspopup="true"
                  >
                    <span>Citizen Tools</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        servicesDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {servicesDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-slate-200/90 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      <Link
                        to="/saved"
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-gov-50 hover:text-gov-900 transition-colors"
                      >
                        <Bookmark className="w-4 h-4 text-gov-700" />
                        <span>Saved Schemes</span>
                      </Link>
                      <Link
                        to="/documents"
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-gov-50 hover:text-gov-900 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-gov-700" />
                        <span>My Documents</span>
                      </Link>
                      <Link
                        to="/assistant"
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-gov-50 hover:text-gov-900 transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-violet-500" />
                        <span>AI Assistant</span>
                      </Link>
                      <Link
                        to="/notifications"
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-gov-50 hover:text-gov-900 transition-colors"
                      >
                        <Bell className="w-4 h-4 text-gov-700" />
                        <span>Notifications</span>
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Admin Hub Dropdown */}
            {hasAdminRole && (
              <div className="relative" ref={adminRef}>
                <button
                  type="button"
                  onClick={() => {
                    setAdminDropdownOpen(!adminDropdownOpen);
                    setServicesDropdownOpen(false);
                    setUserDropdownOpen(false);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    adminDropdownOpen || location.pathname.startsWith('/admin')
                      ? 'text-gov-900 bg-gov-50 font-semibold'
                      : 'text-slate-600 hover:text-gov-900 hover:bg-slate-50'
                  }`}
                  aria-expanded={adminDropdownOpen}
                  aria-haspopup="true"
                >
                  <Shield className="w-3.5 h-3.5 text-gov-700" />
                  <span>Admin Hub</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      adminDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {adminDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200/90 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Management &amp; Controls
                    </div>
                    <Link
                      to="/admin/schemes"
                      className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-gov-50 hover:text-gov-900 transition-colors"
                    >
                      <Layers className="w-4 h-4 text-gov-700" />
                      <span>Scheme Management</span>
                    </Link>
                    <Link
                      to="/admin/analytics"
                      className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-gov-50 hover:text-gov-900 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gov-700" />
                      <span>Analytics &amp; Audit Logs</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Desktop Right Action Area */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5">
                <NotificationBell />

                {/* User Dropdown Pill */}
                <div className="relative" ref={userRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(!userDropdownOpen);
                      setServicesDropdownOpen(false);
                      setAdminDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full text-xs font-medium text-slate-700 bg-slate-100/90 hover:bg-slate-200/80 transition-colors border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-gov-700"
                    aria-expanded={userDropdownOpen}
                    aria-haspopup="true"
                    aria-label="User Account Menu"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                      {userInitial}
                    </div>
                    <span className="max-w-[120px] xl:max-w-[150px] truncate font-semibold text-slate-800">
                      {user.email}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                        userDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      {/* Account header preview */}
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                          {userInitial}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-slate-900 truncate">
                            {user.email}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-gov-700 bg-gov-50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                            {user.role}
                          </span>
                        </div>
                      </div>

                      {/* Menu links */}
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-gov-50 hover:text-gov-900 transition-colors"
                        >
                          <User className="w-4 h-4 text-gov-700" />
                          <span>My Profile</span>
                        </Link>
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-gov-50 hover:text-gov-900 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-gov-700" />
                          <span>Citizen Dashboard</span>
                        </Link>
                        <Link
                          to="/saved"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-gov-50 hover:text-gov-900 transition-colors"
                        >
                          <Bookmark className="w-4 h-4 text-gov-700" />
                          <span>Saved Schemes</span>
                        </Link>
                        <Link
                          to="/documents"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-gov-50 hover:text-gov-900 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-gov-700" />
                          <span>Uploaded Documents</span>
                        </Link>
                        <Link
                          to="/assistant"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-gov-50 hover:text-gov-900 transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-violet-500" />
                          <span>AI Assistant</span>
                        </Link>
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
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
              </div>
            )}
          </div>

          {/* Mobile Right Controls (< 1024px) */}
          <div className="flex lg:hidden items-center gap-2">
            {isAuthenticated && user && <NotificationBell />}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:text-gov-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-gov-700 transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer (< 1024px) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white shadow-xl animate-in fade-in duration-150">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {/* User Profile Banner on Mobile */}
            {isAuthenticated && user && (
              <div className="p-3 bg-gov-50/80 rounded-xl border border-gov-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                    {userInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{user.email}</p>
                    <span className="text-[10px] uppercase font-bold text-gov-700 bg-gov-100/80 px-1.5 py-0.2 rounded">
                      {user.role}
                    </span>
                  </div>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-semibold text-gov-800 hover:underline shrink-0 pl-2"
                >
                  Edit Profile
                </Link>
              </div>
            )}

            {/* Discovery Links */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Discovery &amp; Guidance
              </div>
              <div className="space-y-1">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                    isLinkActive('/')
                      ? 'bg-gov-100/70 text-gov-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Compass className="w-4 h-4 text-gov-700" />
                  <span>Home Portal</span>
                </Link>
                <Link
                  to="/schemes"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                    isLinkActive('/schemes')
                      ? 'bg-gov-100/70 text-gov-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Search className="w-4 h-4 text-gov-700" />
                  <span>Browse All Schemes</span>
                </Link>
                <Link
                  to="/compare"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                    isLinkActive('/compare')
                      ? 'bg-gov-100/70 text-gov-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <GitCompare className="w-4 h-4 text-gov-700" />
                  <span>Scheme Comparison</span>
                </Link>
              </div>
            </div>

            {/* Citizen Services (Authenticated) */}
            {isAuthenticated && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                  Citizen Services
                </div>
                <div className="space-y-1">
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                      isLinkActive('/dashboard')
                        ? 'bg-gov-100/70 text-gov-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-gov-700" />
                    <span>Citizen Dashboard</span>
                  </Link>
                  <Link
                    to="/recommendations"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                      isLinkActive('/recommendations')
                        ? 'bg-gov-100/70 text-gov-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Personalized Recommendations</span>
                  </Link>
                  <Link
                    to="/saved"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                      isLinkActive('/saved')
                        ? 'bg-gov-100/70 text-gov-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Bookmark className="w-4 h-4 text-gov-700" />
                    <span>Saved Schemes &amp; Bookmarks</span>
                  </Link>
                  <Link
                    to="/documents"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                      isLinkActive('/documents')
                        ? 'bg-gov-100/70 text-gov-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-gov-700" />
                    <span>Document Vault &amp; OCR</span>
                  </Link>
                  <Link
                    to="/assistant"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                      isLinkActive('/assistant')
                        ? 'bg-gov-100/70 text-gov-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    <span>AI Guidance Assistant</span>
                  </Link>
                  <Link
                    to="/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                      isLinkActive('/notifications')
                        ? 'bg-gov-100/70 text-gov-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Bell className="w-4 h-4 text-gov-700" />
                    <span>Notifications &amp; Reminders</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Admin Controls */}
            {hasAdminRole && (
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                  Administration
                </div>
                <div className="space-y-1">
                  <Link
                    to="/admin/schemes"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Layers className="w-4 h-4 text-gov-700" />
                    <span>Scheme Management</span>
                  </Link>
                  <Link
                    to="/admin/analytics"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="w-4 h-4 text-gov-700" />
                    <span>Analytics &amp; Audit Logs</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Auth Actions on Mobile */}
            <div className="pt-3 border-t border-slate-200">
              {isAuthenticated && user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Sign Out of Citizen Account</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center px-4 py-2.5 text-sm font-semibold text-gov-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                  >
                    Citizen Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center px-4 py-2.5 text-sm font-semibold text-white bg-gov-900 hover:bg-gov-800 rounded-lg transition-colors shadow-sm"
                  >
                    Register Profile
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
