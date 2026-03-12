import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Save, Plus, Trash2, Video, FileText, BookOpen, FileQuestion, CheckCircle2, Pencil, X } from 'lucide-react';

const SubjectEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [subject, setSubject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'quizzes' ? 'quizzes' : 'curriculum');

    // Quiz state
    const [quizzes, setQuizzes] = useState([]);
    const [quizTitle, setQuizTitle] = useState('');
    const [numQuestions, setNumQuestions] = useState(3);
    const [numOptions, setNumOptions] = useState(3);
    const [questions, setQuestions] = useState(
        Array.from({ length: 3 }, () => ({
            questionText: '',
            options: ['', '', ''],
            correctOptionIndex: 0
        }))
    );
    const [submittingQuiz, setSubmittingQuiz] = useState(false);
    const [editingQuizId, setEditingQuizId] = useState(null); // null = create mode, id = edit mode

    const handleNumQuestionsChange = (n) => {
        const val = Math.max(1, Math.min(50, n));
        setNumQuestions(val);
        setQuestions(prev => {
            if (val > prev.length) return [...prev, ...Array.from({ length: val - prev.length }, () => ({ questionText: '', options: Array(numOptions).fill(''), correctOptionIndex: 0 }))];
            return prev.slice(0, val);
        });
    };

    const handleNumOptionsChange = (n) => {
        const val = Math.max(2, Math.min(8, n));
        setNumOptions(val);
        setQuestions(prev => prev.map(q => {
            const opts = val > q.options.length ? [...q.options, ...Array(val - q.options.length).fill('')] : q.options.slice(0, val);
            return { ...q, options: opts, correctOptionIndex: Math.min(q.correctOptionIndex, val - 1) };
        }));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [subRes, quizRes] = await Promise.all([
                    api.get(`/subjects/${id}`),
                    api.get(`/quizzes/subject/${id}`)
                ]);
                setSubject({ ...subRes.data, units: subRes.data.units || [] });
                setQuizzes(quizRes.data);

                // Auto-load quiz for editing if ?edit=quizId is present
                const editId = searchParams.get('edit');
                if (editId && quizRes.data.length > 0) {
                    const quizToEdit = quizRes.data.find(q => String(q._id || q.id) === editId);
                    if (quizToEdit) {
                        setEditingQuizId(quizToEdit._id || quizToEdit.id);
                        setQuizTitle(quizToEdit.title);
                        const qs = quizToEdit.questions || [];
                        setNumQuestions(qs.length);
                        setNumOptions(qs[0]?.options?.length || 3);
                        setQuestions(qs.map(q => ({ questionText: q.questionText, options: [...q.options], correctOptionIndex: q.correctOptionIndex || 0 })));
                    }
                }
            } catch (error) {
                console.error('Error fetching subject', error);
                alert('Failed to load subject data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // ─── CURRICULUM HANDLERS ─────────────────────
    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/subjects/${id}`, { units: subject.units });
            alert('Subject curriculum saved successfully!');
        } catch (error) {
            console.error('Error saving subject', error);
            alert('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    const addUnit = () => {
        setSubject(prev => ({
            ...prev,
            units: [...prev.units, { unitNumber: prev.units.length + 1, title: 'New Unit', chapters: [] }]
        }));
    };

    const addChapter = (unitIndex) => {
        const newUnits = [...subject.units];
        newUnits[unitIndex].chapters.push({ chapterNumber: newUnits[unitIndex].chapters.length + 1, title: 'New Chapter', sections: [] });
        setSubject({ ...subject, units: newUnits });
    };

    const addSection = (unitIndex, chapterIndex) => {
        const newUnits = [...subject.units];
        newUnits[unitIndex].chapters[chapterIndex].sections.push({
            sectionNumber: newUnits[unitIndex].chapters[chapterIndex].sections.length + 1,
            title: 'New Section', videoUrl: '', paragraphs: ['']
        });
        setSubject({ ...subject, units: newUnits });
    };

    const updateSection = (unitIndex, chapterIndex, sectionIndex, field, value) => {
        const newUnits = [...subject.units];
        newUnits[unitIndex].chapters[chapterIndex].sections[sectionIndex][field] = value;
        setSubject({ ...subject, units: newUnits });
    };

    const updateParagraph = (unitIndex, chapterIndex, sectionIndex, paraIndex, value) => {
        const newUnits = [...subject.units];
        newUnits[unitIndex].chapters[chapterIndex].sections[sectionIndex].paragraphs[paraIndex] = value;
        setSubject({ ...subject, units: newUnits });
    };

    const addParagraph = (unitIndex, chapterIndex, sectionIndex) => {
        const newUnits = [...subject.units];
        newUnits[unitIndex].chapters[chapterIndex].sections[sectionIndex].paragraphs.push('');
        setSubject({ ...subject, units: newUnits });
    };

    const removeParagraph = (unitIndex, chapterIndex, sectionIndex, paraIndex) => {
        const newUnits = [...subject.units];
        newUnits[unitIndex].chapters[chapterIndex].sections[sectionIndex].paragraphs.splice(paraIndex, 1);
        setSubject({ ...subject, units: newUnits });
    };

    // ─── QUIZ HANDLERS ──────────────────────────
    const updateQuestion = (qIdx, field, value) => {
        setQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, [field]: value } : q));
    };

    const updateOption = (qIdx, oIdx, value) => {
        setQuestions(prev => prev.map((q, i) => {
            if (i !== qIdx) return q;
            const newOpts = [...q.options];
            newOpts[oIdx] = value;
            return { ...q, options: newOpts };
        }));
    };

    const handleSubmitQuiz = async (e) => {
        e.preventDefault();
        if (!quizTitle.trim()) return alert('Please enter a quiz title.');
        for (let i = 0; i < questions.length; i++) {
            if (!questions[i].questionText.trim()) return alert(`Question ${i + 1} is empty.`);
            for (let j = 0; j < questions[i].options.length; j++) {
                if (!questions[i].options[j].trim()) return alert(`Option ${j + 1} of Question ${i + 1} is empty.`);
            }
        }
        setSubmittingQuiz(true);
        try {
            if (editingQuizId) {
                await api.put(`/quizzes/${editingQuizId}`, { title: quizTitle, questions });
                alert('Quiz updated successfully!');
            } else {
                await api.post('/quizzes', { subjectId: id, title: quizTitle, questions });
                alert('Quiz created successfully!');
            }
            resetForm();
            const { data } = await api.get(`/quizzes/subject/${id}`);
            setQuizzes(data);
        } catch (error) {
            console.error('Error saving quiz', error);
            alert(error.response?.data?.message || 'Failed to save quiz.');
        } finally {
            setSubmittingQuiz(false);
        }
    };

    const resetForm = () => {
        setEditingQuizId(null);
        setQuizTitle('');
        setNumQuestions(3);
        setNumOptions(3);
        setQuestions(Array.from({ length: 3 }, () => ({ questionText: '', options: ['', '', ''], correctOptionIndex: 0 })));
    };

    const startEditQuiz = (quiz) => {
        setEditingQuizId(quiz._id || quiz.id);
        setQuizTitle(quiz.title);
        const qs = quiz.questions || [];
        setNumQuestions(qs.length);
        setNumOptions(qs[0]?.options?.length || 3);
        setQuestions(qs.map(q => ({ questionText: q.questionText, options: [...q.options], correctOptionIndex: q.correctOptionIndex || 0 })));
        // Scroll to form
        setTimeout(() => document.getElementById('quiz-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleDeleteQuiz = async (quizId) => {
        if (!confirm('Are you sure you want to delete this quiz? This cannot be undone.')) return;
        try {
            await api.delete(`/quizzes/${quizId}`);
            setQuizzes(prev => prev.filter(q => (q._id || q.id) !== quizId));
            if (editingQuizId === quizId) resetForm();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete quiz.');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading editor...</div>;
    if (!subject) return <div className="p-8 text-center text-red-500">Subject not found.</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 pb-32">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md z-10 py-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Subject</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{subject.title}</p>
                    </div>
                </div>
                {activeTab === 'curriculum' && (
                    <button onClick={handleSave} disabled={saving} className="btn-primary gap-2">
                        <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                )}
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <button
                    onClick={() => setActiveTab('curriculum')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold transition-all duration-200 ${
                        activeTab === 'curriculum'
                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                    <BookOpen size={18} /> Curriculum ({subject.units?.length || 0} Units)
                </button>
                <button
                    onClick={() => setActiveTab('quizzes')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold transition-all duration-200 ${
                        activeTab === 'quizzes'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                    <FileQuestion size={18} /> Quizzes ({quizzes.length})
                </button>
            </div>

            {/* ─── CURRICULUM TAB ──────────────────────── */}
            {activeTab === 'curriculum' && (
                <div className="space-y-6">
                    {subject.units.map((unit, uIdx) => (
                        <div key={uIdx} className="card p-6 border border-primary-200 dark:border-primary-900/50">
                            <div className="flex items-center justify-between mb-4">
                                <input type="text" value={unit.title}
                                    onChange={(e) => { const u = [...subject.units]; u[uIdx].title = e.target.value; setSubject({ ...subject, units: u }); }}
                                    className="text-xl font-bold text-primary-700 dark:text-primary-400 bg-transparent edit-focus-ring border-none focus:ring-0 w-full"
                                    placeholder="Unit Title" />
                            </div>
                            <div className="space-y-4 pl-4 border-l-2 border-slate-200 dark:border-slate-700 ml-2">
                                {unit.chapters.map((chapter, cIdx) => (
                                    <div key={cIdx} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                        <input type="text" value={chapter.title}
                                            onChange={(e) => { const u = [...subject.units]; u[uIdx].chapters[cIdx].title = e.target.value; setSubject({ ...subject, units: u }); }}
                                            className="text-lg font-semibold text-slate-800 dark:text-slate-200 bg-transparent w-full mb-3"
                                            placeholder="Chapter Title" />
                                        <div className="space-y-3 pl-4">
                                            {chapter.sections.map((section, sIdx) => (
                                                <div key={sIdx} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                                                    <input type="text" value={section.title}
                                                        onChange={(e) => updateSection(uIdx, cIdx, sIdx, 'title', e.target.value)}
                                                        className="font-semibold text-slate-900 dark:text-slate-100 bg-transparent w-full mb-4 pt-1"
                                                        placeholder="Section Title" />
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                                                <Video size={16} /> Embed Video URL
                                                            </label>
                                                            <input type="text" value={section.videoUrl || ''}
                                                                onChange={(e) => updateSection(uIdx, cIdx, sIdx, 'videoUrl', e.target.value)}
                                                                className="input-field text-sm py-2" placeholder="https://www.youtube.com/embed/..." />
                                                        </div>
                                                        <div>
                                                            <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                                                                <FileText size={16} /> Text Content Paragraphs
                                                            </label>
                                                            <div className="space-y-2">
                                                                {section.paragraphs.map((para, pIdx) => (
                                                                    <div key={pIdx} className="flex gap-2 items-start">
                                                                        <textarea value={para}
                                                                            onChange={(e) => updateParagraph(uIdx, cIdx, sIdx, pIdx, e.target.value)}
                                                                            className="input-field text-sm py-2 resize-y min-h-[60px]" placeholder="Enter text..." />
                                                                        <button onClick={() => removeParagraph(uIdx, cIdx, sIdx, pIdx)}
                                                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors mt-1">
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <button onClick={() => addParagraph(uIdx, cIdx, sIdx)}
                                                                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium flex items-center gap-1">
                                                                    <Plus size={14} /> Add Paragraph
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={() => addSection(uIdx, cIdx)}
                                                className="btn-secondary text-sm py-2 px-4 shadow-none w-full border-dashed">
                                                <Plus size={16} className="mr-2" /> Add Section
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => addChapter(uIdx)}
                                    className="btn-secondary text-sm py-2 px-4 shadow-none border-dashed text-primary-600 border-primary-200 mt-2">
                                    <Plus size={16} className="mr-2" /> Add Chapter
                                </button>
                            </div>
                        </div>
                    ))}
                    <button onClick={addUnit}
                        className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-colors flex items-center justify-center gap-2">
                        <Plus size={20} /> Add New Unit
                    </button>
                </div>
            )}

            {/* ─── QUIZZES TAB ──────────────────────── */}
            {activeTab === 'quizzes' && (
                <div className="space-y-8">
                    {/* Existing Quizzes */}
                    {quizzes.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Existing Quizzes</h3>
                            {quizzes.map((quiz, qIdx) => (
                                <div key={quiz._id || qIdx} className={`flex items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-2xl border shadow-sm transition-all ${
                                    editingQuizId === (quiz._id || quiz.id) ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-100 dark:border-slate-700'
                                }`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-500/20">
                                            Q{qIdx + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white">{quiz.title}</p>
                                            <p className="text-xs text-slate-400">{quiz.questions?.length || 0} Questions • MCQ</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => startEditQuiz(quiz)} type="button"
                                            className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors" title="Edit">
                                            <Pencil size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteQuiz(quiz._id || quiz.id)} type="button"
                                            className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Create / Edit Quiz Form */}
                    <form onSubmit={handleSubmitQuiz} id="quiz-form" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                                {editingQuizId ? '✏️ Editing Quiz' : 'Create New Quiz'}
                            </h3>
                            {editingQuizId && (
                                <button type="button" onClick={resetForm}
                                    className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 px-3 py-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                    <X size={14} /> Cancel Edit
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Quiz Title</label>
                                <input type="text" required value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)}
                                    className="input-field" placeholder="e.g. Unit 1 Assessment" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">No. of Questions</label>
                                <input type="number" min={1} max={50} value={numQuestions}
                                    onChange={(e) => handleNumQuestionsChange(Number(e.target.value))}
                                    className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Options per Question</label>
                                <input type="number" min={2} max={8} value={numOptions}
                                    onChange={(e) => handleNumOptionsChange(Number(e.target.value))}
                                    className="input-field" />
                            </div>
                        </div>

                        {questions.map((q, qIdx) => (
                            <div key={qIdx} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-indigo-500/20">
                                        {qIdx + 1}
                                    </span>
                                    <h4 className="font-bold text-slate-700 dark:text-slate-200">Question {qIdx + 1}</h4>
                                </div>
                                <input type="text" required value={q.questionText}
                                    onChange={(e) => updateQuestion(qIdx, 'questionText', e.target.value)}
                                    className="input-field font-medium" placeholder="Enter your question..." />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                                            q.correctOptionIndex === oIdx
                                                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                                                : 'border-slate-200 dark:border-slate-700'
                                        }`}>
                                            <input type="radio" name={`correct-${qIdx}`} checked={q.correctOptionIndex === oIdx}
                                                onChange={() => updateQuestion(qIdx, 'correctOptionIndex', oIdx)}
                                                className="accent-emerald-500 w-4 h-4" />
                                            <input type="text" required value={opt}
                                                onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                                className="flex-1 bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 outline-none"
                                                placeholder={`Option ${String.fromCharCode(65 + oIdx)}`} />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Select the radio button for the correct answer
                                </p>
                            </div>
                        ))}

                        <button type="submit" disabled={submittingQuiz}
                            className={`w-full py-4 text-white font-black text-sm rounded-2xl shadow-xl transition-all disabled:opacity-50 ${
                                editingQuizId
                                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-500/25'
                                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25'
                            }`}>
                            {submittingQuiz ? 'Saving...' : editingQuizId ? '✏️ Update Quiz' : '🎯 Create Quiz'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default SubjectEditor;
