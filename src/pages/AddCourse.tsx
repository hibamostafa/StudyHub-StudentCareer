//import 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebaseConfig';
import { CourseService, ExercisesService } from '../firebase/src/firebaseServices';
import { 
  BookOpen, Upload, DollarSign, Tag, FileText, User, Clock, 
  Plus, X, Star, Award, Globe, Calendar, Users, Link, 
  Video, Image, File, Zap, Target, CheckCircle, ArrowLeft,
  Info, BarChart3, List
} from 'lucide-react';
import './AddCourse.css';

const PRIMARY_ACCENT = '#3a25ff'; 
const GRADIENT_START = '#3a25ff';
const GRADIENT_END = '#5a4bff';
const LIGHT_BG = '#f7f8fa'; 
const CARD_BG = 'white';
const TEXT_COLOR = '#2d3748';
const BORDER_COLOR = '#e2e8f0';


const AddCourse = () => {
  const [user] = useAuthState(auth);   // Get the logged-in user from Firebase
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  //store data of course from input
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
//  // Stores inputs course links (videos, files, etc.)
  const [courseLinks, setCourseLinks] = useState<Array<{id: string, title: string, url: string, type: string}>>([]);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

// Loads the logged-in user’s data when the page opens.
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {// If the user is NOT logged in → redirects to /signin.
        const { UserService } = await import('../firebase/src/firebaseServices');
        const data = await UserService.getUserData(user.uid);
        setUserData(data);
        setLoading(false);
      } else { // If the user is logged in → gets user info from Firebase and stores it in userData.
        setLoading(false);
        navigate('/signin');
      }
    };
    fetchUserData();
  }, [user, navigate]);

  useEffect(() => {
    if (!loading && userData && userData.role !== 'Coordinator') {
      alert('No Permission ');
      navigate('/courses');
    }
  }, [loading, userData, navigate]);
// Handles uploading the course thumbnail (image).
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnail(file);//Creates a preview URL to show the user 
      setPreviewUrl(URL.createObjectURL(file));
    }
  };
 //Updates form inputs (title, description, price, etc.)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { // react. an event happend and changing due to text area input or select elemnt
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
// add course link 
  const addCourseLink = () => {
    const newLink = {
      id: Date.now().toString(),
      title: '',
      url: '',
      type: 'video'
    };
    setCourseLinks(prev => [...prev, newLink]);
  };

  const removeCourseLink = (id: string) => {
    setCourseLinks(prev => prev.filter(link => link.id !== id));
  };

  const updateCourseLink = (id: string, field: string, value: string) => {
    setCourseLinks(prev => prev.map(link => 
      link.id === id ? { ...link, [field]: value } : link
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Validate that a category is selected
    if (!formData.category || formData.category.trim() === '') {
      setError('Please select a category for the course before saving!');
      setSubmitting(false);
      return;
    }
    
    setSubmitting(true);
    setError(null);
    try {
      console.log(`Adding new course in category: ${formData.category}`);
      await CourseService.uploadCourse(
        {
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
        },
        user.uid
      );
      console.log('🔥 Course created successfully!', {
        title: formData.title,
        category: formData.category,
        courseLinks: courseLinks.length
      });
      alert('Course created successfully! 🎉');
      navigate('/courses');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while creating the course.');
    } finally {
      setSubmitting(false);
    }
  };

if (loading) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: `linear-gradient(135deg, ${LIGHT_BG} 0%, #ebedee 100%)`,
      }}
    >
      <div
        style={{
          background: CARD_BG,
          borderRadius: "20px",
          padding: "35px 45px",
          textAlign: "center",
          boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
          color: "#444",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "3px solid rgba(0,0,0,0.08)",
            borderTop: `3px solid ${PRIMARY_ACCENT}`, 
            borderRadius: "50%",
            margin: "0 auto 18px",
            animation: "spin 1.2s ease-in-out infinite",
          }}
        />

        <h3 style={{ marginBottom: "6px", fontWeight: 600, color: "#333" }}>
          Loading...
        </h3>
        <p style={{ fontSize: "14px", color: "#777" }}>
          Please wait a moment ✨
        </p>
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}


  return (
    <div style={{
      minHeight: '100vh',
      background: LIGHT_BG, // Soft Off-White Background
      padding: '40px 20px', // Increased top/bottom padding
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px', // Increased max width for more space
        margin: '0 auto',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button 
          onClick={() => navigate('/courses')}
          style={{
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
          }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 4px 15px ${PRIMARY_ACCENT}33`;
                e.currentTarget.style.color = PRIMARY_ACCENT;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                e.currentTarget.style.color = TEXT_COLOR;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
        >
          <ArrowLeft size={18} />
          Back to Courses
        </button>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          color: TEXT_COLOR,
          textShadow: '0 1px 1px rgba(0,0,0,0.05)'
        }}>
          ✨ New Course Blueprint
        </h1>
      </div>

      {error && (
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto 20px',
          background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          textAlign: 'center',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(255,107,107,0.3)'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Main Content Grid (Two Columns) */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '2.5fr 1.5fr', // Left column wider than right
          gap: '30px'
        }}>

          {/* === LEFT COLUMN: Core Details and Links (Wider) === */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

            {/* 1. Course Details Card (Title, Description, Overview) */}
            <div style={{
              background: CARD_BG,
              borderRadius: '24px',
              padding: '30px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)', 
              border: `1px solid ${BORDER_COLOR}`
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: TEXT_COLOR, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Info size={24} color={PRIMARY_ACCENT} /> Basic Course Information
              </h2>
              
              {/* Course Title */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }}>
                  <BookOpen size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT }} />
                  Course Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Learn React from Scratch"
                  style={{
                    width: '100%',
                    padding: '12px 16px', 
                    border: `1px solid ${BORDER_COLOR}`,
                    borderRadius: '10px', 
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    background: LIGHT_BG,
                    fontWeight: '500'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = PRIMARY_ACCENT;
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = BORDER_COLOR;
                    e.currentTarget.style.background = LIGHT_BG;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Course Description */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }}>
                  <FileText size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT }} />
                  Course Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Describe your course in detail..."
                  rows={4}
                  style={{
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
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = PRIMARY_ACCENT;
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = BORDER_COLOR;
                    e.currentTarget.style.background = LIGHT_BG;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* What You'll Learn & Requirements (Side by side) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* What You'll Learn */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }}>
                    <CheckCircle size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT }} />
                    What You'll Learn (Comma Separated)
                  </label>
                  <textarea
                    name="whatYouLearn"
                    value={formData.whatYouLearn}
                    onChange={handleChange}
                    placeholder="Benefit 1, Benefit 2, etc."
                    rows={3}
                    style={{ width: '100%', padding: '12px 16px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '10px', fontSize: '15px', outline: 'none', resize: 'vertical', transition: 'all 0.3s ease', background: LIGHT_BG, fontWeight: '500', fontFamily: 'inherit' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = LIGHT_BG; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                {/* Requirements */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }}>
                    <List size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT }} />
                    Requirements (Comma Separated)
                  </label>
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleChange}
                    placeholder="Requirement 1, Requirement 2, etc."
                    rows={3}
                    style={{ width: '100%', padding: '12px 16px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '10px', fontSize: '15px', outline: 'none', resize: 'vertical', transition: 'all 0.3s ease', background: LIGHT_BG, fontWeight: '500', fontFamily: 'inherit' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = LIGHT_BG; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

            </div>

            {/* 2. Course Links Section Card */}
            <div style={{
              background: CARD_BG,
              borderRadius: '24px',
              padding: '30px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              border: `1px solid ${BORDER_COLOR}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: TEXT_COLOR, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Link size={24} color={PRIMARY_ACCENT} /> Course Content Links
                </h2>
                <button
                  type="button"
                  onClick={addCourseLink}
                  style={{
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
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 8px 20px ${PRIMARY_ACCENT}55`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${PRIMARY_ACCENT}33`;
                  }}
                >
                  <Plus size={16} />
                  Add Link
                </button>
              </div>

              {courseLinks.length === 0 ? (
                <div style={{
                  // Light Blue/Indigo Empty State
                  background: '#f0f4ff', 
                  border: `2px dashed ${PRIMARY_ACCENT}66`,
                  borderRadius: '16px',
                  padding: '40px',
                  textAlign: 'center',
                  color: '#718096'
                }}>
                  <Link size={48} style={{ marginBottom: '16px', opacity: 0.5, color: PRIMARY_ACCENT }} />
                  <h3 style={{ marginBottom: '8px', color: TEXT_COLOR }}>No Links Added Yet</h3>
                  <p>Add course materials, videos, documents, and other resources</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {courseLinks.map((link, index) => (
                    <div key={link.id} style={{
                      background: LIGHT_BG, // Use LIGHT_BG for nested items for contrast
                      border: `1px solid ${BORDER_COLOR}`,
                      borderRadius: '16px',
                      padding: '20px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {link.type === 'video' && <Video size={20} color={PRIMARY_ACCENT} />}
                          {link.type === 'document' && <File size={20} color={PRIMARY_ACCENT} />}
                          {link.type === 'image' && <Image size={20} color={PRIMARY_ACCENT} />}
                          {link.type === 'other' && <Link size={20} color={PRIMARY_ACCENT} />}
                          <span style={{ fontWeight: '600', color: TEXT_COLOR }}>
                            Link #{index + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCourseLink(link.id)}
                          style={{
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
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#feb2b2'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#fed7d7'; }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        {/* Title */}
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '13px', color: '#4a5568' }}>Link Title</label>
                          <input
                            type="text"
                            value={link.title}
                            onChange={(e) => updateCourseLink(link.id, 'title', e.target.value)}
                            placeholder="e.g., Introduction Video"
                            style={{ width: '100%', padding: '10px 14px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'all 0.3s ease', background: CARD_BG }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = CARD_BG; }}
                          />
                        </div>
                        {/* URL */}
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '13px', color: '#4a5568' }}>URL</label>
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => updateCourseLink(link.id, 'url', e.target.value)}
                            placeholder="https://example.com"
                            style={{ width: '100%', padding: '10px 14px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'all 0.3s ease', background: CARD_BG }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = CARD_BG; }}
                          />
                        </div>
                        {/* Type */}
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '13px', color: '#4a5568' }}>Type</label>
                          <select
                            value={link.type}
                            onChange={(e) => updateCourseLink(link.id, 'type', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'all 0.3s ease', background: CARD_BG, cursor: 'pointer' }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = CARD_BG; }}
                          >
                            <option value="video">Video</option>
                            <option value="document">Document</option>
                            <option value="image">Image</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div> {/* End of Left Column */}

          {/* === RIGHT COLUMN: Metadata and Thumbnail (Narrower) === */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* 3. Metadata Card (Category, Difficulty, Duration) */}
            <div style={{
              background: CARD_BG,
              borderRadius: '24px',
              padding: '30px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              border: `1px solid ${BORDER_COLOR}`
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: TEXT_COLOR, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BarChart3 size={24} color={PRIMARY_ACCENT} /> Course Metrics
              </h2>

              {/* Category */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }}>
                  <Tag size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT }} />
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '12px 16px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '10px', fontSize: '15px', outline: 'none', transition: 'all 0.3s ease', background: LIGHT_BG, fontWeight: '500', cursor: 'pointer' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = LIGHT_BG; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <option value="">Choose Category</option>
                  <option value="graphic">  Graphic Design</option>
                  <option value="cyber">Cyber Security</option>
                  <option value="web">Web Development</option>
                  <option value="languages">Languages</option>
                  <option value="history">History</option>
                  <option value="finance">Finance</option>
                  <option value="mobile">Mobile Development</option>
                  <option value="chemistry">Chemistry</option>
                </select>
              </div>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }}>
                  <Target size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT }} />
                  Difficulty Level
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '12px 16px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '10px', fontSize: '15px', outline: 'none', transition: 'all 0.3s ease', background: LIGHT_BG, fontWeight: '500', cursor: 'pointer' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = LIGHT_BG; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <option value="">Choose Difficulty Level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Beginner to Advanced">Beginner to Advanced</option>
                </select>
              </div>

              {/* Duration */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }}>
                  <Clock size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT }} />
                  Course Duration
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 1 hour, 32 hours"
                  style={{ width: '100%', padding: '12px 16px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '10px', fontSize: '15px', outline: 'none', transition: 'all 0.3s ease', background: LIGHT_BG, fontWeight: '500' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = LIGHT_BG; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Instructor */}
              <div style={{ marginBottom: '0' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '15px', color: TEXT_COLOR }}>
                  <User size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle', color: PRIMARY_ACCENT }} />
                  Instructor Name
                </label>
                <input
                  type="text"
                  name="instructor"
                  value={formData.instructor}
                  onChange={handleChange}
                  required
                  placeholder="e.g., John Smith"
                  style={{ width: '100%', padding: '12px 16px', border: `1px solid ${BORDER_COLOR}`, borderRadius: '10px', fontSize: '15px', outline: 'none', transition: 'all 0.3s ease', background: LIGHT_BG, fontWeight: '500' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = PRIMARY_ACCENT; e.currentTarget.style.background = 'white'; e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_ACCENT}33`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = BORDER_COLOR; e.currentTarget.style.background = LIGHT_BG; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* 4. Pricing & Options Card */}
            <div style={{
              background: CARD_BG,
              borderRadius: '24px',
              padding: '30px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              border: `1px solid ${BORDER_COLOR}`
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: TEXT_COLOR, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                 Pricing: Free
              </h2>


              {/* Certificate */}
              <div style={{ marginBottom: '0' }}>
                <label style={{ 
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
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f4ff'; // Light blue hover
                  e.currentTarget.style.borderColor = PRIMARY_ACCENT;
                  e.currentTarget.style.boxShadow = `0 2px 10px ${PRIMARY_ACCENT}22`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = LIGHT_BG;
                  e.currentTarget.style.borderColor = BORDER_COLOR;
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <input
                    type="checkbox"
                    name="certificate"
                    checked={formData.certificate}
                    onChange={(e) => setFormData(prev => ({ ...prev, certificate: e.target.checked }))}
                    style={{ 
                      transform: 'scale(1.3)',
                      accentColor: PRIMARY_ACCENT
                    }}
                  />
                  <Award size={20} color={PRIMARY_ACCENT} />
                  Course includes a **Certificate of Completion**
                </label>
              </div>
            </div>

          </div> {/* End of Right Column */}
          
          {/* Thumbnail / Upload Card (Stretching across columns, below metadata/links) */}
   
          
        </div> {/* End of Main Content Grid */}

        {/* Submit Button Section (Centered below the grid) */}
        <div style={{ marginTop: '50px', textAlign: 'center' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
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
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
                e.currentTarget.style.boxShadow = `0 12px 25px ${PRIMARY_ACCENT}66`;
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = `0 8px 20px ${PRIMARY_ACCENT}44`;
              }
            }}
          >
            {submitting ? (
              <>
                <Zap size={20} className="spin-animation" /> 
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Publish Course
              </>
            )}
          </button>
          {/* Re-adding the spin animation style */}
          <style>
            {`
              @keyframes spin-submit {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .spin-animation {
                animation: spin-submit 1s linear infinite;
              }
            `}
          </style>
        </div>
      </form>
    </div>
  );
};

export default AddCourse;