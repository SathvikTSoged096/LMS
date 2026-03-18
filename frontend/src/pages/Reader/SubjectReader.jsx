import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ChevronLeft, ChevronRight, Book, ArrowLeft, MessageSquare, Menu, X } from 'lucide-react';
import MathJaxRenderer from '../../components/renderers/MathJaxRenderer';
import SpiceRenderer from '../../components/renderers/SpiceRenderer';
import AiChatbox from '../../components/chat/AiChatbox';
import ChatBot from '../../components/ChatBot';

// Converts any YouTube URL format to the embed URL required by iframes
const toEmbedUrl = (url) => {
    if (!url) return '';
    try {
        // Already an embed URL
        if (url.includes('youtube.com/embed/')) return url;
        // youtu.be/VIDEO_ID
        const shortMatch = url.match(/youtu\.be\/([\w-]+)/);
        if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
        // youtube.com/watch?v=VIDEO_ID
        const watchMatch = url.match(/[?&]v=([\w-]+)/);
        if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
        // youtube.com/shorts/VIDEO_ID
        const shortsMatch = url.match(/\/shorts\/([\w-]+)/);
        if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
        // Fallback: return as-is
        return url;
    } catch { return url; }
};

const SubjectReader = () => {
    const { id } = useParams(); // Subject ID
    const navigate = useNavigate();
    const [subject, setSubject] = useState(null);
    const [enrollment, setEnrollment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showChat, setShowChat] = useState(false);
    const [showMobileNav, setShowMobileNav] = useState(false);

    // Reading position state
    const [currentUnitIdx, setCurrentUnitIdx] = useState(0);
    const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
    const [currentSectionIdx, setCurrentSectionIdx] = useState(0);

    useEffect(() => {
        fetchSubjectAndProgress();
    }, [id]);

    const fetchSubjectAndProgress = async () => {
        try {
            const [subRes, enrollRes] = await Promise.all([
                api.get(`/subjects/${id}`),
                api.get('/enrollments/me')
            ]);

            setSubject(subRes.data);

            // Find current enrollment
            const currentEnrollment = enrollRes.data.find(e => e.subjectId._id === id || e.subjectId === id);
            if (currentEnrollment) {
                setEnrollment(currentEnrollment);

                // Restore progress
                const pointer = currentEnrollment.progressPointer;
                // In this MVP, we assume units/chapters/sections are array indices for simplicity
                // In a full prod version we would match by actual unit/chapter IDs
                setCurrentUnitIdx(pointer.unit || 0);
                setCurrentChapterIdx(pointer.chapter || 0);
                setCurrentSectionIdx(pointer.section || 0);
            }
        } catch (error) {
            console.error('Failed to load reader', error);
            alert('Error loading content.');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const saveProgress = async (uIdx, cIdx, sIdx) => {
        try {
            // Calculate simple percentage based on total sections in the whole subject
            // For MVP we just save the pointer
            await api.put(`/enrollments/${id}/progress`, {
                unit: uIdx,
                chapter: cIdx,
                section: sIdx,
                // Mock percentage increment for MVP visual sake
                percentageCompleted: Math.min(100, Math.round(((uIdx + 1) * 33)))
            });
        } catch (error) {
            console.error('Failed to save progress', error);
        }
    };

    const navigateContent = (direction) => {
        if (!subject || !subject.units || subject.units.length === 0) return;

        let u = currentUnitIdx, c = currentChapterIdx, s = currentSectionIdx;
        const currentUnit = subject.units[u];
        const currentChapter = currentUnit?.chapters?.[c];

        if (direction === 'next') {
            if (s + 1 < currentChapter?.sections?.length) {
                s++;
            } else if (c + 1 < currentUnit?.chapters?.length) {
                c++; s = 0;
            } else if (u + 1 < subject.units.length) {
                u++; c = 0; s = 0;
            } else {
                alert("You have reached the end of the subject!");
                return;
            }
        } else {
            if (s > 0) {
                s--;
            } else if (c > 0) {
                c--;
                s = subject.units[u].chapters[c].sections.length - 1;
            } else if (u > 0) {
                u--;
                c = subject.units[u].chapters.length - 1;
                s = subject.units[u].chapters[c].sections.length - 1;
            } else {
                return; // At the very beginning
            }
        }

        setCurrentUnitIdx(u);
        setCurrentChapterIdx(c);
        setCurrentSectionIdx(s);
        saveProgress(u, c, s);
        window.scrollTo(0, 0);
    };

    if (loading) return <div className="min-h-screen pt-20 text-center text-slate-500">Loading textbook content...</div>;
    if (!subject) return <div className="text-center mt-20">Subject not found.</div>;

    const currentUnit = subject.units?.[currentUnitIdx];
    const currentChapter = currentUnit?.chapters?.[currentChapterIdx];
    const currentSection = currentChapter?.sections?.[currentSectionIdx];

    const hasContent = subject.units && subject.units.length > 0;

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 mb-4 sticky top-0 bg-white/90 backdrop-blur-md z-20">
                <button onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-primary-600 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="font-bold text-slate-900 truncate" title={subject.title}>
                    {subject.title}
                </h2>
                <button onClick={() => setShowMobileNav(false)} className="md:hidden ml-auto text-slate-400">
                    <X size={20} />
                </button>
            </div>

            <div className="px-3 pb-8 flex-1 overflow-y-auto">
                {hasContent ? subject.units.map((unit, uIdx) => (
                    <div key={uIdx} className="mb-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                            Unit {unit.unitNumber || uIdx + 1}: {unit.title}
                        </h4>
                        {unit.chapters?.map((chapter, cIdx) => (
                            <div key={cIdx} className="mb-2">
                                <h5 className="text-sm font-semibold text-slate-700 px-2 py-1 flex items-center gap-2">
                                    <Book size={14} className="text-primary-400" /> Chapter {chapter.chapterNumber || cIdx + 1}
                                </h5>
                                <div className="pl-6 space-y-1 mt-1">
                                    {chapter.sections?.map((section, sIdx) => {
                                        const isActive = uIdx === currentUnitIdx && cIdx === currentChapterIdx && sIdx === currentSectionIdx;
                                        return (
                                            <button
                                                key={sIdx}
                                                onClick={() => {
                                                    setCurrentUnitIdx(uIdx);
                                                    setCurrentChapterIdx(cIdx);
                                                    setCurrentSectionIdx(sIdx);
                                                    saveProgress(uIdx, cIdx, sIdx);
                                                    setShowMobileNav(false);
                                                }}
                                                className={`w-full text-left text-sm py-2 px-3 rounded-lg transition-all duration-200 ${isActive
                                                    ? 'bg-gradient-to-r from-primary-50 to-white text-primary-700 font-bold border-l-4 border-primary-500 shadow-sm'
                                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                                    }`}
                                            >
                                                {section.sectionNumber || sIdx + 1}. {section.title}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )) : (
                    <div className="text-sm text-slate-500 p-4 text-center">No content has been added to this subject yet.</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-slate-50 relative overflow-hidden animate-fade-in">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-100/40 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>

            {/* Sidebar Navigation - Desktop */}
            <div className="w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/50 overflow-hidden hidden md:block z-10 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                <SidebarContent />
            </div>

            {/* Mobile Drawer Overlay */}
            {showMobileNav && (
                <div className="fixed inset-0 z-[100] md:hidden">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowMobileNav(false)}></div>
                    <div className="absolute top-0 left-0 w-80 h-full bg-white shadow-2xl animate-slide-in-left">
                        <SidebarContent />
                    </div>
                </div>
            )}

            {/* Main Reading Area */}
            <div className="flex-1 flex flex-col relative overflow-y-auto scroll-smooth">
                {hasContent ? (
                    <>
                        <div className="px-4 py-8 sm:py-10 md:px-16 lg:px-24">
                            <div className="max-w-3xl mx-auto">
                                <div className="mb-10 lg:mb-14 animate-fade-in-up text-center relative">
                                    {/* Mobile Menu Toggle */}
                                    <button
                                        onClick={() => setShowMobileNav(true)}
                                        className="md:hidden absolute left-0 top-0 p-2 text-slate-500 hover:text-primary-600 transition-colors"
                                    >
                                        <Menu size={24} />
                                    </button>

                                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] lg:text-xs font-bold uppercase tracking-widest bg-slate-900 text-white shadow-xl shadow-slate-900/20 mb-4 lg:mb-6">
                                        Unit {currentUnit?.unitNumber || currentUnitIdx + 1} • Chapter {currentChapter?.chapterNumber || currentChapterIdx + 1}
                                    </span>
                                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-tight tracking-tighter drop-shadow-sm">
                                        {currentSection?.title || 'Untitled Section'}
                                    </h1>
                                    <div className="w-16 lg:w-24 h-1 lg:h-1.5 bg-gradient-to-r from-primary-500 to-indigo-500 mx-auto mt-6 lg:mt-8 rounded-full"></div>
                                </div>

                                <div className="prose prose-slate prose-xl max-w-none text-slate-700 leading-[2.2] font-medium">
                                    {currentSection?.videoUrl && (
                                        <div className="mb-12 mt-8 animate-fade-in">
                                            <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200/60 bg-white">
                                                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-white">
                                                    <div className="flex gap-1.5">
                                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                                        <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-2">Video Lesson</span>
                                                </div>
                                                {/* Padding-bottom aspect ratio — no z-index stacking, iframe fully interactive */}
                                                <div className="bg-slate-900" style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                                                    <iframe
                                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                                        src={toEmbedUrl(currentSection.videoUrl)}
                                                        title="Course Video"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        allowFullScreen
                                                    ></iframe>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {currentSection?.paragraphs?.map((para, i) => {
                                        if (para.trim().startsWith('[SPICE]')) {
                                            return <SpiceRenderer key={i} content={para.replace('[SPICE]', '').trim()} />;
                                        }
                                        if (para.trim().startsWith('[IMG]')) {
                                            const imgUrl = para.replace('[IMG]', '').trim();
                                            return (
                                                <div key={i} className="my-16 animate-fade-in-up group cursor-zoom-in">
                                                    <div className="relative rounded-[2rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] transition-all duration-700 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]">
                                                        <img
                                                            src={imgUrl}
                                                            alt="Educational Concept"
                                                            className="w-full h-auto object-cover max-h-[600px] transition-transform duration-700 group-hover:scale-105"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (para.trim().startsWith('[PDF]')) {
                                            const pdfPath = para.replace('[PDF]', '').trim();
                                            const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
                                            const fullPdfUrl = `${baseUrl}${pdfPath}`;
                                            return (
                                                <div key={i} className="my-12 animate-fade-in-up">
                                                    <div className="flex flex-col rounded-[2rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] bg-slate-100 border border-slate-200">
                                                        <div className="flex justify-between items-center bg-slate-900 text-white px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                                                                    <Book size={16} />
                                                                </div>
                                                                <span className="font-bold tracking-widest uppercase text-xs">PDF Document</span>
                                                            </div>
                                                            <a href={fullPdfUrl} download target="_blank" rel="noopener noreferrer" className="bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/30">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                                                Download
                                                            </a>
                                                        </div>
                                                        <iframe src={fullPdfUrl} className="w-full h-[700px] border-none bg-slate-50" title="PDF Document" />
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div key={i} className="mb-8">
                                                <MathJaxRenderer content={para} />
                                            </div>
                                        );
                                    })}

                                    {(!currentSection?.paragraphs || currentSection.paragraphs.length === 0) && (
                                        <p className="italic text-slate-400">Content for this section is being prepared...</p>
                                    )}
                                </div>

                                <hr className="my-10 border-slate-200" />

                                {/* Navigation Controls */}
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-20 pt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                    <button
                                        onClick={() => navigateContent('prev')}
                                        disabled={currentUnitIdx === 0 && currentChapterIdx === 0 && currentSectionIdx === 0}
                                        className="w-full sm:w-auto btn-secondary gap-2 px-6 py-3 text-slate-600 hover:text-primary-700 shadow-sm"
                                    >
                                        <ChevronLeft size={20} /> Previous
                                    </button>
                                    <button
                                        onClick={() => navigateContent('next')}
                                        className="w-full sm:w-auto btn-primary gap-2 px-8 py-3 rounded-xl shadow-lg shadow-primary-500/30"
                                    >
                                        Next <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Floating AI Chat Button */}
                        <button
                            className="fixed bottom-6 right-6 lg:right-10 w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-full shadow-xl shadow-slate-900/30 flex items-center justify-center hover:scale-110 hover:-translate-y-1 transition-all duration-300 tooltip z-20"
                            title="Ask Subject AI"
                            onClick={() => setShowChat(!showChat)}
                        >
                            <MessageSquare size={26} className="drop-shadow-sm" />
                        </button>

                        {showChat && (
                            <AiChatbox
                                contextText={currentSection?.paragraphs?.join('\n') || ''}
                                subjectId={subject._id}
                                onClose={() => setShowChat(false)}
                            />
                        )}

                        {/* RAG Chatbot */}
                        <div className="px-4 sm:px-16 lg:px-24 pb-10">
                            <div className="max-w-3xl mx-auto">
                                <ChatBot subjectId={subject._id} />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                            <Book size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Empty Subject</h3>
                        <p className="text-slate-500 max-w-sm">The instructor has not added any units or chapters to this subject yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubjectReader;
