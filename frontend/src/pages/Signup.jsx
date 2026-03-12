import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const COLLAGE = [
    { src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80', tall: true },
    { src: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=600&q=80', tall: false },
    { src: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=600&q=80', tall: false },
    { src: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80', tall: true },
    { src: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80', tall: false },
    { src: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&q=80', tall: false },
];

const Signup = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'STUDENT' });
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Step 2 Verification state
    const [step, setStep] = useState(1);
    const [verificationCode, setVerificationCode] = useState('');

    const navigate = useNavigate();
    const { register, verifyEmail } = useAuth();

    const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(form.password)) {
            setError('Password must be at least 8 chars with uppercase, lowercase, number, and special character.');
            return;
        }
        setIsLoading(true);
        const result = await register(form.name, form.email, form.password, form.role);
        if (result.success) {
            setStep(2);
        } else {
            setError(result.message);
        }
        setIsLoading(false);
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const result = await verifyEmail(form.email, verificationCode);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex overflow-hidden" style={{ background: '#0a0a0f' }}>

            {/* ── LEFT: Masonry Collage ── */}
            <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
                <div className="w-full h-full columns-3 gap-2 p-2 overflow-hidden">
                    {COLLAGE.map((img, i) => (
                        <div key={i}
                            className={`mb-2 break-inside-avoid rounded-2xl overflow-hidden ${img.tall ? 'h-72' : 'h-44'}`}
                            style={{ animation: `fadeIn ${0.3 + i * 0.1}s ease both` }}>
                            <img src={img.src} alt="Learning" className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                        </div>
                    ))}
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0a0a0f]"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/60 via-transparent to-transparent"></div>

                {/* Branding overlay */}
                <div className="absolute inset-0 flex flex-col justify-between p-12 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xl flex items-center justify-center border border-white/20">
                            <span className="text-2xl font-black text-white leading-none">L</span>
                        </div>
                        <span className="text-2xl font-black text-white tracking-tight">LMS Platform</span>
                    </div>

                    <div>
                        <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-5 border border-white/20 text-xs font-bold uppercase tracking-widest text-white/70">
                            🎓 Join the Community
                        </span>
                        <h1 className="text-5xl font-black text-white leading-none mb-4 tracking-tighter">
                            Start your<br />
                            <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>journey today.</span>
                        </h1>
                        <p className="text-lg text-white/50 font-medium max-w-sm leading-relaxed">
                            Create your account and get instant access to courses, quizzes, and real-time progress tracking.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── RIGHT: Signup Form ── */}
            <div className="flex-1 flex items-center justify-center px-8 py-10 relative overflow-y-auto" style={{ background: '#0a0a0f' }}>
                {/* Glow blobs */}
                <div className="fixed top-1/4 right-1/4 w-72 h-72 rounded-full opacity-15 blur-3xl pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}></div>
                <div className="fixed bottom-1/4 left-1/4 w-56 h-56 rounded-full opacity-10 blur-3xl pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }}></div>

                <div className="w-full max-w-md relative z-10 py-8">

                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center border border-white/20"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                            <span className="text-xl font-black text-white">L</span>
                        </div>
                        <span className="text-xl font-black text-white">LMS Platform</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-black text-white mb-1 tracking-tight">Create account</h2>
                    <p className="font-medium mb-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Sign in</Link>
                    </p>

                    {error && (
                        <div className="mb-5 px-5 py-3.5 rounded-2xl border text-sm font-semibold"
                            style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                            {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Role Selector */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>I am a</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 'STUDENT', label: '🎓 Student', desc: 'Enroll in courses & take quizzes' },
                                        { value: 'INSTRUCTOR', label: '👨‍🏫 Instructor', desc: 'Create & manage subjects' },
                                    ].map(r => (
                                        <button key={r.value} type="button"
                                            onClick={() => setForm(f => ({ ...f, role: r.value }))}
                                            className="px-4 py-4 rounded-2xl border text-left transition-all"
                                            style={{
                                                background: form.role === r.value ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                                                borderColor: form.role === r.value ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)',
                                            }}>
                                            <p className="text-sm font-black text-white">{r.label}</p>
                                            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{r.desc}</p>
                                            {form.role === r.value && <CheckCircle2 size={14} className="mt-2 text-indigo-400" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Full Name</label>
                                <input type="text" required value={form.name} onChange={update('name')} placeholder="Your full name"
                                    className="w-full px-5 py-4 rounded-2xl text-white font-medium outline-none transition-all"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.08)', fontSize: '15px' }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Email Address</label>
                                <input type="email" required value={form.email} onChange={update('email')} placeholder="you@example.com"
                                    className="w-full px-5 py-4 rounded-2xl text-white font-medium outline-none transition-all"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.08)', fontSize: '15px' }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Password</label>
                                <div className="relative">
                                    <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={update('password')} placeholder="Min. 8 chars, mixed case, special char"
                                        className="w-full px-5 py-4 pr-14 rounded-2xl text-white font-medium outline-none transition-all"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.08)', fontSize: '15px' }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                    />
                                    <button type="button" onClick={() => setShowPw(!showPw)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Confirm Password</label>
                                <input type="password" required value={form.confirm} onChange={update('confirm')} placeholder="Re-enter password"
                                    className="w-full px-5 py-4 rounded-2xl text-white font-medium outline-none transition-all"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.08)', fontSize: '15px' }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                />
                            </div>

                            <button type="submit" disabled={isLoading}
                                className="w-full py-4 rounded-2xl font-black text-base text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 mt-2"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 20px 40px -10px rgba(99,102,241,0.5)' }}>
                                {isLoading
                                    ? <span className="flex items-center justify-center gap-3">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Creating account...
                                    </span>
                                    : 'Create Account →'}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center" style={{ animation: 'fadeIn 0.5s ease both' }}>
                            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(99,102,241,0.15)' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Check your email</h3>
                            <p className="text-sm font-medium mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                We've sent a 6-digit security code to <strong>{form.email}</strong>.
                            </p>

                            <form onSubmit={handleVerify} className="space-y-6">
                                <div>
                                    <label htmlFor="code" className="sr-only">Verification Code</label>
                                    <input
                                        id="code"
                                        type="text"
                                        maxLength={6}
                                        required
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                        className="w-full text-center text-4xl tracking-[0.5em] font-black font-mono px-4 py-6 rounded-2xl outline-none transition-all"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.08)', color: 'white' }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                        placeholder="••••••"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || verificationCode.length !== 6}
                                    className="w-full py-4 rounded-2xl font-black text-base text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                                    style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 20px 40px -10px rgba(99,102,241,0.5)' }}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {isLoading ? 'Verifying...' : 'Verify & Enter →'}
                                    </span>
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
                input::placeholder { color: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
};

export default Signup;
