import React, { useState, useRef, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { 
  Video, 
  Calendar, 
  History, 
  Sun, 
  Moon, 
  LogOut, 
  User as UserIcon, 
  Menu, 
  X, 
  Keyboard, 
  Plus, 
  LayoutDashboard
} from 'lucide-react';
import { formatMeetingCode } from '../../lib/utils';

export const Navbar: React.FC = () => {
  const { currentRoute, navigate } = useNavigation();
  const { user, isAuthenticated, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { info, error } = useToast();

  const [quickCode, setQuickCode] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickCode.trim().replace(/[^a-zA-Z0-9-]/g, '');
    if (!clean || clean.length < 5) {
      error('Invalid Meeting Code', 'Please enter a valid 9-10 character meeting code.');
      return;
    }
    const formatted = formatMeetingCode(clean);
    navigate('room-preview', formatted);
    setQuickCode('');
  };

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'scheduled-meetings', label: 'Schedule', icon: <Calendar className="w-4 h-4" /> },
    { id: 'meeting-history', label: 'History', icon: <History className="w-4 h-4" /> },
  ] as const;

  return (
    <header 
      id="main-navbar" 
      className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <button
            id="brand-logo-btn"
            onClick={() => navigate(isAuthenticated ? 'dashboard' : 'landing')}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
            aria-label="MeetSpace Home"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-700 transition-colors">
              <Video className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                MeetSpace
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                  Pro
                </span>
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
              {navLinks.map(link => {
                const isActive = currentRoute === link.id;
                return (
                  <button
                    key={link.id}
                    id={`nav-link-${link.id}`}
                    onClick={() => navigate(link.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Center Quick Join Form */}
        <div className="hidden lg:flex items-center flex-1 max-w-xs mx-4">
          <form onSubmit={handleQuickJoin} className="relative w-full">
            <Keyboard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="quick-join-input"
              type="text"
              placeholder="Enter meeting code..."
              value={quickCode}
              onChange={e => setQuickCode(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800/90 text-xs sm:text-sm pl-9 pr-14 py-2 rounded-xl border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none transition-all"
            />
            {quickCode.trim() && (
              <button
                type="submit"
                id="quick-join-submit-btn"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
              >
                Join
              </button>
            )}
          </form>
        </div>

        {/* Right Action Icons & Auth Profile */}
        <div className="flex items-center gap-2.5">
          {/* Dark / Light Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Button
                id="navbar-new-meeting-btn"
                variant="primary"
                size="sm"
                className="hidden sm:inline-flex"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => navigate('dashboard')}
              >
                New Meeting
              </Button>

              {/* User Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  id="profile-dropdown-trigger"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-500/30 transition-all cursor-pointer focus:outline-none"
                  aria-expanded={isProfileOpen}
                  aria-label="User menu"
                >
                  <Avatar
                    src={user?.avatarUrl}
                    name={user?.displayName || 'User'}
                    size="sm"
                    status="online"
                  />
                </button>

                {isProfileOpen && (
                  <div 
                    id="profile-dropdown-menu"
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {user?.displayName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {user?.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        id="dropdown-profile-link"
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('profile-settings');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        Profile & Device Settings
                      </button>
                      <button
                        id="dropdown-scheduled-link"
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('scheduled-meetings');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <Calendar className="w-4 h-4 text-slate-400" />
                        My Schedule
                      </button>
                    </div>

                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        id="dropdown-logout-btn"
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                          info('Signed Out', 'You have been successfully signed out.');
                          navigate('landing');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs sm:text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                id="nav-login-btn"
                variant="ghost"
                size="sm"
                onClick={() => navigate('login')}
              >
                Sign In
              </Button>
              <Button
                id="nav-register-btn"
                variant="primary"
                size="sm"
                onClick={() => navigate('register')}
              >
                Get Started
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            id="mobile-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div 
          id="mobile-drawer"
          className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-3"
        >
          {/* Mobile Quick Join */}
          <form onSubmit={handleQuickJoin} className="relative w-full">
            <Keyboard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Enter meeting code..."
              value={quickCode}
              onChange={e => setQuickCode(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 text-sm pl-9 pr-14 py-2.5 rounded-xl border border-transparent text-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg"
            >
              Join
            </button>
          </form>

          {isAuthenticated ? (
            <div className="space-y-1 pt-2">
              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate(link.id);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    currentRoute === link.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('profile-settings');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                <UserIcon className="w-4 h-4" />
                Profile & Settings
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <Button
                id="mobile-nav-register-btn"
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('register');
                }}
              >
                Create Account
              </Button>
              <Button
                id="mobile-nav-login-btn"
                variant="outline"
                size="md"
                className="w-full"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('login');
                }}
              >
                Sign In
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
