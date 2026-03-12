import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const COLLAGE = [
    { src: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80', tall: true },  // lecture hall ✅
    { src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80', tall: false }, // students at board ✅
    { src: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=600&q=80', tall: false }, // person studying ✅
    { src: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80', tall: true },  // open books ✅
    { src: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&q=80', tall: false }, // laptop studying ✅
    { src: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=600&q=80', tall: false }, // student at desk ✅
];

const DEMO_USERS = [
    { label: '🎓 Student', email: 'student@lms.com', color: 'from-indigo-500 to-violet-600' },
    { label: '👨‍🏫 Instructor', email: 'instructor@lms.com', color: 'from-emerald-500 to-teal-600' },
    { label: '⚙️ Admin', email: 'admin@lms.com', color: 'from-amber-500 to-orange-600' },
];

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [stats, setStats] = useState({ students: '...', subjects: '...', quizzes: '...' });

    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/stats')
            .then(res => setStats(res.data))
            .catch(() => { });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const result = await login(email, password);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
        setIsLoading(false);
    };

    const fillDemo = (demoEmail) => {
        setEmail(demoEmail);
        setPassword('password123');
    };

    return (
        <div className="min-h-screen flex overflow-hidden" style={{ background: '#0a0a0f' }}>

            {/* ── LEFT: Pinterest Masonry Collage ── */}
            <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden">
                <div className="w-full h-full columns-3 gap-2 p-2 overflow-hidden">
                    {COLLAGE.map((img, i) => (
                        <div key={i} className={`mb-2 break-inside-avoid rounded-2xl overflow-hidden ${img.tall ? 'h-72' : 'h-44'}`}
                            style={{ animation: `fadeIn ${0.3 + i * 0.1}s ease both` }}>
                            <img src={img.src} alt="Learning" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                        </div>
                    ))}
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0a0a0f]"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/60 via-transparent to-transparent"></div>

                {/* Branding */}
                <div className="absolute inset-0 flex flex-col justify-between p-12 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xl flex items-center justify-center border border-white/20">
                            <span className="text-2xl font-black text-white leading-none">L</span>
                        </div>
                        <span className="text-2xl font-black text-white tracking-tight">LMS Platform</span>
                    </div>

                    <div>
                        <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-5 border border-white/20 text-xs font-bold uppercase tracking-widest text-white/70">
                            🎓 College Learning System
                        </span>
                        <h1 className="text-6xl font-black text-white leading-none mb-4 tracking-tighter">
                            Learn.<br />
                            <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Grow.</span><br />
                            Excel.
                        </h1>
                        <p className="text-lg text-white/50 font-medium max-w-sm leading-relaxed">
                            Access courses, complete assessments, and track your progress — all in one place.
                        </p>

                        <div className="flex gap-6 mt-8">
                            {[
                                { v: stats.students, l: 'Students' },
                                { v: stats.subjects, l: 'Subjects' },
                                { v: stats.quizzes, l: 'Quizzes' }
                            ].map(s => (
                                <div key={s.l}>
                                    <p className="text-2xl font-black text-white">{s.v}</p>
                                    <p className="text-xs text-white/50 font-semibold">{s.l}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── RIGHT: Login Form ── */}
            <div className="flex-1 flex items-center justify-center px-8 py-12 relative overflow-hidden" style={{ background: '#0a0a0f' }}>
                {/* Glow blobs */}
                <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}></div>
                <div className="absolute bottom-1/4 left-1/4 w-56 h-56 rounded-full opacity-15 blur-3xl pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }}></div>

                <div className="w-full max-w-md relative z-10">

                    {/* Logo (mobile) */}
                    <div className="flex lg:hidden items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center border border-white/20"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                            <span className="text-xl font-black text-white">L</span>
                        </div>
                        <span className="text-xl font-black text-white">LMS Platform</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-black text-white mb-1 tracking-tight">Welcome back</h2>
                    <p className="text-white/40 font-medium mb-8">Sign in to your account to continue</p>

                    {/* One-click demo logins */}
                    <div className="mb-6">
                        <p className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Quick Demo Login</p>
                        <div className="grid grid-cols-3 gap-2">
                            {DEMO_USERS.map(u => (
                                <button key={u.label} onClick={() => fillDemo(u.email)}
                                    className={`py-2.5 rounded-xl text-xs font-black text-white transition-all hover:scale-105 active:scale-95`}
                                    style={{ background: `linear-gradient(135deg, ${u.color.includes('indigo') ? '#6366f1,#7c3aed' : u.color.includes('emerald') ? '#10b981,#0d9488' : '#f59e0b,#ea580c'})` }}>
                                    {u.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }}></div>
                        <span className="text-xs font-bold text-white/30">OR SIGN IN MANUALLY</span>
                        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }}></div>
                    </div>

                    {error && (
                        <div className="mb-5 px-5 py-3.5 rounded-2xl border text-sm font-semibold"
                            style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Email Address</label>
                            <input
                                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-5 py-4 rounded-2xl text-white placeholder-white/20 font-medium outline-none transition-all"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.08)', fontSize: '15px' }}
                                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Password</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-5 py-4 rounded-2xl text-white placeholder-white/20 font-medium outline-none transition-all pr-14"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.08)', fontSize: '15px' }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading}
                            className="w-full py-4 rounded-2xl font-black text-base text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 shadow-2xl mt-2"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 20px 40px -10px rgba(99,102,241,0.5)' }}>
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Signing in...
                                </span>
                            ) : 'Sign In →'}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Sign up</Link>
                    </p>
                    <p className="text-center mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>
                        Demo password: <span className="font-bold text-white/30">password123</span>
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
            `}</style>
        </div>
    );
};

export default Login;
