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

import { LogOut, Sun, Moon, Monitor } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const ThemeToggle = () => {
  // theme: 'light' | 'dark' | 'system'
  const [theme, setTheme] = React.useState('system');

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
    const initial = saved || 'system';
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
  const { user, logout } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const isStudent = user.role === 'STUDENT';
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 w-full overflow-hidden font-sans transition-colors duration-300">
      {/* Sidebar Navigation */}
      <aside className="w-[280px] bg-slate-50 dark:bg-slate-900 flex flex-col hidden md:flex h-full transition-colors duration-300">
        <div className="p-8 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-xl font-bold text-white leading-none">L</span>
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">LMS</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-3">
          {/* Admin Links */}
          {isAdmin && (
            <>
              {['overview', 'all-users', 'students', 'instructors', 'rankings', 'statistics'].map((view) => {
                const labels = { 'overview': 'Overview', 'all-users': 'All Users', 'students': 'Students', 'instructors': 'Instructors', 'rankings': 'Rankings', 'statistics': 'Statistics' };
                return (
                  <button
                    key={view}
                    onClick={() => setActiveView(view)}
                    className={`flex w-full items-center px-5 py-3.5 text-[15px] font-bold rounded-2xl transition-all duration-300 ${activeView === view ? 'bg-black text-white shadow-xl shadow-black/10 translate-x-1' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    {labels[view]}
                  </button>
                );
              })}
            </>
          )}

          {/* Student/Instructor Links */}
          {!isAdmin && (
            <>
              <button
                onClick={() => setActiveView('dashboard')}
                className={`flex w-full items-center px-5 py-3.5 text-[15px] font-bold rounded-2xl transition-all duration-300 ${activeView === 'dashboard' ? 'bg-black text-white shadow-xl shadow-black/10 translate-x-1' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveView('courses')}
                className={`flex w-full items-center px-5 py-3.5 text-[15px] font-bold rounded-2xl transition-all duration-300 ${activeView === 'courses' ? 'bg-black text-white shadow-xl shadow-black/10 translate-x-1' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'}`}
              >
                My Courses
              </button>
              <button
                onClick={() => setActiveView('tests')}
                className={`flex w-full items-center px-5 py-3.5 text-[15px] font-bold rounded-2xl transition-all duration-300 ${activeView === 'tests' ? 'bg-black text-white shadow-xl shadow-black/10 translate-x-1' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Assessments
              </button>
              <button
                onClick={() => setActiveView('progress')}
                className={`flex w-full items-center px-5 py-3.5 text-[15px] font-bold rounded-2xl transition-all duration-300 ${activeView === 'progress' ? 'bg-black text-white shadow-xl shadow-black/10 translate-x-1' : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'}`}
              >
                Analytics
              </button>
            </>
          )}
        </nav>

        <div className="p-6 mt-auto">
          <button
            onClick={() => { localStorage.removeItem('userInfo'); window.location.href = '/'; }}
            className="flex items-center justify-center gap-2 px-6 py-4 w-full text-sm font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-black dark:hover:text-white rounded-2xl transition-all shadow-sm border border-slate-200/50 dark:border-slate-700"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto bg-white dark:bg-slate-900 rounded-l-[3rem] shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.05)] border-l border-slate-100 dark:border-slate-800 transition-colors duration-300">
        {/* Top Header */}
        <header className="h-24 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-10 w-full transition-all border-b border-transparent dark:border-slate-800">
          <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
            <span className="md:hidden font-bold text-indigo-500 mr-2">LMS</span>
            {isAdmin ? (
              <span className="text-slate-400">LMS Admin <span className="text-slate-300 dark:text-slate-600 mx-1">/</span> Sprint 1</span>
            ) : (
              <h1 className="text-xl font-bold text-slate-800 dark:text-white capitalize tracking-tight">
                {activeView === 'dashboard' ? (user.role === 'INSTRUCTOR' ? 'Instructor Dashboard' : 'Dashboard') : activeView === 'courses' ? 'My Courses' : activeView === 'tests' ? 'Assessments' : activeView === 'progress' ? 'Analytics' : 'Dashboard'}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isAdmin ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold border border-orange-200">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Welcome, <span className="text-primary-700 dark:text-primary-400 font-bold">{user.name}</span>
                </span>
                <button onClick={() => { localStorage.removeItem('userInfo'); window.location.href = '/'; }} className="btn-secondary text-sm px-4 py-1.5 shadow-none rounded">
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 w-full max-w-7xl mx-auto">
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
    location.pathname.startsWith('/instructor-dashboard');

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
