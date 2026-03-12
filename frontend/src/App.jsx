import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Signup from './pages/Signup';
import AdminDash from './pages/Dashboard/AdminDash';
import SubjectEditor from './pages/Dashboard/SubjectEditor';
import InstructorDash from './pages/Dashboard/InstructorDash';
import StudentDash from './pages/Dashboard/StudentDash';
import SubjectReader from './pages/Reader/SubjectReader';
import QuizTaker from './pages/Assessment/QuizTaker';
import ResultsViewer from './pages/Assessment/ResultsViewer';

import { LogOut, Sun, Moon, Monitor, User as UserIcon, Settings, ChevronDown } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const ThemeToggle = () => {
  // theme: 'light' | 'dark' | 'system'
  const [theme, setTheme] = React.useState('light');

  const applyTheme = (themeValue) => {
    if (themeValue === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', themeValue === 'dark');
    }
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('theme');
    const initial = saved || 'light';
    setTheme(initial);
    applyTheme(initial);
  }, []);

  // Listen for OS theme changes when in system mode
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (theme === 'system') applyTheme('system'); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const cycleTheme = () => {
    const order = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(theme) + 1) % 3];
    setTheme(next);
    localStorage.setItem('theme', next);
    applyTheme(next);
  };

  const icon = theme === 'dark'
    ? <Moon size={20} className="text-indigo-400" />
    : theme === 'light'
      ? <Sun size={20} className="text-amber-400" />
      : <Monitor size={20} className="text-emerald-400" />;

  const label = theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light';

  return (
    <button onClick={cycleTheme} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 transition-colors" title={`Theme: ${label} (click to change)`}>
      {icon}
    </button>
  );
};

// New Layout Component for Dashboards (Matches User Image)
const DashboardLayout = ({ defaultView = 'dashboard', renderContent }) => {
  const [activeView, setActiveView] = useState(defaultView);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false); // New mobile menu state
  const { user, logout } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const isStudent = user.role === 'STUDENT';
  const isAdmin = user.role === 'ADMIN';

  const navItems = isAdmin
    ? [
      { id: 'overview', label: 'Overview' },
      { id: 'all-users', label: 'All Users' },
      { id: 'students', label: 'Students' },
      { id: 'instructors', label: 'Instructors' },
      { id: 'rankings', label: 'Rankings' },
      { id: 'statistics', label: 'Statistics' },
      { id: 'activity', label: 'Activity Logs' }
    ]
    : [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'courses', label: 'My Courses' },
      { id: 'tests', label: 'Assessments' },
      { id: 'progress', label: 'Analytics' }
    ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="p-8 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-xl font-bold text-white leading-none">L</span>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">LMS</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveView(item.id);
              setShowMobileMenu(false);
            }}
            className={`flex w-full items-center px-5 py-3.5 text-[15px] font-bold rounded-2xl transition-all duration-300 ${activeView === item.id ? 'bg-black text-white shadow-xl shadow-black/10 translate-x-1' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'}`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 w-full overflow-hidden font-sans transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="w-[280px] hidden lg:flex flex-col h-full border-r border-slate-100 dark:border-slate-800">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-[240px] bg-slate-50 dark:bg-slate-900 shadow-2xl animate-fade-in-left">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto bg-white dark:bg-slate-900 lg:rounded-l-[3rem] lg:shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.05)] lg:border-l border-slate-100 dark:border-slate-800 transition-colors duration-300 relative">
        {/* Top Header */}
        <header className="h-20 lg:h-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 lg:px-10 w-full transition-all border-b border-slate-50 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            >
              <ChevronDown size={20} className="rotate-90" />
            </button>

            <div className="flex flex-col">
              <span className="text-xs font-black text-indigo-500 lg:hidden uppercase tracking-widest">LMS</span>
              <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                {isAdmin ? (
                  <span className="text-slate-400 hidden sm:inline">LMS Admin <span className="text-slate-300 dark:text-slate-600 mx-1">/</span> Sprint 1</span>
                ) : (
                  <h1 className="text-lg lg:text-xl font-bold text-slate-800 dark:text-white capitalize tracking-tight">
                    {navItems.find(n => n.id === activeView)?.label || 'Dashboard'}
                  </h1>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <ThemeToggle />

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 lg:gap-3 p-1 rounded-full lg:pr-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 hidden sm:inline">{user.name}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)}></div>
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-20 animate-fade-in-up origin-top-right">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                      <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                      <p className="text-xs font-medium text-slate-500 truncate">{user.email}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1.5 bg-indigo-50 inline-block px-2 py-0.5 rounded-md">ID: {user.userId || 'N/A'}</p>
                    </div>

                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => { setActiveView('profile'); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors"
                      >
                        <UserIcon size={16} />
                        My Profile
                      </button>

                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8 w-full max-w-7xl mx-auto">
          {renderContent(activeView)}
        </div>
      </main>
    </div>
  );
};

const DashboardRouter = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <DashboardLayout defaultView="overview" renderContent={(view) => <AdminDash currentView={view} />} />;
  if (user.role === 'INSTRUCTOR') return <DashboardLayout defaultView="dashboard" renderContent={(view) => <InstructorDash currentView={view} />} />;
  return <DashboardLayout defaultView="courses" renderContent={(view) => <StudentDash currentView={view} />} />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();

  const isAuthRoute = ['/login', '/signup', '/register'].includes(location.pathname);

  const isDashboardRoute = location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/reader') ||
    location.pathname.startsWith('/quiz') ||
    location.pathname.startsWith('/results') ||
    location.pathname.startsWith('/admin-dashboard') ||
    location.pathname.startsWith('/instructor-dashboard') ||
    location.pathname.startsWith('/instructor');

  const hideNav = isDashboardRoute || isAuthRoute;

  return (
    <div className="min-h-screen flex flex-col font-sans" style={isAuthRoute ? {} : { background: '#0f1117' }}>
      {!hideNav && (
        <header className="border-b border-white/5 sticky top-0 z-10 transition-colors duration-300 backdrop-blur-xl" style={{ background: 'rgba(15,17,23,0.85)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold leading-none">
                L
              </div>
              <span className="text-xl font-black text-white tracking-tight">LMS</span>
            </div>
            <nav className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm font-medium text-white/60 hidden sm:inline-block">
                    Welcome, <span className="text-indigo-400 font-bold">{user.name}</span>
                  </span>
                  <a href="/dashboard" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Dashboard</a>
                  <button onClick={() => { localStorage.removeItem('userInfo'); window.location.href = '/'; }} className="text-sm font-black border border-white/20 text-white/70 hover:text-white hover:border-white/40 px-4 py-2 rounded-xl transition-all">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Login</a>
                  <a href="/signup" className="text-sm font-black bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl transition-all">Get Started</a>
                </>
              )}
            </nav>
          </div>
        </header>
      )}

      <main className={`flex-grow flex flex-col items-center justify-center w-full relative overflow-hidden transition-colors duration-300 ${isAuthRoute ? '' : 'dark:bg-slate-900'}`}>
        {/* Background elements */}
        <div className="absolute inset-0 bg-grid-pattern dark:opacity-10 pointer-events-none opacity-40"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl pointer-events-none mix-blend-multiply flex-shrink-0"></div>
        <div className="absolute top-40 -left-20 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none mix-blend-multiply flex-shrink-0"></div>

        <Routes>
          <Route path="/" element={
            <div className="w-full min-h-[calc(100vh-64px)] overflow-hidden flex flex-col items-center justify-center px-6 relative z-10">

              {/* Full-width Cinematic Background Image */}
              <div className="absolute inset-0 z-0">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2850"
                  alt="Students collaborating"
                  className="w-full h-full object-cover"
                />
                {/* Deep dark overlay to ensure text readability */}
                <div className="absolute inset-0 bg-[#0a0f18]/85 backdrop-blur-[2px]"></div>

                {/* Glowing subtle gradients to blend the image */}
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-[#0f1117] to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[#0f1117] to-transparent"></div>
              </div>

              {/* Glowing orbs for extra depth over the background */}
              <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-30 blur-[100px] pointer-events-none z-0"
                style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-20 blur-[100px] pointer-events-none z-0"
                style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }}></div>

              <div className="relative z-10 flex flex-col items-center text-center w-full max-w-5xl mx-auto -mt-16">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-indigo-500/40 mb-6 sm:mb-8 backdrop-blur-md"
                  style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-indigo-200">Next-Generation LMS</span>
                </div>

                {/* Headline */}
                <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tighter mb-6">
                  <span className="text-white drop-shadow-xl">The smarter way to</span><br />
                  <span style={{
                    background: 'linear-gradient(135deg, #a5b4fc, #67e8f9, #d8b4fe)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 30px rgba(165,180,252,0.3))'
                  }}>
                    learn & teach.
                  </span>
                </h1>

                <p className="text-base sm:text-xl text-indigo-100/70 font-medium max-w-2xl mb-12. leading-relaxed">
                  A beautifully crafted platform for colleges — interactive content readers, adaptive quizzes, real-time analytics, and AI-powered assistance.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-6 sm:px-0">
                  <a href="/login"
                    className="w-full sm:w-auto text-center px-8 py-4 rounded-2xl font-black text-white text-lg transition-all hover:opacity-100 opacity-90 hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #9333ea)', boxShadow: '0 20px 40px -10px rgba(79,70,229,0.5)' }}>
                    Enter Classroom →
                  </a>
                  <a href="/signup"
                    className="w-full sm:w-auto text-center px-8 py-4 rounded-2xl font-black text-white text-lg border border-white/20 hover:bg-white/10 hover:border-white/40 transition-all backdrop-blur-sm"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    Create Free Account
                  </a>
                </div>
              </div>
            </div>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
          <Route path="/instructor/subject/:id" element={<ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}><SubjectEditor /></ProtectedRoute>} />
          <Route path="/reader/:id" element={<ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'INSTRUCTOR']}><SubjectReader /></ProtectedRoute>} />
          <Route path="/quiz/:subjectId" element={<ProtectedRoute allowedRoles={['STUDENT']}><QuizTaker /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute allowedRoles={['STUDENT']}><ResultsViewer /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
