import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import ProfileSection from './ProfileSection';

const PINTEREST_IMAGES = [
    'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80',
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80',
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminDash = ({ currentView = 'overview' }) => {
    const [users, setUsers] = useState([]);
    const [rankings, setRankings] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assignModal, setAssignModal] = useState({ open: false, instructor: null });
    const [subjects, setSubjects] = useState([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [usersRes, ranksRes, actRes, subjectsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/analytics/college-rankings'),
                api.get('/admin/activity'),
                api.get('/subjects')
            ]);
            setUsers(usersRes.data);
            setRankings(ranksRes.data);
            setActivities(actRes.data);
            setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : subjectsRes.data.data || []);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id) => {
        try {
            const { data } = await api.put(`/admin/users/${id}/status`);
            setUsers(users.map(u => (u._id === id ? data : u)));
        } catch (error) {
            console.error('Failed to toggle status', error);
        }
    };

    const deleteUser = async (id) => {
        if (window.confirm("Are you sure you want to permanently delete this user? All their data will be lost.")) {
            try {
                await api.delete(`/admin/users/${id}`);
                setUsers(users.filter(u => u._id !== id));
            } catch (error) {
                console.error('Failed to delete user', error);
                alert(error.response?.data?.message || 'Failed to delete user');
            }
        }
    };

    const updateRole = async (id, newRole) => {
        try {
            await api.put(`/admin/users/${id}/role`, { role: newRole });
            fetchData();
        } catch (error) { console.error('Failed to update role', error); }
    };

    const manualVerify = async (id) => {
        try {
            const { data } = await api.put(`/admin/users/${id}/verify`);
            setUsers(users.map(u => (u._id === id ? data : u)));
        } catch (error) {
            console.error('Failed to manually verify user', error);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    // --- Derived chart data from real API data ---
    const studentCount = users.filter(u => u.role === 'STUDENT').length;
    const instructorCount = users.filter(u => u.role === 'INSTRUCTOR').length;
    const adminCount = users.filter(u => u.role === 'ADMIN').length;
    const activeCount = users.filter(u => u.status === 'ACTIVE').length;
    const inactiveCount = users.filter(u => u.status === 'INACTIVE').length;

    const pieData = [
        { name: 'Students', value: studentCount || 1 },
        { name: 'Instructors', value: instructorCount || 1 },
        { name: 'Admins', value: adminCount || 1 },
    ];

    const statusPieData = [
        { name: 'Active', value: activeCount || 1 },
        { name: 'Inactive', value: inactiveCount || 1 },
    ];

    const rankBarData = rankings.slice(0, 8).map(r => ({
        name: r.name?.split(' ')[0] || 'Student',
        score: parseFloat(r.finalRankingScore) || 0,
        quiz: parseFloat(r.averageQuizScore) || 0,
    }));

    const areaData = [
        { month: 'Jan', users: Math.max(1, users.length - 5) },
        { month: 'Feb', users: Math.max(1, users.length - 3) },
        { month: 'Mar', users: Math.max(1, users.length - 1) },
        { month: 'Apr', users: users.length },
    ];

    // --- Assign Subject Modal ---
    const AssignSubjectModal = () => {
        if (!assignModal.open) return null;
        const handleAssign = async () => {
            if (!selectedSubjectId) return;
            setAssignLoading(true);
            try {
                await api.put(`/subjects/${selectedSubjectId}`, {
                    instructor_id: assignModal.instructor._id
                });
                await fetchData();
                setAssignModal({ open: false, instructor: null });
                setSelectedSubjectId('');
            } catch (err) {
                console.error('Failed to assign subject', err);
            } finally {
                setAssignLoading(false);
            }
        };
        return (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
                    <h3 className="text-xl font-black text-slate-900 mb-1">Assign Subject</h3>
                    <p className="text-sm text-slate-400 mb-6">
                        Assigning to <span className="font-bold text-indigo-600">{assignModal.instructor?.name}</span>
                    </p>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">Select Subject</label>
                    <select
                        value={selectedSubjectId}
                        onChange={e => setSelectedSubjectId(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-400 outline-none mb-6"
                    >
                        <option value="">-- Choose a subject --</option>
                        {subjects.map(s => (
                            <option key={s.subject_id} value={s.subject_id}>
                                {s.subject_name}{s.instructor_id ? ' (already assigned)' : ''}
                            </option>
                        ))}
                    </select>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => { setAssignModal({ open: false, instructor: null }); setSelectedSubjectId(''); }}
                            className="px-5 py-2.5 rounded-2xl text-sm font-bold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-all">
                            Cancel
                        </button>
                        <button
                            onClick={handleAssign}
                            disabled={!selectedSubjectId || assignLoading}
                            className="px-5 py-2.5 rounded-2xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                            {assignLoading ? 'Assigning...' : 'Assign'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- Shared table ---
    const renderUserTable = (filteredUsers, title) => (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black text-slate-900">{title}</h2>
                <span className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-2xl">{filteredUsers.length} users</span>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                            <tr>
                                {['Name', 'Email', 'Role', 'Status', 'Action', 'Subject'].map(h => (
                                    <th key={h} className="px-4 lg:px-6 py-4 text-left text-[10px] lg:text-xs font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {filteredUsers.map((u) => (
                                <tr key={u._id} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white text-xs lg:text-sm font-extrabold shadow-sm">
                                                {u.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800">{u.name}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{u.userId || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-medium">{u.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {u.role === 'ADMIN' ? (
                                            <span className="text-xs font-black text-indigo-500 px-3 py-2 bg-indigo-50 rounded-xl">System Admin</span>
                                        ) : (
                                            <select
                                                value={u.role}
                                                onChange={(e) => updateRole(u._id, e.target.value)}
                                                className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-400 outline-none cursor-pointer"
                                            >
                                                <option value="STUDENT">Student</option>
                                                <option value="INSTRUCTOR">Instructor</option>
                                            </select>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1.5 text-xs font-black rounded-xl ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {u.role === 'ADMIN' ? (
                                            <span className="text-xs font-bold px-4 py-2 text-slate-400">Protected</span>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                {!u.isVerified && (
                                                    <button onClick={() => manualVerify(u._id)} className="text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md">
                                                        Verify
                                                    </button>
                                                )}
                                                <button onClick={() => toggleStatus(u._id)} className={`text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm ${u.status === 'ACTIVE' ? 'text-red-500 bg-red-50 hover:bg-red-100 hover:shadow-md' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:shadow-md'}`}>
                                                    {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button onClick={() => deleteUser(u._id)} className="text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm text-red-600 border border-red-200 hover:bg-red-600 hover:text-white hover:shadow-md">
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {u.role === 'INSTRUCTOR' ? (
                                            <button
                                                onClick={() => { setAssignModal({ open: true, instructor: u }); setSelectedSubjectId(''); }}
                                                className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all">
                                                Assign Subject
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-300 font-medium">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <AssignSubjectModal />
        </div>
    );

    if (currentView === 'profile') return <ProfileSection />;

    // --- Activity Logs Table ---
    if (currentView === 'activity') return (
        <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-3xl font-black text-slate-900">Student Activity Logs</h2>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                            <tr>
                                {['Student', 'Role', 'Login Time', 'Logout Time', 'Duration'].map(h => (
                                    <th key={h} className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {activities.map((act) => (
                                <tr key={act.id} className="hover:bg-indigo-50/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white text-sm font-extrabold shadow-sm">
                                                {act.user ? act.user.name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <span className={`text-sm font-bold ${act.user ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                                {act.user ? act.user.name : 'Deleted User'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-medium">
                                        {act.user ? act.user.role : 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-semibold">{new Date(act.loginTime).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-semibold">{act.logoutTime ? new Date(act.logoutTime).toLocaleString() : <span className="text-emerald-500">Active</span>}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-bold text-sm text-indigo-700">{act.durationSeconds ? `${Math.floor(act.durationSeconds / 60)}m ${act.durationSeconds % 60}s` : '-'}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    if (currentView === 'all-users') return renderUserTable(users, 'All Users');
    if (currentView === 'students') return renderUserTable(users.filter(u => u.role === 'STUDENT'), 'Students');
    if (currentView === 'instructors') return renderUserTable(users.filter(u => u.role === 'INSTRUCTOR'), 'Instructors');

    if (currentView === 'rankings') return (
        <div className="space-y-8 animate-fade-in-up">
            <h2 className="text-3xl font-black text-slate-900">🏆 College Rankings</h2>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Final Score Leaderboard</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={rankBarData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)', fontWeight: 700 }} />
                        <Legend />
                        <Bar dataKey="score" name="Ranking Score" fill="#6366f1" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="quiz" name="Avg Quiz %" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                {['Rank', 'Student', 'Avg Quiz', 'Completion', 'Final Score'].map(h => (
                                    <th key={h} className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {rankings.map((r, i) => (
                                <tr key={i} className={i < 3 ? 'bg-amber-50/40' : 'hover:bg-slate-50'}>
                                    <td className="px-6 py-4">
                                        <span className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-white' : i === 2 ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            #{i + 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{r.name}</div>
                                        <div className="text-xs text-slate-400">{r.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">{r.averageQuizScore}%</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">{r.completionPercentage}%</td>
                                    <td className="px-6 py-4">
                                        <span className="font-black text-lg text-indigo-700">{r.finalRankingScore}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    if (currentView === 'statistics') return (
        <div className="space-y-8 animate-fade-in-up">
            <h2 className="text-2xl lg:text-3xl font-black text-slate-900">Platform Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Users', value: users.length, color: 'from-violet-500 to-indigo-600', emoji: '👥' },
                    { label: 'Students', value: studentCount, color: 'from-emerald-400 to-teal-600', emoji: '🎓' },
                    { label: 'Instructors', value: instructorCount, color: 'from-amber-400 to-orange-600', emoji: '👨‍🏫' },
                    { label: 'Active Users', value: activeCount, color: 'from-pink-500 to-rose-600', emoji: '✅' },
                ].map((stat, i) => (
                    <div key={i} className={`bg-gradient-to-br ${stat.color} p-6 lg:p-8 rounded-3xl shadow-xl text-white hover:-translate-y-1 transition-all duration-300`}>
                        <div className="text-3xl lg:text-4xl mb-3">{stat.emoji}</div>
                        <p className="text-4xl lg:text-5xl font-black mb-2">{stat.value}</p>
                        <p className="text-xs lg:text-sm text-white/80 font-semibold">{stat.label}</p>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">User Roles</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">User Status</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                <Cell fill="#10b981" />
                                <Cell fill="#ef4444" />
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    // OVERVIEW (default)
    return (
        <div className="space-y-6 lg:space-y-8 animate-fade-in-up">
            {/* Hero Banner */}
            <div className="relative rounded-2xl lg:rounded-[2rem] overflow-hidden h-40 lg:h-56 group">
                <img src={PINTEREST_IMAGES[0]} alt="Hero" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 via-slate-900/60 to-transparent flex items-center px-6 lg:px-12">
                    <div>
                        <p className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-indigo-300 mb-1 lg:mb-2">Admin Dashboard</p>
                        <h1 className="text-2xl lg:text-4xl font-black text-white leading-tight">Welcome back,<br /><span className="text-indigo-300">Administrator</span></h1>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                {[
                    { label: 'Total Users', value: users.length, gradient: 'from-violet-500 to-indigo-600', emoji: '👥' },
                    { label: 'Students', value: studentCount, gradient: 'from-emerald-400 to-teal-600', emoji: '🎓' },
                    { label: 'Instructors', value: instructorCount, gradient: 'from-amber-400 to-orange-500', emoji: '👨‍🏫' },
                    { label: 'Active Users', value: activeCount, gradient: 'from-pink-500 to-rose-500', emoji: '✅' },
                ].map((s, i) => (
                    <div key={i} className={`relative bg-gradient-to-br ${s.gradient} p-5 lg:p-6 rounded-3xl shadow-lg text-white overflow-hidden hover:-translate-y-1 transition-all duration-300`}>
                        <div className="text-2xl lg:text-3xl mb-2 lg:mb-3">{s.emoji}</div>
                        <p className="text-3xl lg:text-4xl font-black">{s.value}</p>
                        <p className="text-xs lg:text-sm text-white/75 mt-0.5 lg:mt-1 font-semibold">{s.label}</p>
                        <div className="absolute -right-4 -bottom-4 w-20 lg:w-24 h-20 lg:h-24 rounded-full bg-white/10"></div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Area Chart - User Growth */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Platform Growth</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={areaData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 700 }} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)', fontWeight: 700 }} />
                            <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} fill="url(#colorUsers)" dot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 8, fill: '#6366f1' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart - Roles */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">User Roles</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={5} dataKey="value">
                                {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 700 }} />
                            <Legend iconType="circle" iconSize={10} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Ranking Bar Chart + Top Students */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Student Performance</h3>
                    {rankBarData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={rankBarData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)', fontWeight: 700 }} />
                                <Legend iconType="circle" iconSize={10} />
                                <Bar dataKey="score" name="Ranking Score" fill="#6366f1" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="quiz" name="Quiz Avg %" fill="#10b981" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-60 flex items-center justify-center text-slate-400 text-sm font-medium">No quiz results yet. Rankings will appear once students complete assessments.</div>
                    )}
                </div>

                {/* Top Students Panel with Pinterest Images */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="relative h-36 overflow-hidden">
                        <img src={PINTEREST_IMAGES[1]} alt="Top Students" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
                        <h3 className="absolute bottom-4 left-6 text-sm font-black uppercase tracking-widest text-slate-800">Top Students</h3>
                    </div>
                    <ul className="divide-y divide-slate-50">
                        {rankings.slice(0, 4).map((rank, i) => (
                            <li key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-black w-7 h-7 rounded-full flex items-center justify-center ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-white' : 'bg-slate-100 text-slate-500'}`}>#{i + 1}</span>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 leading-none mb-0.5">{rank.name}</p>
                                        <p className="text-xs text-slate-400">Quiz Avg: {rank.averageQuizScore}%</p>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-indigo-700">{rank.finalRankingScore}</span>
                            </li>
                        ))}
                        {rankings.length === 0 && (
                            <li className="px-6 py-8 text-center text-slate-400 text-sm">No rankings yet.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AdminDash;