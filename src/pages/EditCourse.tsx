// src/pages/EditCourse.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { CourseData, CourseService } from '../firebase/src/firebaseServices';

const EditCourse = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // --- AUTH & DATA FETCHING ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        navigate('/signin');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchCourses = async () => {
      try {
        const myCourses = await CourseService.getCoursesByTeacher(currentUser.uid);
        setCourses(myCourses);
      } catch (err) {
        console.error('Error loading courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [currentUser]);

  const handleEdit = (course: CourseData) => {
    setSelectedCourse(course);
    setTimeout(() => {
      document.getElementById('edit-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSave = async () => {
    if (!selectedCourse || !currentUser || !selectedCourse.id) return;
    setSaving(true);
    try {
      await CourseService.updateCourse(selectedCourse.id, selectedCourse, currentUser.uid);
      alert('✅ Course updated successfully!');
      const updated = await CourseService.getCoursesByTeacher(currentUser.uid);
      setCourses(updated);
      setSelectedCourse(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert('❌ ' + (err.message || 'Failed to save changes.'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = () => {
    if (!selectedCourse) return;
    const newLinks = [
      ...(selectedCourse.courseLinks || []),
      { id: Date.now().toString(), title: '', url: '', type: 'video' }
    ];
    setSelectedCourse({ ...selectedCourse, courseLinks: newLinks });
  };

  const handleRemoveLink = (index: number) => {
    if (!selectedCourse) return;
    const newLinks = selectedCourse.courseLinks.filter((_, i) => i !== index);
    setSelectedCourse({ ...selectedCourse, courseLinks: newLinks });
  };

  // --- MODERN STYLES (Purple/Electric Blue Theme) ---
  const styles = {
    pageWrapper: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%)', // Very light purple/blue tint
      fontFamily: "'Outfit', 'Inter', sans-serif",
      color: '#1a1a1a',
      paddingBottom: '4rem',
    },
    container: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '3rem 1.5rem',
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '4rem',
    },
    mainTitle: {
      fontSize: '3.5rem',
      fontWeight: '800',
      marginBottom: '0.5rem',
      background: 'linear-gradient(to right, #3a25ff, #7c3aed)', // Your color to purple gradient
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '-1px',
    },
    subtitle: {
      fontSize: '1.2rem',
      color: '#6b7280',
      maxWidth: '600px',
      margin: '0 auto',
      lineHeight: '1.6',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '2rem',
    },
    card: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      borderRadius: '24px',
      padding: '2rem',
      border: '1px solid rgba(58, 37, 255, 0.05)',
      boxShadow: '0 20px 40px -10px rgba(58, 37, 255, 0.08)', // Purple shadow
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    cardActive: {
      borderColor: '#3a25ff',
      boxShadow: '0 25px 50px -12px rgba(58, 37, 255, 0.25)',
      transform: 'translateY(-5px)',
    },
    cardBadge: {
      position: 'absolute' as const,
      top: '1.5rem',
      right: '1.5rem',
      background: '#e0e7ff',
      color: '#3a25ff',
      padding: '0.4rem 0.8rem',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: '700',
      letterSpacing: '0.5px',
      textTransform: 'uppercase' as const,
    },
    cardTitle: {
      fontSize: '1.5rem',
      fontWeight: '700',
      marginBottom: '0.5rem',
      marginTop: '1rem',
      color: '#1e1b4b',
    },
    cardMeta: {
      display: 'flex',
      gap: '1rem',
      fontSize: '0.95rem',
      color: '#6366f1',
      marginBottom: '2rem',
      fontWeight: '500',
    },
    editButton: {
      width: '100%',
      padding: '1rem',
      borderRadius: '16px',
      border: 'none',
      background: '#f5f3ff',
      color: '#3a25ff',
      fontWeight: '700',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'background 0.2s',
    },
    // --- FORM SECTION ---
    formWrapper: {
      marginTop: '4rem',
      backgroundColor: '#ffffff',
      borderRadius: '32px',
      padding: '3rem',
      boxShadow: '0 25px 60px -15px rgba(0,0,0,0.05)',
      border: '1px solid #f0f0f0',
      position: 'relative' as const,
    },
    formHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '3rem',
      borderBottom: '2px solid #f3f4f6',
      paddingBottom: '1.5rem',
    },
    formTitle: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#111827',
    },
    inputGroup: {
      marginBottom: '2rem',
    },
    label: {
      display: 'block',
      fontSize: '0.9rem',
      textTransform: 'uppercase' as const,
      fontWeight: '700',
      color: '#6b7280',
      marginBottom: '0.75rem',
      letterSpacing: '0.5px',
    },
    input: {
      width: '100%',
      padding: '1.2rem',
      fontSize: '1.1rem',
      borderRadius: '16px',
      border: '2px solid #e5e7eb',
      backgroundColor: '#f9fafb',
      color: '#1f2937',
      transition: 'all 0.2s',
      outline: 'none',
    },
    row: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '2rem',
    },
    primaryBtn: {
      background: 'linear-gradient(90deg, #3a25ff 0%, #6366f1 100%)',
      color: 'white',
      padding: '1.2rem 2.5rem',
      fontSize: '1.1rem',
      fontWeight: 'bold',
      border: 'none',
      borderRadius: '16px',
      cursor: 'pointer',
      boxShadow: '0 10px 20px -5px rgba(58, 37, 255, 0.4)',
      transition: 'transform 0.2s',
      width: '100%',
    },
    secondaryBtn: {
      background: 'transparent',
      color: '#6b7280',
      padding: '1rem',
      fontSize: '1rem',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      width: '100%',
      marginTop: '1rem',
    },
    linkRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1rem',
      backgroundColor: '#f5f3ff',
      borderRadius: '16px',
      marginBottom: '1rem',
    },
    addButton: {
      background: '#3a25ff',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: 'bold',
    }
  };

  // Helper for focus effect
  const handleInputFocus = (e: any) => {
    e.target.style.borderColor = '#3a25ff';
    e.target.style.backgroundColor = '#fff';
    e.target.style.boxShadow = '0 0 0 4px rgba(58, 37, 255, 0.1)';
  };
  const handleInputBlur = (e: any) => {
    e.target.style.borderColor = '#e5e7eb';
    e.target.style.backgroundColor = '#f9fafb';
    e.target.style.boxShadow = 'none';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f3ff' }}>
        <div style={{ width: '50px', height: '50px', border: '5px solid #3a25ff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.mainTitle}>Course Manager</h2>
          <p style={styles.subtitle}>Update and refine your curriculum with our modern editor.</p>
        </div>

        {courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', background: 'white', borderRadius: '32px', border: '1px dashed #ccc' }}>
            <h3 style={{ color: '#3a25ff', fontSize: '2rem', marginBottom: '1rem' }}>Start Teaching</h3>
            <p style={{ fontSize: '1.2rem', color: '#666' }}>You haven't created any courses yet.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {courses.map((course) => (
              <div
                key={course.id}
                style={{
                  ...styles.card,
                  ...(selectedCourse?.id === course.id ? styles.cardActive : {})
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => {
                  if (selectedCourse?.id !== course.id) e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={styles.cardBadge}>{course.category}</span>
                <h4 style={styles.cardTitle}>{course.title}</h4>
                <div style={styles.cardMeta}>
                  <span>{course.duration}</span>
                  <span>•</span>
                  <span>{course.price || 'Free'}</span>
                </div>
                <button
                  onClick={() => handleEdit(course)}
                  style={{
                    ...styles.editButton,
                    backgroundColor: selectedCourse?.id === course.id ? '#3a25ff' : '#f5f3ff',
                    color: selectedCourse?.id === course.id ? '#ffffff' : '#3a25ff',
                  }}
                >
                  {selectedCourse?.id === course.id ? 'Editing Now...' : 'Edit Course'}
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedCourse && (
          <div id="edit-form-section" style={styles.formWrapper}>
            <div style={styles.formHeader}>
              <h3 style={styles.formTitle}>
                Edit <span style={{ color: '#3a25ff' }}>Details</span>
              </h3>
              <button 
                onClick={() => setSelectedCourse(null)}
                style={{ fontSize: '2rem', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
              >
                &times;
              </button>
            </div>

            {/* Inputs */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Course Title</label>
              <input
                type="text"
                value={selectedCourse.title}
                onChange={(e) => setSelectedCourse({ ...selectedCourse, title: e.target.value })}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                value={selectedCourse.description}
                onChange={(e) => setSelectedCourse({ ...selectedCourse, description: e.target.value })}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                rows={4}
                style={{ ...styles.input, fontFamily: 'inherit' }}
              />
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Category</label>
                <input
                  type="text"
                  value={selectedCourse.category}
                  onChange={(e) => setSelectedCourse({ ...selectedCourse, category: e.target.value })}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Instructor</label>
                <input
                  type="text"
                  value={selectedCourse.instructor}
                  onChange={(e) => setSelectedCourse({ ...selectedCourse, instructor: e.target.value })}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Duration</label>
                <input
                  type="text"
                  value={selectedCourse.duration}
                  onChange={(e) => setSelectedCourse({ ...selectedCourse, duration: e.target.value })}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Price</label>
                <input
                  type="text"
                  value={selectedCourse.price || ''}
                  onChange={(e) => setSelectedCourse({ ...selectedCourse, price: e.target.value })}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  style={styles.input}
                  placeholder="Free"
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Difficulty</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedCourse.difficulty}
                    onChange={(e) => setSelectedCourse({ ...selectedCourse, difficulty: e.target.value })}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    style={{ ...styles.input, appearance: 'none' }}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  <div style={{ position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#3a25ff' }}>▼</div>
                </div>
              </div>
              <div style={{ ...styles.inputGroup, display: 'flex', alignItems: 'center' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '1.1rem', fontWeight: '600', color: '#1f2937' }}>
                  <input
                    type="checkbox"
                    checked={selectedCourse.certificate}
                    onChange={(e) => setSelectedCourse({ ...selectedCourse, certificate: e.target.checked })}
                    style={{ width: '24px', height: '24px', marginRight: '12px', accentColor: '#3a25ff' }}
                  />
                  Provide Certificate
                </label>
              </div>
            </div>

            {/* Links Section */}
            <div style={{ marginTop: '2rem', background: '#fcfcfc', padding: '2rem', borderRadius: '24px', border: '1px dashed #d1d5db' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1.2rem', margin: 0, color: '#3a25ff' }}>Curriculum / Videos</h4>
                <button onClick={handleAddLink} style={styles.addButton}>+ Add Video</button>
              </div>
              
              {(selectedCourse.courseLinks || []).map((link, i) => (
                <div key={i} style={styles.linkRow}>
                  <div style={{ width: '30px', height: '30px', background: '#3a25ff', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>{i + 1}</div>
                  <input
                    type="text"
                    placeholder="Title"
                    value={link.title}
                    onChange={(e) => {
                      const newLinks = [...selectedCourse.courseLinks];
                      newLinks[i] = { ...newLinks[i], title: e.target.value };
                      setSelectedCourse({ ...selectedCourse, courseLinks: newLinks });
                    }}
                    style={{ ...styles.input, padding: '0.8rem', fontSize: '1rem', border: 'none' }}
                  />
                  <input
                    type="text"
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...selectedCourse.courseLinks];
                      newLinks[i] = { ...newLinks[i], url: e.target.value };
                      setSelectedCourse({ ...selectedCourse, courseLinks: newLinks });
                    }}
                    style={{ ...styles.input, padding: '0.8rem', fontSize: '1rem', border: 'none' }}
                  />
                  <button
                    onClick={() => handleRemoveLink(i)}
                    style={{ padding: '0.8rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div style={styles.inputGroup}>
              <label style={{ ...styles.label, marginTop: '2rem' }}>Overview</label>
              <textarea
                value={selectedCourse.overview || ''}
                onChange={(e) => setSelectedCourse({ ...selectedCourse, overview: e.target.value })}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                rows={6}
                style={{ ...styles.input, fontFamily: 'inherit' }}
                placeholder="Write a compelling overview..."
              />
            </div>

            <div style={{ marginTop: '3rem' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ ...styles.primaryBtn, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
              <button
                onClick={() => setSelectedCourse(null)}
                style={styles.secondaryBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditCourse;