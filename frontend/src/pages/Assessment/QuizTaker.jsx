import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { CheckCircle2, AlertCircle, ArrowLeft, Trophy, Target, BookOpen, Flag } from 'lucide-react';
import MathJaxRenderer from '../../components/renderers/MathJaxRenderer';

const SUBJECT_IMAGES = [
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80', // code terminal
    'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80', // math equations
    'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80', // books / history
];

const QuizTaker = () => {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [flaggedQuestions, setFlaggedQuestions] = useState({});
    const [flagInput, setFlagInput] = useState({ open: null, reason: '' });

    useEffect(() => { fetchQuizzes(); }, [subjectId]);

    const fetchQuizzes = async () => {
        try {
            const { data } = await api.get(`/quizzes/subject/${subjectId}`);
            setQuizzes(data);
        } catch (error) {
            console.error('Error fetching quizzes', error);
        } finally {
            setLoading(false);
        }
    };

    const startQuiz = (quiz) => {
        setActiveQuiz(quiz);
        setAnswers(new Array(quiz.questions.length).fill(null));
        setResult(null);
        window.scrollTo(0, 0);
    };

    const handleSelectOption = (qIndex, optionIndex) => {
        const newAnswers = [...answers];
        newAnswers[qIndex] = optionIndex;
        setAnswers(newAnswers);
    };

    const handleFlagQuestion = async (qIndex) => {
        const reason = flagInput.reason.trim();
        if (!reason) return alert('Please enter a reason for flagging.');
        try {
            await api.post('/flags', {
                quizId: activeQuiz._id,
                questionIndex: qIndex,
                reason
            });
            setFlaggedQuestions(prev => ({ ...prev, [qIndex]: reason }));
            setFlagInput({ open: null, reason: '' });
        } catch (error) {
            alert(error.response?.data?.message || 'Error flagging question');
        }
    };

    const handleSubmit = async () => {
        if (answers.includes(null)) {
            alert('Please answer all questions before submitting.');
            return;
        }
        setSubmitting(true);
        try {
            const { data } = await api.post(`/quizzes/${activeQuiz._id}/submit`, { answers });
            setResult(data);
            window.scrollTo(0, 0);
        } catch (error) {
            alert(error.response?.data?.message || 'Error submitting quiz');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    // ── RESULTS SCREEN ──
    if (result) {
        const isPassed = result.percentage >= 70;
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-6">
                <div className="w-full max-w-lg text-center animate-fade-in-up">
                    <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-8 shadow-2xl ${isPassed ? 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-500/30' : 'bg-gradient-to-br from-red-400 to-rose-600 shadow-red-500/30'}`}>
                        {isPassed ? <Trophy size={56} className="text-white" /> : <AlertCircle size={56} className="text-white" />}
                    </div>

                    <p className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-3">Assessment Complete</p>
                    <h2 className="text-5xl font-black text-white mb-4">
                        {isPassed ? '🎉 Passed!' : 'Keep Trying'}
                    </h2>
                    <p className="text-slate-400 font-medium mb-8">
                        You scored {result.score} out of {result.answers?.length || 5} questions correctly.
                    </p>

                    <div className={`text-6xl sm:text-8xl font-black mb-10 ${isPassed ? 'text-emerald-400' : 'text-red-400'}`}>
                        {result.percentage}%
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-8 text-left border border-white/10">
                        <h4 className="font-black text-white mb-4 text-sm uppercase tracking-widest">Question Breakdown</h4>
                        <div className="space-y-3">
                            {result.answers?.map((ans, idx) => (
                                <div key={idx} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                                    <span className="text-slate-300 font-medium text-sm">Question {idx + 1}</span>
                                    {ans.isCorrect ? (
                                        <span className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                                            <CheckCircle2 size={18} /> Correct
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 text-red-400 font-bold text-sm">
                                            <AlertCircle size={18} /> Incorrect
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => { setResult(null); setActiveQuiz(null); }}
                            className="flex-1 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-xl shadow-indigo-500/30 transition-all"
                        >
                            Dashboard →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── ACTIVE QUIZ SCREEN ──
    if (activeQuiz) {
        const answeredCount = answers.filter(a => a !== null).length;
        const progressPct = (answeredCount / activeQuiz.questions.length) * 100;

        return (
            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
                    <button
                        onClick={() => setActiveQuiz(null)}
                        className="flex items-center gap-1 sm:gap-2 text-slate-500 hover:text-slate-900 font-semibold text-xs sm:text-sm transition-colors"
                    >
                        <ArrowLeft size={18} /> <span className="hidden sm:inline">Back</span>
                    </button>
                    <div className="text-center px-2">
                        <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">{activeQuiz.title}</p>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-medium">{answeredCount}/{activeQuiz.questions.length} answered</p>
                    </div>
                    <div className="w-16 sm:w-20 h-2 sm:h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto py-12 px-6 space-y-8">
                    {activeQuiz.questions.map((q, qIndex) => (
                        <div key={qIndex} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="px-8 pt-8 pb-4">
                                <div className="flex items-start gap-4">
                                    <span className="flex-shrink-0 w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                        {qIndex + 1}
                                    </span>
                                    <div className="flex-1 text-lg font-bold text-slate-900 leading-snug pt-1">
                                        <MathJaxRenderer content={q.questionText} />
                                    </div>
                                    <button
                                        onClick={() => setFlagInput(prev => ({ reason: '', open: prev.open === qIndex ? null : qIndex }))}
                                        title={flaggedQuestions[qIndex] ? 'Already flagged' : 'Flag this question'}
                                        className={`flex-shrink-0 p-2 rounded-xl transition-all ${flaggedQuestions[qIndex]
                                            ? 'text-red-500 bg-red-50'
                                            : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                                            }`}
                                    >
                                        <Flag size={18} />
                                    </button>
                                </div>
                                {flagInput.open === qIndex && !flaggedQuestions[qIndex] && (
                                    <div className="mt-4 ml-13 p-4 bg-red-50 border border-red-200 rounded-2xl">
                                        <p className="text-sm font-semibold text-red-700 mb-2">Why are you flagging this question?</p>
                                        <textarea
                                            value={flagInput.reason}
                                            onChange={(e) => setFlagInput(prev => ({ ...prev, reason: e.target.value }))}
                                            placeholder="e.g. Wrong answer, unclear question, junk content..."
                                            className="w-full p-3 text-sm border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                                            rows={2}
                                            maxLength={500}
                                        />
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => handleFlagQuestion(qIndex)}
                                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors"
                                            >
                                                Submit Flag
                                            </button>
                                            <button
                                                onClick={() => setFlagInput({ open: null, reason: '' })}
                                                className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {flaggedQuestions[qIndex] && flagInput.open === qIndex && (
                                    <div className="mt-4 ml-13 p-3 bg-red-50 border border-red-200 rounded-2xl">
                                        <p className="text-sm text-red-600">✓ Flagged: {flaggedQuestions[qIndex]}</p>
                                    </div>
                                )}
                            </div>
                            <div className="px-8 pb-8 space-y-3">
                                {q.options.map((opt, oIndex) => {
                                    const isSelected = answers[qIndex] === oIndex;
                                    return (
                                        <button
                                            key={oIndex}
                                            onClick={() => handleSelectOption(qIndex, oIndex)}
                                            className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${isSelected
                                                ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-500/10'
                                                : 'border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-white'
                                                }`}
                                        >
                                            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                                                }`}>
                                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                                            </div>
                                            <span className={`text-sm font-semibold ${isSelected ? 'text-indigo-800' : 'text-slate-700'}`}>
                                                <MathJaxRenderer content={opt} />
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="sticky bottom-6 pt-4">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || answers.includes(null)}
                            className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-lg shadow-2xl shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Submitting...
                                </span>
                            ) : `Submit Assessment (${answeredCount}/${activeQuiz.questions.length})`}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── QUIZ LIST ──
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero */}
            <div className="relative h-40 lg:h-48 overflow-hidden">
                <img src={SUBJECT_IMAGES[0]} alt="Assessments" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 via-slate-900/70 to-transparent flex items-center px-6 lg:px-10">
                    <div>
                        <p className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-indigo-300 mb-1 lg:mb-2">Assessment Hall</p>
                        <h1 className="text-2xl lg:text-4xl font-black text-white">Choose a Quiz</h1>
                        <p className="text-indigo-200 text-xs lg:text-sm font-medium mt-1">{quizzes.length} assessment{quizzes.length !== 1 ? 's' : ''} available</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="absolute top-4 lg:top-6 right-4 lg:right-6 flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs lg:text-sm px-4 lg:px-5 py-2 lg:py-2.5 rounded-full border border-white/20 transition-all"
                >
                    <ArrowLeft size={16} /> Dashboard
                </button>
            </div>

            <div className="max-w-5xl mx-auto py-12 px-6">
                {quizzes.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-100">
                        <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-black text-slate-700 mb-2">No Quizzes Yet</h3>
                        <p className="text-slate-500">Your instructor hasn't published any quizzes for this subject yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {quizzes.map((quiz, i) => (
                            <div key={quiz._id} className="group relative rounded-[2rem] overflow-hidden shadow-lg h-72 cursor-pointer" onClick={() => startQuiz(quiz)}>
                                <img
                                    src={SUBJECT_IMAGES[i % SUBJECT_IMAGES.length]}
                                    alt={quiz.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                                <div className="absolute inset-0 p-8 flex flex-col justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/20">
                                            {quiz.questions.length} Questions
                                        </span>
                                        <span className="px-4 py-1.5 bg-indigo-500/80 backdrop-blur-md text-white text-xs font-bold rounded-full">
                                            MCQ
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target size={14} className="text-indigo-300" />
                                            <span className="text-xs font-black uppercase tracking-widest text-indigo-300">Assessment {i + 1}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white mb-4 leading-tight">{quiz.title}</h3>
                                        <button className="w-full bg-white text-slate-900 font-black py-3.5 rounded-2xl transition-all group-hover:bg-indigo-600 group-hover:text-white shadow-xl">
                                            Start Quiz →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizTaker;
