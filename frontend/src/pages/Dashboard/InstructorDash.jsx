import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, Trophy, X, BookOpen, Users, FileQuestion } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SUBJECT_IMAGES = [
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80', // code / DSA
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80', // math board
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80', // books / history
    'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&q=80', // circuit board
];

const ACCENTS = [
    { bar: 'border-red-400', bg: 'bg-red-500', color: '#ef4444' },
    { bar: 'border-emerald-400', bg: 'bg-emerald-500', color: '#10b981' },
    { bar: 'border-indigo-500', bg: 'bg-indigo-500', color: '#6366f1' },
    { bar: 'border-amber-400', bg: 'bg-amber-500', color: '#f59e0b' },
];

const InstructorDash = ({ currentView = 'dashboard' }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [subjects, setSubjects] = useState([]);
    const [quizzesBySubject, setQuizzesBySubject] = useState({});
    const [rankingsBySubject, setRankingsBySubject] = useState({});
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const { data: subs } = await api.get('/subjects');
            setSubjects(subs);

            // Fetch quizzes and rankings for each subject in parallel
            const qMap = {}, rMap = {};
            await Promise.all(subs.map(async (s) => {
                try {
                    const [qRes, rRes] = await Promise.all([
                        api.get(`/quizzes/subject/${s._id}`),
                        api.get(`/analytics/subject/${s._id}/rankings`)
                    ]);
                    qMap[s._id] = qRes.data;
                    rMap[s._id] = rRes.data;
                } catch { qMap[s._id] = []; rMap[s._id] = []; }
            }));
            setQuizzesBySubject(qMap);
            setRankingsBySubject(rMap);
        } catch (error) {
            console.error('Error fetching instructor data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/subjects', { title: newTitle, description: newDescription, units: [] });
            setNewTitle(''); setNewDescription(''); setShowCreateModal(false);
            fetchAll();
        } catch (error) { console.error('Error creating subject', error); }
    };

    const deleteSubject = async (id) => {
        if (window.confirm('Delete this subject permanently?')) {
            try { await api.delete(`/subjects/${id}`); fetchAll(); }
            catch (error) { console.error('Error deleting subject', error); }
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    // ─── CREATE MODAL ────────────────────────────────────────────────────────────
    const CreateModal = () => (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border border-slate-100">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-900">Create New Subject</h3>
                    <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
                        <X size={16} />
                    </button>
                </div>
                <form onSubmit={handleCreateSubject} className="p-8 space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Subject Title</label>
                        <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 text-slate-800 font-medium"
                            placeholder="e.g. Modern Physics 101" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                        <textarea rows="3" value={newDescription} onChange={(e) => setNewDescription(e.target.value)}
                            className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 text-slate-800 font-medium resize-none"
                            placeholder="Brief course overview..." />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setShowCreateModal(false)}
                            className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                        <button type="submit"
                            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black shadow-xl shadow-indigo-500/25 transition-all">
                            Create →
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    // ─── VIEW: DASHBOARD (OVERVIEW) ──────────────────────────────────────────────
    if (currentView === 'dashboard') {
        const totalStudents = Object.values(rankingsBySubject).reduce((a, r) => a + r.length, 0);
        const totalQuizzes = Object.values(quizzesBySubject).reduce((a, q) => a + q.length, 0);

        const barData = subjects.map((s) => ({
            name: s.title.split(' ')[0],
            students: rankingsBySubject[s._id]?.length || 0,
            quizzes: quizzesBySubject[s._id]?.length || 0,
        }));

        return (
            <div className="space-y-8 animate-fade-in-up">
                {/* Hero */}
                <div className="relative h-52 rounded-[2rem] overflow-hidden group">
                    <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1400&q=80" alt="Instructor Hero" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/85 via-slate-900/50 to-transparent flex items-center px-12">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-2">Instructor Dashboard</p>
                            <h1 className="text-4xl font-black text-white leading-tight">Welcome back,<br /><span className="text-indigo-300">{user?.name} 👨‍🏫</span></h1>
                        </div>
                    </div>
                    <button onClick={() => setShowCreateModal(true)}
                        className="absolute top-6 right-6 flex items-center gap-2 bg-white text-slate-900 font-black text-sm px-6 py-3 rounded-full shadow-xl hover:bg-indigo-600 hover:text-white transition-all">
                        <Plus size={16} /> New Subject
                    </button>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-3 gap-5">
                    {[
                        { label: 'My Subjects', value: subjects.length, gradient: 'from-indigo-500 to-violet-600', emoji: '📚' },
                        { label: 'Total Students', value: totalStudents, gradient: 'from-emerald-400 to-teal-600', emoji: '🎓' },
                        { label: 'Total Quizzes', value: totalQuizzes, gradient: 'from-amber-400 to-orange-500', emoji: '🧠' },
                    ].map((s, i) => (
                        <div key={i} className={`bg-gradient-to-br ${s.gradient} p-7 rounded-3xl text-white shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}>
                            <div className="text-3xl mb-3">{s.emoji}</div>
                            <p className="text-4xl font-black mb-1">{s.value}</p>
                            <p className="text-sm text-white/75 font-semibold">{s.label}</p>
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10"></div>
                        </div>
                    ))}
                </div>

                {/* Bar Chart */}
                {barData.length > 0 && (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Subjects at a Glance</h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)', fontWeight: 700 }} />
                                <Bar dataKey="students" name="Students" fill="#6366f1" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="quizzes" name="Quizzes" fill="#10b981" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {showCreateModal && <CreateModal />}
            </div>
        );
    }

    // ─── VIEW: MY COURSES ────────────────────────────────────────────────────────
    if (currentView === 'courses') {
        return (
            <div className="space-y-8 animate-fade-in-up">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-1">Instructor</p>
                        <h2 className="text-3xl font-black text-slate-900">My Subjects</h2>
                    </div>
                    <button onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-indigo-500/25 transition-all">
                        <Plus size={18} /> New Subject
                    </button>
                </div>

                {subjects.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
                        <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-black text-slate-700 mb-2">No Subjects Yet</h3>
                        <p className="text-slate-500">Click "New Subject" to create your first course.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subjects.map((subject, index) => {
                            const theme = ACCENTS[index % ACCENTS.length];
                            return (
                                <div key={subject._id} className="group relative rounded-[2rem] overflow-hidden shadow-lg h-[400px] flex flex-col justify-end transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                                    <div className="absolute inset-0">
                                        <img src={subject.thumbnail || SUBJECT_IMAGES[index % SUBJECT_IMAGES.length]} alt={subject.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

                                    {/* Action buttons top-right */}
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => navigate(`/instructor/subject/${subject._id}`)}
                                            className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white backdrop-blur-md rounded-xl text-white hover:text-slate-900 border border-white/20 transition-all">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => deleteSubject(subject._id)}
                                            className="w-10 h-10 flex items-center justify-center bg-red-500/80 hover:bg-red-600 backdrop-blur-md rounded-xl text-white border border-red-400/20 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="relative z-10 p-8">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/20">
                                                {subject.units?.length || 0} Units
                                            </span>
                                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/20">
                                                {rankingsBySubject[subject._id]?.length || 0} Students
                                            </span>
                                        </div>
                                        <div className={`w-12 h-1 ${theme.bg} rounded-full mb-3`}></div>
                                        <h3 className="font-black text-2xl text-white mb-2 leading-tight">{subject.title}</h3>
                                        <p className="text-sm text-slate-300 line-clamp-2">{subject.description}</p>

                                        <button onClick={() => navigate(`/instructor/subject/${subject._id}`)}
                                            className="w-full mt-5 bg-white/10 hover:bg-white text-white hover:text-slate-900 border border-white/20 backdrop-blur-md font-bold text-sm px-6 py-3 rounded-xl transition-all duration-300">
                                            ✏️ Edit Content
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                {showCreateModal && <CreateModal />}
            </div>
        );
    }

    // ─── VIEW: ASSESSMENTS ───────────────────────────────────────────────────────
    if (currentView === 'tests') {
        return (
            <div className="space-y-8 animate-fade-in-up">
                <div className="relative h-48 rounded-[2rem] overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&q=80" alt="Assessments" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/85 via-slate-900/60 to-transparent flex items-center px-10">
                        <div>
                            <p className="text-indigo-300 text-xs font-black uppercase tracking-widest mb-2">Quizzes You Created</p>
                            <h1 className="text-4xl font-black text-white">Assessments</h1>
                        </div>
                    </div>
                </div>

                {subjects.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100">
                        <p className="text-slate-500">Create subjects first to add quizzes.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {subjects.map((subject, i) => {
                            const quizzes = quizzesBySubject[subject._id] || [];
                            const theme = ACCENTS[i % ACCENTS.length];
                            return (
                                <div key={subject._id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="relative h-32">
                                        <img src={subject.thumbnail || SUBJECT_IMAGES[i % SUBJECT_IMAGES.length]} alt={subject.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-end p-5">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-white/60 mb-1">Subject</p>
                                                <h3 className="font-black text-lg text-white">{subject.title}</h3>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-sm font-bold text-slate-500">{quizzes.length} Quiz{quizzes.length !== 1 ? 'zes' : ''}</span>
                                            <button onClick={() => navigate(`/instructor/subject/${subject._id}?tab=quizzes`)}
                                                className="text-xs font-black px-4 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-100 transition-colors">
                                                + Add Quiz
                                            </button>
                                        </div>

                                        {quizzes.length === 0 ? (
                                            <div className="py-6 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-2xl">
                                                <FileQuestion size={24} className="mx-auto mb-2 text-slate-300" />
                                                No quizzes yet. Edit the subject to add quizzes.
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {quizzes.map((quiz, qIdx) => (
                                                    <div key={quiz._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800">{quiz.title}</p>
                                                            <p className="text-xs text-slate-400 mt-0.5">{quiz.questions?.length || 0} Questions • MCQ</p>
                                                        </div>
                                                        <span className={`text-xs font-black px-3 py-1.5 rounded-xl text-white ${theme.bg}`}>Q{qIdx + 1}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // ─── VIEW: ANALYTICS ─────────────────────────────────────────────────────────
    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="relative h-48 rounded-[2rem] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1543286386-713bdd548da4?w=1200&q=80" alt="Analytics" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-violet-900/85 via-slate-900/60 to-transparent flex items-center px-10">
                    <div>
                        <p className="text-violet-300 text-xs font-black uppercase tracking-widest mb-2">Live Student Data</p>
                        <h1 className="text-4xl font-black text-white">Analytics</h1>
                    </div>
                </div>
            </div>

            {subjects.map((subject, i) => {
                const rankings = rankingsBySubject[subject._id] || [];
                const theme = ACCENTS[i % ACCENTS.length];
                return (
                    <div key={subject._id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="relative h-24">
                            <img src={subject.thumbnail || SUBJECT_IMAGES[i % SUBJECT_IMAGES.length]} alt={subject.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center px-8">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-white/60 mb-1">{rankings.length} Students Enrolled</p>
                                    <h3 className="font-black text-xl text-white">{subject.title}</h3>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {rankings.length === 0 ? (
                                <div className="py-8 text-center text-slate-400">
                                    <Users size={32} className="mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm">No students enrolled yet.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                {['Rank', 'Student', 'Avg Quiz', 'Completion', 'Score'].map(h => (
                                                    <th key={h} className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-widest text-left">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {rankings.map((r, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-4">
                                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs text-white ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-300' : idx === 2 ? 'bg-orange-300' : 'bg-slate-100 text-slate-500'}`}>
                                                            #{idx + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-white text-xs font-black">
                                                                {r.name?.charAt(0)?.toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">{r.name}</p>
                                                                <p className="text-xs text-slate-400">{r.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm font-semibold text-slate-600">{r.averageQuizScore}%</td>
                                                    <td className="px-4 py-4 text-sm font-semibold text-slate-600">{r.completionPercentage}%</td>
                                                    <td className="px-4 py-4">
                                                        <span className="font-black text-lg text-indigo-700">{r.finalRankingScore}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default InstructorDash;
