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
import { ExercisesService, UserService } from '../firebase/src/firebaseServices';
import { Clock, Plus, X, Star, Target, CheckCircle, ArrowLeft, BarChart3, List, HelpCircle, Hash, Gauge, Edit3, MessageSquare } from 'lucide-react';
import './AddCourse.css'; // Assuming this is where custom styles/animations live
// --- MODERN THEME COLORS (Original Blue/Indigo) ---
const PRIMARY_ACCENT = '#3a25ff'; // Vibrant Indigo/Blue
const GRADIENT_START = '#3a25ff';
const GRADIENT_END = '#5a4bff';
const LIGHT_BG = '#f7f8fa'; // Soft off-white page background
const CARD_BG = 'white';
const TEXT_COLOR = '#2d3748';
const BORDER_COLOR = '#e2e8f0';
const AddExercise = () => {
    const [user] = useAuthState(auth);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        id: 0,
        title: '',
        difficulty: '',
        duration: '',
        points: 0,
        completed: false,
        questions: [
            { question: '', correctAnswer: '', options: ['', '', '', ''] }
        ],
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    // --- Initialization and Authorization Effects ---
    useEffect(() => {
        const fetchUserData = () => __awaiter(void 0, void 0, void 0, function* () {
            if (user) {
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
    useEffect(() => {
        if (!loading && userData && userData.role !== 'teacher') {
            alert('ليس لديك صلاحية رفع كورسات. يجب أن تكون مُدرّسًا.');
            navigate('/courses');
        }
    }, [loading, userData, navigate]);
    // --- Handlers for Questions and Options ---
    // Add a new question
    const addQuestion = () => {
        setFormData(prev => (Object.assign(Object.assign({}, prev), { questions: [
                ...prev.questions,
                { question: '', options: ['', '', '', ''], correctAnswer: '' }
            ] })));
    };
    // Remove a question
    const removeQuestion = (qIndex) => {
        if (formData.questions.length > 1) {
            setFormData(prev => (Object.assign(Object.assign({}, prev), { questions: prev.questions.filter((_, index) => index !== qIndex) })));
        }
        else {
            alert("You must have at least one question.");
        }
    };
    // Handle question text change
    const handleQuestionChange = (qIndex, value) => {
        const updated = [...formData.questions];
        updated[qIndex].question = value;
        setFormData(Object.assign(Object.assign({}, formData), { questions: updated }));
    };
    // Handle option change
    const handleOptionChange = (qIndex, optIndex, value) => {
        const updated = [...formData.questions];
        updated[qIndex].options[optIndex] = value;
        setFormData(Object.assign(Object.assign({}, formData), { questions: updated }));
    };
    // Handle correct answer change
    const handleCorrectAnswerChange = (qIndex, value) => {
        const updated = [...formData.questions];
        updated[qIndex].correctAnswer = value;
        setFormData(Object.assign(Object.assign({}, formData), { questions: updated }));
    };
    // --- General Form Handler ---
    const handleChange = (e) => {
        const target = e.target;
        const { name } = target;
        let value;
        if (target.type === 'checkbox') {
            value = target.checked;
        }
        else if (target.type === 'number') {
            const num = target.value;
            value = num === '' ? '' : Number(num);
        }
        else {
            value = target.value;
        }
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [name]: value })));
    };
    // --- Submission Handler ---
    const handleSubmit = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        if (!user)
            return;
        setSubmitting(true);
        setError(null);
        try {
            yield ExercisesService.uploadExercises(formData, // Use the complete formData object
            user.uid);
            console.log('🔥 Exercise created successfully!', {
                title: formData.title,
                difficulty: formData.difficulty
            });
            alert('Exercise created successfully! 🎉');
            navigate('/exercises'); // Navigate to the exercises list
        }
        catch (err) {
            console.error(err);
            setError(err.message || 'An error occurred while creating the exercise.');
        }
        finally {
            setSubmitting(false);
        }
    });
    // --- Loading State Render ---
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
    // --- Main Component Render (Modern Page) ---
    return (_jsxs("div", { style: {
            minHeight: '100vh',
            background: LIGHT_BG,
            padding: '40px 20px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }, children: [_jsxs("div", { style: {
                    maxWidth: '1200px',
                    margin: '0 auto',
                    marginBottom: '30px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }, children: [_jsxs("button", { onClick: () => navigate('/exercises'), style: {
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
                        }, children: [_jsx(ArrowLeft, { size: 18 }), "Back to Exercises"] }), _jsx("h1", { style: {
                            fontSize: '32px',
                            fontWeight: '700',
                            color: TEXT_COLOR,
                            textShadow: '0 1px 1px rgba(0,0,0,0.05)'
                        }, children: "\uD83D\uDCDD New Exercise Builder" })] }), error && (_jsx("div", { style: {
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
                            gridTemplateColumns: '2.5fr 1.5fr', // Left column for Questions, Right for Metadata
                            gap: '30px'
                        }, children: [_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '30px' }, children: _jsxs("div", { style: {
                                        background: CARD_BG,
                                        borderRadius: '24px',
                                        padding: '30px',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                        border: `1px solid ${BORDER_COLOR}`
                                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }, children: [_jsxs("h2", { style: { fontSize: '24px', fontWeight: '700', color: TEXT_COLOR, display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx(HelpCircle, { size: 24, color: PRIMARY_ACCENT }), " Multiple Choice Questions"] }), _jsxs("button", { type: "button", onClick: addQuestion, style: {
                                                        // Blue Gradient Add Question Button (Compact)
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
                                                    }, children: [_jsx(Plus, { size: 16 }), "Add Question"] })] }), formData.questions.map((q, qIndex) => (_jsxs("div", { style: {
                                                background: LIGHT_BG,
                                                border: `1px solid ${BORDER_COLOR}`,
                                                borderRadius: '16px',
                                                padding: '20px',
                                                marginBottom: '20px',
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                                position: 'relative'
                                            }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }, children: [_jsxs("h3", { style: { fontSize: '18px', fontWeight: '700', color: TEXT_COLOR }, children: ["Question #", qIndex + 1] }), _jsx("button", { type: "button", onClick: () => removeQuestion(qIndex), disabled: formData.questions.length === 1, style: {
                                                                background: '#fed7d7',
                                                                color: '#e53e3e',
                                                                border: 'none',
                                                                borderRadius: '50%',
                                                                width: '32px',
                                                                height: '32px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: formData.questions.length === 1 ? 'not-allowed' : 'pointer',
                                                                opacity: formData.questions.length === 1 ? 0.5 : 1,
                                                                transition: 'all 0.3s ease'
                                                            }, onMouseEnter: (e) => { if (formData.questions.length > 1)
                                                                e.currentTarget.style.background = '#feb2b2'; }, onMouseLeave: (e) => { if (formData.questions.length > 1)
                                                                e.currentTarget.style.background = '#fed7d7'; }, children: _jsx(X, { size: 16 }) })] }), _jsxs("div", { style: { marginBottom: '20px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: '#4a5568' }, children: "Question Text" }), _jsx("textarea", { value: q.question, onChange: e => handleQuestionChange(qIndex, e.target.value), placeholder: "Type your multiple-choice question here...", required: true, rows: 3, style: {
                                                                width: '100%',
                                                                padding: '12px 16px',
                                                                border: `1px solid ${BORDER_COLOR}`,
                                                                borderRadius: '10px',
                                                                fontSize: '15px',
                                                                outline: 'none',
                                                                resize: 'vertical',
                                                                transition: 'all 0.3s ease',
                                                                background: CARD_BG,
                                                                fontFamily: 'inherit'
                                                            }, onFocus: (e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`; }, onBlur: (e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = CARD_BG; e.currentTarget.style.boxShadow = 'none'; } })] }), _jsxs("div", { style: { marginBottom: '20px' }, children: [_jsxs("h4", { style: { fontSize: '16px', fontWeight: '600', color: TEXT_COLOR, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(List, { size: 16, color: PRIMARY_ACCENT }), " Options (4 Required)"] }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }, children: q.options.map((opt, optIndex) => (_jsx("input", { type: "text", value: opt, placeholder: `Option ${optIndex + 1}`, onChange: e => handleOptionChange(qIndex, optIndex, e.target.value), required: true, style: {
                                                                    width: '100%',
                                                                    padding: '10px 14px',
                                                                    border: `1px solid ${BORDER_COLOR}`,
                                                                    borderRadius: '8px',
                                                                    fontSize: '14px',
                                                                    outline: 'none',
                                                                    transition: 'all 0.3s ease',
                                                                    background: CARD_BG
                                                                }, onFocus: (e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; }, onBlur: (e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = CARD_BG; } }, optIndex))) })] }), _jsxs("div", { children: [_jsxs("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: '#4a5568', alignItems: 'center', gap: '8px' }, children: [_jsx(CheckCircle, { size: 16, color: "green" }), " Correct Answer (Must match one option exactly)"] }), _jsx("input", { type: "text", value: q.correctAnswer, onChange: e => handleCorrectAnswerChange(qIndex, e.target.value), placeholder: "Enter the exact text of the correct option", required: true, style: {
                                                                width: '100%',
                                                                padding: '12px 16px',
                                                                border: '2px solid #68d391', // Green border for correct answer field
                                                                borderRadius: '10px',
                                                                fontSize: '15px',
                                                                outline: 'none',
                                                                transition: 'all 0.3s ease',
                                                                background: '#ebfff1'
                                                            }, onFocus: (e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = '0 0 0 3px #68d39155'; }, onBlur: (e) => { e.currentTarget.style.background = '#ebfff1'; e.currentTarget.style.boxShadow = 'none'; } })] })] }, qIndex)))] }) }), " ", _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '30px' }, children: [_jsxs("div", { style: {
                                            background: CARD_BG,
                                            borderRadius: '24px',
                                            padding: '30px',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                            border: `1px solid ${BORDER_COLOR}`
                                        }, children: [_jsxs("h2", { style: { fontSize: '24px', fontWeight: '700', color: TEXT_COLOR, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx(Edit3, { size: 24, color: PRIMARY_ACCENT }), " Exercise Details"] }), _jsxs("div", { style: { marginBottom: '25px' }, children: [_jsxs("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }, children: [_jsx(MessageSquare, { size: 16, style: { marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT } }), "Exercise Title"] }), _jsx("input", { type: "text", name: "title", value: formData.title, onChange: handleChange, required: true, placeholder: "e.g., React Hooks Quiz", style: {
                                                            width: '100%', padding: '12px 16px', border: `1px solid ${BORDER_COLOR}`,
                                                            borderRadius: '10px', fontSize: '15px', outline: 'none', transition: 'all 0.3s ease',
                                                            background: LIGHT_BG, fontWeight: '500'
                                                        }, onFocus: (e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`; }, onBlur: (e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = LIGHT_BG; e.currentTarget.style.boxShadow = 'none'; } })] }), _jsxs("div", { style: { marginBottom: '25px' }, children: [_jsxs("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }, children: [_jsx(Target, { size: 16, style: { marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT } }), "Difficulty Level"] }), _jsxs("select", { name: "difficulty", value: formData.difficulty, onChange: handleChange, required: true, style: {
                                                            width: '100%', padding: '12px 16px', border: `1px solid ${BORDER_COLOR}`,
                                                            borderRadius: '10px', fontSize: '15px', outline: 'none', transition: 'all 0.3s ease',
                                                            background: LIGHT_BG, fontWeight: '500', cursor: 'pointer'
                                                        }, onFocus: (e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`; }, onBlur: (e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = LIGHT_BG; e.currentTarget.style.boxShadow = 'none'; }, children: [_jsx("option", { value: "", children: "Choose Difficulty Level" }), _jsx("option", { value: "beginner", children: "Beginner" }), _jsx("option", { value: "intermediate", children: "Intermediate" }), _jsx("option", { value: "advanced", children: "Advanced" })] })] }), _jsxs("div", { style: { marginBottom: '0' }, children: [_jsxs("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }, children: [_jsx(Clock, { size: 16, style: { marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT } }), "Expected Duration"] }), _jsx("input", { type: "text", name: "duration", value: formData.duration, onChange: handleChange, required: true, placeholder: "e.g., 10 minutes", style: {
                                                            width: '100%', padding: '12px 16px', border: `1px solid ${BORDER_COLOR}`,
                                                            borderRadius: '10px', fontSize: '15px', outline: 'none', transition: 'all 0.3s ease',
                                                            background: LIGHT_BG, fontWeight: '500'
                                                        }, onFocus: (e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`; }, onBlur: (e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = LIGHT_BG; e.currentTarget.style.boxShadow = 'none'; } })] })] }), _jsxs("div", { style: {
                                            background: CARD_BG,
                                            borderRadius: '24px',
                                            padding: '30px',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                                            border: `1px solid ${BORDER_COLOR}`
                                        }, children: [_jsxs("h2", { style: { fontSize: '24px', fontWeight: '700', color: TEXT_COLOR, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx(BarChart3, { size: 24, color: PRIMARY_ACCENT }), " Grading"] }), _jsxs("div", { style: { marginBottom: '25px' }, children: [_jsxs("label", { style: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }, children: [_jsx(Hash, { size: 16, style: { marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT } }), "Total Points"] }), _jsx("input", { type: "number", name: "points", value: formData.points, onChange: handleChange, required: true, min: "1", placeholder: "e.g., 100", style: {
                                                            width: '100%', padding: '12px 16px', border: `1px solid ${BORDER_COLOR}`,
                                                            borderRadius: '10px', fontSize: '15px', outline: 'none', transition: 'all 0.3s ease',
                                                            background: LIGHT_BG, fontWeight: '500'
                                                        }, onFocus: (e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`; }, onBlur: (e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = LIGHT_BG; e.currentTarget.style.boxShadow = 'none'; } })] }), _jsx("div", { style: { marginBottom: '0' }, children: _jsxs("label", { style: {
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
                                                        e.currentTarget.style.background = '#f0f4ff';
                                                        e.currentTarget.style.borderColor = PRIMARY_ACCENT;
                                                        e.currentTarget.style.boxShadow = `0 2px 10px ${PRIMARY_ACCENT}22`;
                                                    }, onMouseLeave: (e) => {
                                                        e.currentTarget.style.background = LIGHT_BG;
                                                        e.currentTarget.style.borderColor = BORDER_COLOR;
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }, children: [_jsx("input", { type: "checkbox", name: "completed", checked: formData.completed, onChange: handleChange, style: {
                                                                transform: 'scale(1.3)',
                                                                accentColor: PRIMARY_ACCENT
                                                            } }), _jsx(Star, { size: 20, color: PRIMARY_ACCENT }), "Set as Completed by Default (Usually unchecked)"] }) })] })] }), " "] }), " ", _jsxs("div", { style: { marginTop: '50px', textAlign: 'center' }, children: [_jsx("button", { type: "submit", disabled: submitting, style: {
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
                                    minWidth: '320px',
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
                                }, children: submitting ? (_jsxs(_Fragment, { children: [_jsx(Gauge, { size: 20, className: "spin-animation" }), "Submitting..."] })) : (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { size: 20 }), "Publish Exercise"] })) }), _jsx("style", { children: `
                        @keyframes spin-submit {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        .spin-animation {
                            animation: spin-submit 1s linear infinite;
                        }
                        ` })] })] })] }));
};
export default AddExercise;
