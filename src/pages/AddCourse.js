var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebaseConfig';
import { CourseService } from '../firebase/src/firebaseServices';
import { BookOpen, Upload, DollarSign, Tag, FileText, User, Clock, Plus, X, Award, Link, Video, Image, File, Zap, Target, CheckCircle, ArrowLeft, Info, BarChart3, List } from 'lucide-react';
import './AddCourse.css';
// --- MODERN THEME COLORS (Original Blue/Indigo) ---
const PRIMARY_ACCENT = '#3a25ff'; // Vibrant Indigo/Blue
const GRADIENT_START = '#3a25ff';
const GRADIENT_END = '#5a4bff';
const LIGHT_BG = '#f7f8fa'; // Soft off-white page background
const CARD_BG = 'white';
const TEXT_COLOR = '#2d3748';
const BORDER_COLOR = '#e2e8f0';
const AddCourse = () => {
    const [user] = useAuthState(auth);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    // ⚠️ تم حذف حقل `lessons` من هنا
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        price: '',
        instructor: '',
        duration: '',
        difficulty: '',
        certificate: false,
        overview: '',
        requirements: '',
        whatYouLearn: '',
    });
    const [courseLinks, setCourseLinks] = useState([]);
    const [thumbnail, setThumbnail] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchUserData = () => __awaiter(void 0, void 0, void 0, function* () {
            if (user) {
                const { UserService } = yield import('../firebase/src/firebaseServices');
                const data = yield UserService.getUserData(user.uid);
                setUserData(data);
                setLoading(false);
            }
            else {
                setLoading(false);
                navigate('/signin');
            }
        });
        fetchUserData();
    }, [user, navigate]);
    // التحقق من الصلاحية بعد تحميل البيانات
    useEffect(() => {
        if (!loading && userData && userData.role !== 'teacher') {
            alert('ليس لديك صلاحية رفع كورسات. يجب أن تكون مُدرّسًا.');
            navigate('/courses');
        }
    }, [loading, userData, navigate]);
    const handleThumbnailChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setThumbnail(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [name]: value })));
    };
    const addCourseLink = () => {
        const newLink = {
            id: Date.now().toString(),
            title: '',
            url: '',
            type: 'video'
        };
        setCourseLinks(prev => [...prev, newLink]);
    };
    const removeCourseLink = (id) => {
        setCourseLinks(prev => prev.filter(link => link.id !== id));
    };
    const updateCourseLink = (id, field, value) => {
        setCourseLinks(prev => prev.map(link => link.id === id ? Object.assign(Object.assign({}, link), { [field]: value }) : link));
    };
    const handleSubmit = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        if (!user)
            return;
        setSubmitting(true);
        setError(null);
        try {
            yield CourseService.uploadCourse({
                title: formData.title,
                description: formData.description,
                category: formData.category,
                price: formData.price,
                instructor: formData.instructor,
                duration: formData.duration,
                lessons: courseLinks.length,
                difficulty: formData.difficulty,
                certificate: formData.certificate,
                overview: formData.overview,
                requirements: formData.requirements.split(',').map(req => req.trim()).filter(req => req),
                whatYouLearn: formData.whatYouLearn.split(',').map(item => item.trim()).filter(item => item),
                courseLinks: courseLinks,
                thumbnail: thumbnail || undefined,
            }, user.uid);
            console.log('🔥 Course created successfully!', {
                title: formData.title,
                category: formData.category,
                courseLinks: courseLinks.length
            });
            alert('Course created successfully! 🎉');
            navigate('/courses');
        }
        catch (err) {
            console.error(err);
            setError(err.message || 'An error occurred while creating the course.');
        }
        finally {
            setSubmitting(false);
        }
    });
    if (loading) {
        return (_jsxs("div", { style: {
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                background: `linear-gradient(135deg, ${LIGHT_BG} 0%, #ebedee 100%)`,
            }, children: [_jsxs("div", { style: {
                        background: CARD_BG,
                        borderRadius: "20px",
                        padding: "35px 45px",
                        textAlign: "center",
                        boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                        color: "#444",
                    }, children: [_jsx("div", { style: {
                                width: "48px",
                                height: "48px",
                                border: "3px solid rgba(0,0,0,0.08)",
                                borderTop: `3px solid ${PRIMARY_ACCENT}`,
                                borderRadius: "50%",
                                margin: "0 auto 18px",
                                animation: "spin 1.2s ease-in-out infinite",
                            } }), _jsx("h3", { style: { marginBottom: "6px", fontWeight: 600, color: "#333" }, children: "Loading..." }), _jsx("p", { style: { fontSize: "14px", color: "#777" }, children: "Please wait a moment \u2728" })] }), _jsx("style", { children: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        ` })] }));
    }
    return (_jsxs("div", { style: {
            minHeight: '100vh',
            background: LIGHT_BG, // Soft Off-White Background
            padding: '40px 20px', // Increased top/bottom padding
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }, children: [_jsxs("div", { style: {
                    maxWidth: '1200px', // Increased max width for more space
                    margin: '0 auto',
                    marginBottom: '30px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }, children: [_jsxs("button", { onClick: () => navigate('/courses'), style: {
                            // Modern Back Button Style (Blue Accent)
                            background: CARD_BG,
                            border: `1px solid ${BORDER_COLOR}`,
                            borderRadius: '12px',
                            padding: '10px 18px',
                            color: TEXT_COLOR,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '15px',
                            fontWeight: '600',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s ease'
                        }, onMouseEnter: (e) => {
                            e.currentTarget.style.boxShadow = `0 4px 15px ${PRIMARY_ACCENT}33`;
                            e.currentTarget.style.color = PRIMARY_ACCENT;
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }, onMouseLeave: (e) => {
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                            e.currentTarget.style.color = TEXT_COLOR;
                            e.currentTarget.style.transform = 'translateY(0)';
                        }, children: [_jsx(ArrowLeft, { size: 18 }), "Back to Courses"] }), _jsx("h1", { style: {
                            fontSize: '32px',
                            fontWeight: '700',
                            color: TEXT_COLOR,
                            textShadow: '0 1px 1px rgba(0,0,0,0.05)'
                        }, children: "\u2728 New Course Blueprint" })] }), error && (_jsx("div", { style: {
                    maxWidth: '1200px',
                    margin: '0 auto 20px',
                    background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    fontWeight: '500',
                    boxShadow: '0 4px 12px rgba(255,107,107,0.3)'
                }, children: error })), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { style: {
                            maxWidth: '1200px',
                            margin: '0 auto',
                            display: 'grid',
                            gridTemplateColumns: '2.5fr 1.5fr', // Left column wider than right
                            gap: '30px'
                        }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '30px' }, children: [_jsxs("div", { style: {
                                            background: CARD_BG,
                                            borderRadius: '24px',
                                            padding: '30px',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                            border: `1px solid ${BORDER_COLOR}`
                                        }, children: [_jsxs("h2", { style: { fontSize: '24px', fontWeight: '700', color: TEXT_COLOR, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx(Info, { size: 24, color: PRIMARY_ACCENT }), " Basic Course Information"] }), _jsxs("div", { style: { marginBottom: '25px' }, children: [_jsxs("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }, children: [_jsx(BookOpen, { size: 16, style: { marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT } }), "Course Title"] }), _jsx("input", { type: "text", name: "title", value: formData.title, onChange: handleChange, required: true, placeholder: "e.g., Learn React from Scratch", style: {
                                                            width: '100%',
                                                            padding: '12px 16px',
                                                            border: `1px solid ${BORDER_COLOR}`,
                                                            borderRadius: '10px',
                                                            fontSize: '15px',
                                                            outline: 'none',
                                                            transition: 'all 0.3s ease',
                                                            background: LIGHT_BG,
                                                            fontWeight: '500'
                                                        }, onFocus: (e) => {
                                                            e.currentTarget.style.borderColor = PRIMARY_ACCENT;
                                                            e.currentTarget.style.background = 'white';
                                                            e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`;
                                                        }, onBlur: (e) => {
                                                            e.currentTarget.style.borderColor = BORDER_COLOR;
                                                            e.currentTarget.style.background = LIGHT_BG;
                                                            e.currentTarget.style.boxShadow = 'none';
                                                        } })] }), _jsxs("div", { style: { marginBottom: '25px' }, children: [_jsxs("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }, children: [_jsx(FileText, { size: 16, style: { marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT } }), "Course Description"] }), _jsx("textarea", { name: "description", value: formData.description, onChange: handleChange, required: true, placeholder: "Describe your course in detail...", rows: 4, style: {
                                                            width: '100%',
                                                            padding: '12px 16px',
                                                            border: `1px solid ${BORDER_COLOR}`,
                                                            borderRadius: '10px',
                                                            fontSize: '15px',
                                                            outline: 'none',
                                                            resize: 'vertical',
                                                            transition: 'all 0.3s ease',
                                                            background: LIGHT_BG,
                                                            fontWeight: '500',
                                                            fontFamily: 'inherit'
                                                        }, onFocus: (e) => {
                                                            e.currentTarget.style.borderColor = PRIMARY_ACCENT;
                                                            e.currentTarget.style.background = 'white';
                                                            e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`;
                                                        }, onBlur: (e) => {
                                                            e.currentTarget.style.borderColor = BORDER_COLOR;
                                                            e.currentTarget.style.background = LIGHT_BG;
                                                            e.currentTarget.style.boxShadow = 'none';
                                                        } })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }, children: [_jsxs("div", { children: [_jsxs("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }, children: [_jsx(CheckCircle, { size: 16, style: { marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT } }), "What You'll Learn (Comma Separated)"] }), _jsx("textarea", { name: "whatYouLearn", value: formData.whatYouLearn, onChange: handleChange, placeholder: "Benefit 1, Benefit 2, etc.", rows: 3, style: { width: '100%', padding: '12px 16px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '10px', fontSize: '15px', outline: 'none', resize: 'vertical', transition: 'all 0.3s ease', background: LIGHT_BG, fontWeight: '500', fontFamily: 'inherit' }, onFocus: (e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`; }, onBlur: (e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = LIGHT_BG; e.currentTarget.style.boxShadow = 'none'; } })] }), _jsxs("div", { children: [_jsxs("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }, children: [_jsx(List, { size: 16, style: { marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT } }), "Requirements (Comma Separated)"] }), _jsx("textarea", { name: "requirements", value: formData.requirements, onChange: handleChange, placeholder: "Requirement 1, Requirement 2, etc.", rows: 3, style: { width: '100%', padding: '12px 16px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '10px', fontSize: '15px', outline: 'none', resize: 'vertical', transition: 'all 0.3s ease', background: LIGHT_BG, fontWeight: '500', fontFamily: 'inherit' }, onFocus: (e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`; }, onBlur: (e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = LIGHT_BG; e.currentTarget.style.boxShadow = 'none'; } })] })] })] }), _jsxs("div", { style: {
                                            background: CARD_BG,
                                            borderRadius: '24px',
                                            padding: '30px',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                            border: `1px solid ${BORDER_COLOR}`
                                        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }, children: [_jsxs("h2", { style: { fontSize: '24px', fontWeight: '700', color: TEXT_COLOR, display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx(Link, { size: 24, color: PRIMARY_ACCENT }), " Course Content Links"] }), _jsxs("button", { type: "button", onClick: addCourseLink, style: {
                                                            // Blue Gradient Add Link Button (Compact)
                                                            background: `linear-gradient(90deg, ${GRADIENT_START}, ${GRADIENT_END})`,
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '10px',
                                                            padding: '10px 18px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            transition: 'all 0.3s ease',
                                                            boxShadow: `0 4px 12px ${PRIMARY_ACCENT}33`
                                                        }, onMouseEnter: (e) => {
                                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                                            e.currentTarget.style.boxShadow = `0 8px 20px ${PRIMARY_ACCENT}55`;
                                                        }, onMouseLeave: (e) => {
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = `0 4px 12px ${PRIMARY_ACCENT}33`;
                                                        }, children: [_jsx(Plus, { size: 16 }), "Add Link"] })] }), courseLinks.length === 0 ? (_jsxs("div", { style: {
                                                    // Light Blue/Indigo Empty State
                                                    background: '#f0f4ff',
                                                    border: `2px dashed ${PRIMARY_ACCENT}66`,
                                                    borderRadius: '16px',
                                                    padding: '40px',
                                                    textAlign: 'center',
                                                    color: '#718096'
                                                }, children: [_jsx(Link, { size: 48, style: { marginBottom: '16px', opacity: 0.5, color: PRIMARY_ACCENT } }), _jsx("h3", { style: { marginBottom: '8px', color: TEXT_COLOR }, children: "No Links Added Yet" }), _jsx("p", { children: "Add course materials, videos, documents, and other resources" })] })) : (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: courseLinks.map((link, index) => (_jsxs("div", { style: {
                                                        background: LIGHT_BG, // Use LIGHT_BG for nested items for contrast
                                                        border: `1px solid ${BORDER_COLOR}`,
                                                        borderRadius: '16px',
                                                        padding: '20px',
                                                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                                        transition: 'all 0.3s ease',
                                                        position: 'relative'
                                                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [link.type === 'video' && _jsx(Video, { size: 20, color: PRIMARY_ACCENT }), link.type === 'document' && _jsx(File, { size: 20, color: PRIMARY_ACCENT }), link.type === 'image' && _jsx(Image, { size: 20, color: PRIMARY_ACCENT }), link.type === 'other' && _jsx(Link, { size: 20, color: PRIMARY_ACCENT }), _jsxs("span", { style: { fontWeight: '600', color: TEXT_COLOR }, children: ["Link #", index + 1] })] }), _jsx("button", { type: "button", onClick: () => removeCourseLink(link.id), style: {
                                                                        background: '#fed7d7',
                                                                        color: '#e53e3e',
                                                                        border: 'none',
                                                                        borderRadius: '50%',
                                                                        width: '32px',
                                                                        height: '32px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.3s ease'
                                                                    }, onMouseEnter: (e) => { e.currentTarget.style.background = '#feb2b2'; }, onMouseLeave: (e) => { e.currentTarget.style.background = '#fed7d7'; }, children: _jsx(X, { size: 16 }) })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '13px', color: '#4a5568' }, children: "Link Title" }), _jsx("input", { type: "text", value: link.title, onChange: (e) => updateCourseLink(link.id, 'title', e.target.value), placeholder: "e.g., Introduction Video", style: { width: '100%', padding: '10px 14px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'all 0.3s ease', background: CARD_BG }, onFocus: (e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; }, onBlur: (e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = CARD_BG; } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '13px', color: '#4a5568' }, children: "URL" }), _jsx("input", { type: "url", value: link.url, onChange: (e) => updateCourseLink(link.id, 'url', e.target.value), placeholder: "https://example.com", style: { width: '100%', padding: '10px 14px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'all 0.3s ease', background: CARD_BG }, onFocus: (e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; }, onBlur: (e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = CARD_BG; } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '13px', color: '#4a5568' }, children: "Type" }), _jsxs("select", { value: link.type, onChange: (e) => updateCourseLink(link.id, 'type', e.target.value), style: { width: '100%', padding: '10px 14px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'all 0.3s ease', background: CARD_BG, cursor: 'pointer' }, onFocus: (e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; }, onBlur: (e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = CARD_BG; }, children: [_jsx("option", { value: "video", children: "Video" }), _jsx("option", { value: "document", children: "Document" }), _jsx("option", { value: "image", children: "Image" }), _jsx("option", { value: "other", children: "Other" })] })] })] })] }, link.id))) }))] })] }), " ", _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '30px' }, children: [_jsxs("div", { style: {
                                            background: CARD_BG,
                                            borderRadius: '24px',
                                            padding: '30px',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                            border: `1px solid ${BORDER_COLOR}`
                                        }, children: [_jsxs("h2", { style: { fontSize: '24px', fontWeight: '700', color: TEXT_COLOR, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx(BarChart3, { size: 24, color: PRIMARY_ACCENT }), " Course Metrics"] }), _jsxs("div", { style: { marginBottom: '25px' }, children: [_jsxs("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }, children: [_jsx(Tag, { size: 16, style: { marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT } }), "Category"] }), _jsxs("select", { name: "category", value: formData.category, onChange: handleChange, required: true, style: { width: '100%', padding: '12px 16px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '10px', fontSize: '15px', outline: 'none', transition: 'all 0.3s ease', background: LIGHT_BG, fontWeight: '500', cursor: 'pointer' }, onFocus: (e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`; }, onBlur: (e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = LIGHT_BG; e.currentTarget.style.boxShadow = 'none'; }, children: [_jsx("option", { value: "", children: "Choose Category" }), _jsx("option", { value: "programming", children: "Programming" }), _jsx("option", { value: "design", children: "Design" }), _jsx("option", { value: "marketing", children: "Marketing" }), _jsx("option", { value: "business", children: "Business" }), _jsx("option", { value: "languages", children: "Languages" }), _jsx("option", { value: "data-science", children: "Data Science" }), _jsx("option", { value: "web-development", children: "Web Development" }), _jsx("option", { value: "mobile-development", children: "Mobile Development" }), _jsx("option", { value: "ai-ml", children: "AI & Machine Learning" }), _jsx("option", { value: "cybersecurity", children: "Cybersecurity" })] })] }), _jsxs("div", { style: { marginBottom: '25px' }, children: [_jsxs("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }, children: [_jsx(Target, { size: 16, style: { marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT } }), "Difficulty Level"] }), _jsxs("select", { name: "difficulty", value: formData.difficulty, onChange: handleChange, required: true, style: { width: '100%', padding: '12px 16px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '10px', fontSize: '15px', outline: 'none', transition: 'all 0.3s ease', background: LIGHT_BG, fontWeight: '500', cursor: 'pointer' }, onFocus: (e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`; }, onBlur: (e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = LIGHT_BG; e.currentTarget.style.boxShadow = 'none'; }, children: [_jsx("option", { value: "", children: "Choose Difficulty Level" }), _jsx("option", { value: "Beginner", children: "Beginner" }), _jsx("option", { value: "Intermediate", children: "Intermediate" }), _jsx("option", { value: "Advanced", children: "Advanced" }), _jsx("option", { value: "Beginner to Advanced", children: "Beginner to Advanced" })] })] }), _jsxs("div", { style: { marginBottom: '25px' }, children: [_jsxs("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }, children: [_jsx(Clock, { size: 16, style: { marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT } }), "Course Duration"] }), _jsx("input", { type: "text", name: "duration", value: formData.duration, onChange: handleChange, required: true, placeholder: "e.g., 1 hour, 32 hours", style: { width: '100%', padding: '12px 16px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '10px', fontSize: '15px', outline: 'none', transition: 'all 0.3s ease', background: LIGHT_BG, fontWeight: '500' }, onFocus: (e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`; }, onBlur: (e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = LIGHT_BG; e.currentTarget.style.boxShadow = 'none'; } })] }), _jsxs("div", { style: { marginBottom: '0' }, children: [_jsxs("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }, children: [_jsx(User, { size: 16, style: { marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT } }), "Instructor Name"] }), _jsx("input", { type: "text", name: "instructor", value: formData.instructor, onChange: handleChange, required: true, placeholder: "e.g., John Smith", style: { width: '100%', padding: '12px 16px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '10px', fontSize: '15px', outline: 'none', transition: 'all 0.3s ease', background: LIGHT_BG, fontWeight: '500' }, onFocus: (e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`; }, onBlur: (e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = LIGHT_BG; e.currentTarget.style.boxShadow = 'none'; } })] })] }), _jsxs("div", { style: {
                                            background: CARD_BG,
                                            borderRadius: '24px',
                                            padding: '30px',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                            border: `1px solid ${BORDER_COLOR}`
                                        }, children: [_jsxs("h2", { style: { fontSize: '24px', fontWeight: '700', color: TEXT_COLOR, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx(DollarSign, { size: 24, color: PRIMARY_ACCENT }), " Pricing & Options"] }), _jsxs("div", { style: { marginBottom: '25px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }, children: "Price (USD)" }), _jsx("input", { type: "text", name: "price", value: formData.price, onChange: handleChange, required: true, placeholder: "e.g., 49.99 or Free", style: { width: '100%', padding: '12px 16px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '10px', fontSize: '15px', outline: 'none', transition: 'all 0.3s ease', background: LIGHT_BG, fontWeight: '500' }, onFocus: (e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`; }, onBlur: (e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = LIGHT_BG; e.currentTarget.style.boxShadow = 'none'; } })] }), _jsx("div", { style: { marginBottom: '0' }, children: _jsxs("label", { style: {
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        fontWeight: '600',
                                                        fontSize: '15px',
                                                        color: TEXT_COLOR,
                                                        cursor: 'pointer',
                                                        padding: '16px 20px',
                                                        background: LIGHT_BG,
                                                        borderRadius: '12px',
                                                        border: `1px solid ${BORDER_COLOR}`,
                                                        transition: 'all 0.3s ease'
                                                    }, onMouseEnter: (e) => {
                                                        e.currentTarget.style.background = '#f0f4ff'; // Light blue hover
                                                        e.currentTarget.style.borderColor = PRIMARY_ACCENT;
                                                        e.currentTarget.style.boxShadow = `0 2px 10px ${PRIMARY_ACCENT}22`;
                                                    }, onMouseLeave: (e) => {
                                                        e.currentTarget.style.background = LIGHT_BG;
                                                        e.currentTarget.style.borderColor = BORDER_COLOR;
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }, children: [_jsx("input", { type: "checkbox", name: "certificate", checked: formData.certificate, onChange: (e) => setFormData(prev => (Object.assign(Object.assign({}, prev), { certificate: e.target.checked }))), style: {
                                                                transform: 'scale(1.3)',
                                                                accentColor: PRIMARY_ACCENT
                                                            } }), _jsx(Award, { size: 20, color: PRIMARY_ACCENT }), "Course includes a **Certificate of Completion**"] }) })] })] }), " ", _jsxs("div", { style: {
                                    gridColumn: '1 / -1', // Span across both columns
                                    background: CARD_BG,
                                    borderRadius: '24px',
                                    padding: '30px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                    border: `1px solid ${BORDER_COLOR}`
                                }, children: [_jsxs("h2", { style: { fontSize: '24px', fontWeight: '700', color: TEXT_COLOR, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx(Image, { size: 24, color: PRIMARY_ACCENT }), " Course Thumbnail"] }), _jsx("input", { type: "file", id: "thumbnail-upload", accept: "image/*", onChange: handleThumbnailChange, style: { display: 'none' } }), _jsxs("label", { htmlFor: "thumbnail-upload", style: {
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '200px',
                                            border: `2px dashed ${BORDER_COLOR}`,
                                            borderRadius: '16px',
                                            cursor: 'pointer',
                                            background: previewUrl ? `url(${previewUrl}) center/cover no-repeat` : LIGHT_BG,
                                            color: previewUrl ? 'transparent' : TEXT_COLOR,
                                            transition: 'all 0.3s ease',
                                            textAlign: 'center',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }, onMouseEnter: (e) => {
                                            if (!previewUrl)
                                                e.currentTarget.style.borderColor = PRIMARY_ACCENT;
                                        }, onMouseLeave: (e) => {
                                            if (!previewUrl)
                                                e.currentTarget.style.borderColor = BORDER_COLOR;
                                        }, children: [!previewUrl && (_jsxs(_Fragment, { children: [_jsx(Upload, { size: 32, style: { marginBottom: '10px', color: PRIMARY_ACCENT } }), _jsx("span", { style: { fontWeight: '600', fontSize: '16px', color: TEXT_COLOR }, children: "Click to upload thumbnail" }), _jsx("span", { style: { fontSize: '14px', color: '#718096' }, children: "Recommended size: 1280x720. Max 5MB." })] })), previewUrl && (_jsxs("div", { style: {
                                                    position: 'absolute',
                                                    top: 0, left: 0, right: 0, bottom: 0,
                                                    background: 'rgba(0, 0, 0, 0.4)', // Dark overlay for text visibility
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: '600',
                                                    fontSize: '18px',
                                                    opacity: 0,
                                                    transition: 'opacity 0.3s ease'
                                                }, children: [_jsx(Image, { size: 32, style: { marginRight: '10px' } }), "Change Thumbnail"] }))] })] })] }), " ", _jsxs("div", { style: { marginTop: '50px', textAlign: 'center' }, children: [_jsx("button", { type: "submit", disabled: submitting, style: {
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    background: `linear-gradient(90deg, ${GRADIENT_START} 0%, ${GRADIENT_END} 100%)`,
                                    color: 'white',
                                    border: 'none',
                                    padding: '16px 40px',
                                    borderRadius: '16px',
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    opacity: submitting ? 0.7 : 1,
                                    transition: 'all 0.3s ease',
                                    boxShadow: `0 8px 20px ${PRIMARY_ACCENT}44`,
                                    minWidth: '320px', // Increased width
                                }, onMouseEnter: (e) => {
                                    if (!submitting) {
                                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
                                        e.currentTarget.style.boxShadow = `0 12px 25px ${PRIMARY_ACCENT}66`;
                                    }
                                }, onMouseLeave: (e) => {
                                    if (!submitting) {
                                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                        e.currentTarget.style.boxShadow = `0 8px 20px ${PRIMARY_ACCENT}44`;
                                    }
                                }, children: submitting ? (_jsxs(_Fragment, { children: [_jsx(Zap, { size: 20, className: "spin-animation" }), "Submitting..."] })) : (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { size: 20 }), "Publish Course"] })) }), _jsx("style", { children: `
              @keyframes spin-submit {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .spin-animation {
                animation: spin-submit 1s linear infinite;
              }
            ` })] })] })] }));
};
export default AddCourse;
