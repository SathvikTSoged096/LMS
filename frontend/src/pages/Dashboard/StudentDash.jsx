import { useState, useEffect } from 'react';
import api from '../../services/api';
import { BookOpen, Award, TrendingUp, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import ProfileSection from './ProfileSection';

const StudentDash = ({ currentView = 'courses' }) => {
    const [enrollments, setEnrollments] = useState([]);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [subjectQuizzes, setSubjectQuizzes] = useState({}); // { subjectId: [quizzes] }
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [enrollRes, subRes, resultsRes] = await Promise.all([
                api.get('/enrollments/me'),
                api.get('/subjects'),
                api.get('/results/me')
            ]);
            setEnrollments(enrollRes.data);
            setResults(resultsRes.data);

            // Fetch quizzes for each enrolled subject
            const quizzesBySubject = {};
            for (let enrollment of enrollRes.data) {
                try {
                    const quizRes = await api.get(`/quizzes/subject/${enrollment.subjectId._id}`);
                    quizzesBySubject[enrollment.subjectId._id] = quizRes.data;
                } catch (qErr) {
                    console.error("Error fetching quizzes for subject", qErr);
                }
            }
            setSubjectQuizzes(quizzesBySubject);

            // Filter out already enrolled subjects
            const enrolledIds = enrollRes.data.map(e => e.subjectId._id);
            setAvailableSubjects(subRes.data.filter(s => !enrolledIds.includes(s._id)));
        } catch (error) {
            console.error('Error fetching dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (subjectId) => {
        if (enrollments.length >= 3) {
            alert('You can only enroll in a maximum of 3 subjects.');
            return;
        }
        try {
            await api.post(`/enrollments/${subjectId}`);
            fetchData(); // Refresh data
        } catch (error) {
            alert(error.response?.data?.message || 'Enrollment failed');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading your learning space...</div>;

    const renderDashboard = () => {
        const progressData = enrollments.map((e, i) => ({
            name: e.subjectId.title?.split(' ')[0] || 'Subject',
            progress: e.percentageCompleted || 0,
            fill: ['#6366f1', '#10b981', '#f59e0b'][i % 3],
        }));

        const quizBarData = results.map((r, i) => ({
            name: `Quiz ${i + 1}`,
            score: r.percentage || 0,
        }));

        return (
            <div className="space-y-8 animate-fade-in-up">
                {/* Pinterest Hero Banner */}
                <div className="relative h-40 lg:h-52 rounded-2xl lg:rounded-[2rem] overflow-hidden group">
                    <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=80" alt="Studying" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 via-indigo-900/40 to-transparent flex items-center px-6 lg:px-12">
                        <div>
                            <p className="text-indigo-300 text-[10px] lg:text-xs font-black uppercase tracking-widest mb-1 lg:mb-2">Student ID: {user?.userId}</p>
                            <h1 className="text-2xl lg:text-4xl font-black text-white leading-tight">Welcome back! 👋</h1>
                            <p className="text-indigo-200 text-sm lg:text-base font-medium mt-1 lg:mt-2">You're enrolled in {enrollments.length} course{enrollments.length !== 1 ? 's' : ''}.</p>
                        </div>
                    </div>
                </div>

                {/* Stat Pills Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Enrolled', value: enrollments.length, gradient: 'from-violet-500 to-indigo-600', emoji: '📚' },
                        { label: 'Quizzes Taken', value: results.length, gradient: 'from-emerald-400 to-teal-600', emoji: '🧠' },
                        { label: 'Avg Quiz Score', value: results.length > 0 ? `${(results.reduce((a, r) => a + r.percentage, 0) / results.length).toFixed(1)}%` : '—', gradient: 'from-amber-400 to-orange-500', emoji: '🏆' },
                    ].map((s, i) => (
                        <div key={i} className={`bg-gradient-to-br ${s.gradient} p-5 lg:p-6 rounded-3xl text-white hover:-translate-y-1 transition-all duration-300 shadow-lg`}>
                            <div className="text-2xl lg:text-3xl mb-2">{s.emoji}</div>
                            <p className="text-2xl lg:text-3xl font-black">{s.value}</p>
                            <p className="text-xs lg:text-sm text-white/75 font-semibold mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Course Progress</h3>
                        {progressData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={progressData} startAngle={90} endAngle={-270}>
                                    <RadialBar dataKey="progress" cornerRadius={8} background={{ fill: '#f8fafc' }}>
                                        {progressData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                                    </RadialBar>
                                    <Legend iconSize={10} iconType="circle" />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 700 }} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-60 flex items-center justify-center text-slate-400 text-sm">Enroll in courses to see progress</div>
                        )}
                    </div>
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Quiz Performance</h3>
                        {quizBarData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={quizBarData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 700 }} />
                                    <Bar dataKey="score" name="Score %" radius={[8, 8, 0, 0]}>
                                        {quizBarData.map((_, i) => <Cell key={i} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-60 flex items-center justify-center text-slate-400 text-sm">No quiz results yet.</div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderCourses = () => (
        <div className="space-y-8 animate-fade-in-up">
            {/* Current Enrollments */}
            <div>
                {enrollments.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center border-dashed">
                        <p className="text-slate-500">You are not enrolled in any subjects yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrollments.map((enrollment, index) => {
                            // Assigning custom colors matching the user's design based on index
                            const colors = [
                                { border: 'border-red-400', bg: 'bg-red-400', btn: 'bg-red-400 hover:bg-red-500' },
                                { border: 'border-emerald-400', bg: 'bg-emerald-400', btn: 'bg-emerald-400 hover:bg-emerald-500' },
                                { border: 'border-indigo-500', bg: 'bg-indigo-500', btn: 'bg-indigo-500 hover:bg-indigo-600' },
                                { border: 'border-yellow-400', bg: 'bg-yellow-400', btn: 'bg-yellow-400 hover:bg-yellow-500' },
                            ];
                            const theme = colors[index % colors.length];

                            return (
                                <div key={enrollment._id} className="group relative rounded-[2rem] overflow-hidden shadow-lg h-[400px] flex flex-col justify-end transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                                    <div className="absolute inset-0 w-full h-full bg-slate-200">
                                        <img
                                            src={enrollment.subjectId.thumbnail || 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                                            alt={enrollment.subjectId.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

                                    <div className="relative z-10 p-8 flex flex-col h-full justify-end">
                                        <div className={`w-12 h-1 ${theme.bg} rounded-full mb-4`}></div>
                                        <h3 className="font-black text-2xl text-white mb-2 leading-tight">{enrollment.subjectId.title}</h3>

                                        <div className="mt-4 mb-6">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Progress</span>
                                                <span className="text-sm font-bold text-white">{enrollment.percentageCompleted}%</span>
                                            </div>
                                            <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden backdrop-blur-sm">
                                                <div
                                                    className={`${theme.bg} h-full rounded-full transition-all duration-1000 ease-out`}
                                                    style={{ width: `${enrollment.percentageCompleted}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => navigate(`/reader/${enrollment.subjectId._id}`)}
                                            className="w-full bg-white/10 hover:bg-white text-white hover:text-slate-900 border border-white/20 backdrop-blur-md font-bold text-sm px-6 py-3.5 rounded-xl transition-all duration-300 flex justify-center items-center gap-2"
                                        >
                                            Continue Learning
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Available Subjects */}
            {enrollments.length < 3 && availableSubjects.length > 0 && (
                <div className="pt-8 mt-8 border-t border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Available to Enroll</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableSubjects.map(subject => (
                            <div key={subject._id} className="group relative rounded-[2rem] overflow-hidden shadow-lg h-[350px] flex flex-col justify-end transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                                <div className="absolute inset-0 w-full h-full bg-slate-200">
                                    <img
                                        src={subject.thumbnail || 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
                                        alt={subject.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.15]"
                                    />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>

                                <div className="relative z-10 p-8 flex flex-col h-full justify-end">
                                    <h3 className="font-extrabold text-xl text-white mb-2 line-clamp-2 leading-snug">{subject.title}</h3>
                                    <p className="text-sm text-slate-300 mb-6 line-clamp-2 font-medium bg-black/20 p-2 rounded-lg backdrop-blur-sm border border-white/10">{subject.description}</p>
                                    <button
                                        onClick={() => handleEnroll(subject._id)}
                                        className="w-full bg-primary-600 hover:bg-primary-500 shadow-xl shadow-primary-600/30 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all duration-300"
                                    >
                                        Enroll Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderTests = () => (
        <div className="space-y-8 animate-fade-in-up">
            {/* Hero */}
            <div className="relative h-48 rounded-[2rem] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&q=80" alt="Assessments" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/85 via-slate-900/60 to-transparent flex items-center px-10">
                    <div>
                        <p className="text-indigo-300 text-xs font-black uppercase tracking-widest mb-2">Assessment Hall</p>
                        <h1 className="text-4xl font-black text-white">Your Quizzes</h1>
                    </div>
                </div>
            </div>

            {enrollments.length === 0 ? (
                <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100">
                    <p className="text-slate-500">Enroll in courses to view your assessments.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrollments.map((enrollment, index) => {
                        const images = [
                            'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&q=80',
                            'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80',
                            'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80',
                        ];
                        const accents = ['from-red-500 to-rose-600', 'from-emerald-500 to-teal-600', 'from-indigo-500 to-violet-600'];
                        const quizList = subjectQuizzes[enrollment.subjectId._id] || [];

                        return (
                            <div key={enrollment._id} className="group relative rounded-[2rem] overflow-hidden shadow-lg h-[360px] flex flex-col justify-end transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                                <div className="absolute inset-0">
                                    <img src={enrollment.subjectId.thumbnail || images[index % images.length]} alt={enrollment.subjectId.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent"></div>

                                <div className="relative z-10 p-7 flex flex-col gap-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/20">
                                            {quizList.length} Quiz{quizList.length !== 1 ? 'zes' : ''}
                                        </span>
                                    </div>
                                    <h3 className="font-black text-xl text-white leading-tight">{enrollment.subjectId.title}</h3>

                                    {quizList.length > 0 ? (
                                        <div className="space-y-2">
                                            {quizList.map((quiz, qIdx) => (
                                                <button
                                                    key={quiz._id}
                                                    onClick={() => navigate(`/quiz/${enrollment.subjectId._id}`)}
                                                    className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r ${accents[index % accents.length]} text-white text-sm font-black shadow-xl transition-all hover:scale-[1.02]`}
                                                >
                                                    🎯 Take Quiz {qIdx + 1}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">No quizzes yet from instructor.</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderProgress = () => {
        if (enrollments.length === 0) return (
            <div className="space-y-8 animate-fade-in-up flex flex-col items-center justify-center py-16">
                <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center">
                    <TrendingUp size={48} className="text-indigo-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Your Analytics</h2>
                <p className="text-slate-500 max-w-md text-center">Enroll in courses and take quizzes to see your ranking score and analytics.</p>
            </div>
        );

        return (
            <div className="space-y-8 animate-fade-in-up">
                <div className="relative h-44 rounded-[2rem] overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1543286386-713bdd548da4?w=1200&q=80" alt="Analytics" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-900/85 via-slate-900/60 to-transparent flex items-center px-10">
                        <div>
                            <p className="text-violet-300 text-xs font-black uppercase tracking-widest mb-2">Performance</p>
                            <h1 className="text-4xl font-black text-white">Your Analytics</h1>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrollments.map((enrollment, i) => {
                        const subjectQuizIds = subjectQuizzes[enrollment.subjectId._id]?.map(q => q._id) || [];
                        const userSubjectResults = results.filter(r => subjectQuizIds.includes(r.quizId._id) || subjectQuizIds.includes(r.quizId));
                        const averageQuizScore = userSubjectResults.length > 0
                            ? userSubjectResults.reduce((acc, curr) => acc + curr.percentage, 0) / userSubjectResults.length
                            : 0;
                        const completion = enrollment.percentageCompleted || 0;
                        const rankingScore = (averageQuizScore * 0.7) + (completion * 0.3);
                        const gradients = ['from-violet-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600'];

                        return (
                            <div key={enrollment._id} className={`bg-gradient-to-br ${gradients[i % gradients.length]} rounded-3xl p-8 text-white shadow-xl hover:-translate-y-2 transition-all duration-300`}>
                                <p className="text-xs font-black uppercase tracking-widest text-white/60 mb-4">{enrollment.subjectId.title}</p>

                                <div className="space-y-5 mb-6">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-white/70">Quiz Score (70%)</span>
                                            <span className="font-black text-white">{averageQuizScore.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-white/20 rounded-full h-2">
                                            <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: `${averageQuizScore}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold text-white/70">Completion (30%)</span>
                                            <span className="font-black text-white">{completion.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-white/20 rounded-full h-2">
                                            <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: `${completion}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-5 border-t border-white/20 flex items-center justify-between">
                                    <span className="text-sm font-bold text-white/80">Final Ranking Score</span>
                                    <span className="text-3xl font-black text-white">{rankingScore.toFixed(1)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (currentView === 'dashboard') return renderDashboard();
    if (currentView === 'courses') return renderCourses();
    if (currentView === 'tests') return renderTests();
    if (currentView === 'progress') return renderProgress();
    if (currentView === 'profile') return <ProfileSection />;

    return renderCourses();
};

export default StudentDash;
