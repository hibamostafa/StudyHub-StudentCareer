import { useState, useEffect } from 'react';
import {
  User, Briefcase, GraduationCap, Camera, Edit3, Share2, Plus,
  CheckCircle, Clock, X, Award, 
  Mail, Phone, BookOpen, Save, AlertCircle,
  MessageSquare, Upload, MapPin, Zap,
  ArrowUp, Minus, Calendar, Globe, FileText, ChevronRight,
  TrendingUp, MoreHorizontal
} from 'lucide-react';
import { auth, db } from '../firebase/firebaseConfig';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { NavLink, Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { UserService } from '../firebase/src/firebaseServices';
import { FaUser } from 'react-icons/fa';
import React, { useRef } from 'react';
import {  Download } from 'lucide-react';
// --- 1. Helper Function: Resize & Convert ---

// --- Interfaces ---
interface UserData {
  id: string;
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role?: 'Participant' | 'Coordinator';
  phone?: string;
  location?: string;
  photoURL?: string | null;
  bio?: string;
  company?: string;
  
  // Stats
  appliedJobs?: number;
  coursesEnrolled?: number;
  coursesCreated?: number;
  cvUploaded?: boolean;
  cvUploads?: number;
  
  createdCoursesList?: any[]; 
    skills: string[];
  registeredCourses?: any[];
  appliedJobsList?: any[];
  interestedJobs?: any[];
  createdAt?: any;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  tech: string;
  type: string;
  remote: string;
  timestamp: any;
}
const resizeAndConvertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.7)); 
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
const ProfileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    // Triggers the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      // Logic to save to your profile/database would go here
      console.log("File uploaded:", uploadedFile.name);
    }
  };

  const handleDownload = () => {
    // Logic to download the saved file
    if (!file) return;
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
  };
}
// --- 1.1 Helper: Get deterministic color/level ---
const getSkillAttributes = (skillName: string) => {
  let hash = 0;
  for (let i = 0; i < skillName.length; i++) {
    hash = skillName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const levels = ['Intermediate', 'Advanced', 'Expert', 'Pro'];
  const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];
  
  const levelIndex = Math.abs(hash) % levels.length;
  const colorIndex = Math.abs(hash) % colors.length;

  return {
    level: levels[levelIndex],
    color: colors[colorIndex]
  };
};

// --- Helper Components ---
const formatDate = (date: any) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const LoadingSpinner = () => (
  <div style={styles.loadingContainer}>
    <div style={styles.spinnerWrapper}>
      <div style={styles.spinner}></div>
      <div style={styles.spinnerInner}></div>
    </div>
    <p style={styles.loadingText}>Loading your profile...</p>
  </div>
);

// --- MODERN STATCARD COMPONENT ---
const StatCard = ({ icon, title, value, change, suffix = "%", color, subLabel }: any) => {
  const isZero = !change || change === 0 || change === "0";
  return (
    <div style={styles.modernStatCard}>
      <div style={styles.statTopRow}>
        <div style={{...styles.statIconBox, backgroundColor: `${color}15`, color: color}}>
          {icon}
        </div>
        {/* Trend Pill */}
        <div style={{
           ...styles.trendPill, 
           backgroundColor: isZero ? "#f3f4f6" : `${color}10`,
           color: isZero ? "#9ca3af" : color
        }}>
           {isZero ? <Minus size={12} strokeWidth={3} /> : <TrendingUp size={12} strokeWidth={3} />}
           <span>{!isZero && "+"}{change}{!isZero && suffix}</span>
        </div>
      </div>
      
      <div style={styles.statContent}>
        <p style={styles.statTitle}>{title}</p>
        <h3 style={styles.statValue}>{value?.toLocaleString() || 0}</h3>
        {subLabel && <p style={styles.statSubLabel}>{subLabel}</p>}
      </div>
    </div>
  );
};

// --- SKILLTAG COMPONENT ---
const SkillTag = ({ skill, onRemove, isEditing }: any) => {
  const { level, color } = getSkillAttributes(skill);

  return (
    <div style={styles.skillCard}>
      <div style={{...styles.skillColorStrip, backgroundColor: color}}></div>
      <div style={styles.skillInfo}>
        <div style={styles.skillHeader}>
          <span style={styles.skillName}>{skill}</span>
          {isEditing && onRemove && (
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(); }} 
              style={styles.deleteSkillBtn}
              title="Remove Skill"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div style={styles.skillMeta}>
          <div style={{...styles.skillDot, backgroundColor: color}}></div>
          <span style={{...styles.skillLevelText, color: color}}>{level}</span>
        </div>
      </div>
    </div>
  );
};

// --- MODERN TIMELINE ITEM ---
const TimelineItem = ({ title, subtitle, date, icon, color, isLast }: any) => (
  <div style={styles.timelineItem}>
    <div style={styles.timelineLeft}>
      <div style={{...styles.timelineIconCircle, backgroundColor: color}}>
        {icon}
      </div>
      {!isLast && <div style={styles.timelineLine}></div>}
    </div>
    <div style={styles.timelineContent}>
      <div style={styles.timelineHeader}>
        <h4 style={styles.timelineTitle}>{title}</h4>
        <span style={styles.timelineDate}>{date}</span>
      </div>
      <p style={styles.timelineSubtitle}>{subtitle}</p>
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children, size = 'md' }: any) => {
  if (!isOpen) return null;
  return (
    <div style={styles.modalOverlay}>
      <div style={{
        ...styles.modal,
        width: size === 'lg' ? '90%' : size === 'sm' ? '60%' : '75%',
        maxWidth: size === 'lg' ? 800 : size === 'sm' ? 400 : 600
      }}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>{title}</h3>
          <button onClick={onClose} style={styles.closeBtn} title='btn'>
            <X size={24} />
          </button>
        </div>
        <div style={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
};

const ProfileStrengthIndicator = ({ strength }: { strength: number }) => (
  <div style={styles.strengthContainer}>
    <div style={styles.strengthHeader}>
      <span style={styles.strengthLabel}>Profile Strength</span>
      <span style={styles.strengthValue}>{strength}%</span>
    </div>
    <div style={styles.strengthBar}>
      <div 
        style={{
  ...styles.strengthFill,
  width: `${strength}%`,
  background:
    strength >= 80
      ? '#10b940ff'   // strong → green
      : strength >= 60
      ? '#faf44eff'   // medium → yellow
      : '#db6740ff',  // weak → red
}}

      ></div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
function ProfilePage() {
  const [user] = useAuthState(auth);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  
  // State
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false); 

  // Form Data State
  const [editData, setEditData] = useState<Partial<UserData>>({});
  const [newSkill, setNewSkill] = useState('');
  
  // Lists
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [appliedJobsList, setAppliedJobsList] = useState<Job[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // 1. Fetch User Data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setUserData(null);
        setEnrolledCourses([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await UserService.updateUserStats(user.uid);
        
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData({ ...data, uid: user.uid } as UserData);
          setEditData({ ...data });
          setEnrolledCourses(data.registeredCourses || []);
          setError(null);
        } else {
          setError("User not found");
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  // 2. Fetch Jobs & Build Activity Timeline
  useEffect(() => {
    if (!userData || !user) return;
    const fetchAppliedJobs = async () => {
      try {
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('userId', '==', user.uid)
        );
        const applicationsSnapshot = await getDocs(applicationsQuery);
        
        const jobIds = applicationsSnapshot.docs.map(doc => doc.data().jobId).filter(Boolean);
        const jobsData: Job[] = [];

        for (const jobId of jobIds) {
          try {
            const jobDoc = await getDoc(doc(db, 'jobs', jobId));
            if (jobDoc.exists()) {
              const jobData = jobDoc.data();
              const application = applicationsSnapshot.docs.find(
                app => app.data().jobId === jobId
              );
              
              const appliedAt = application?.data().appliedAt;
              
              jobsData.push({
                id: jobDoc.id,
                title: jobData.title || 'Unknown Job',
                company: jobData.company || jobData.posterName || 'Unknown Company',
                location: jobData.location || 'Not specified',
                salary: jobData.salary || 'Not specified',
                tech: jobData.tech || '',
                type: jobData.type || 'full-time',
                remote: jobData.remote || 'No',
                timestamp: appliedAt || new Date(),
              });
            }
          } catch (error) {
            console.error(`Error fetching job ${jobId}:`, error);
          }
        }

        // Combine Jobs and Courses for "Recent Activity"
        const combinedActivity = [
          ...jobsData.map(job => ({
            type: 'job',
            title: `Applied to ${job.title}`,
            subtitle: job.company,
            date: job.timestamp,
            icon: <Briefcase size={14} color="white" />,
            color: '#3b82f6'
          })),
          ...(userData.registeredCourses || []).map((course: any) => ({
            type: 'course',
            title: `Enrolled in ${course.title}`,
            subtitle: 'Learning in progress',
            date: new Date(), // Fallback if no date in course
            icon: <BookOpen size={14} color="white" />,
            color: '#10b981'
          }))
        ];

        // Sort by date desc
        combinedActivity.sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        setRecentActivity(combinedActivity.slice(0, 5)); // Top 5
        setAppliedJobsList(jobsData);
      } catch (error) {
        console.error('Error fetching applied jobs:', error);
      }
    };
    fetchAppliedJobs();
  }, [userData, user]);

  // 3. Handle Profile Picture Upload
  const handleImageUpload = async (file: File) => {
    if (!file || !user) return;
    
    setIsUploading(true);
    try {
      const base64String = await resizeAndConvertToBase64(file);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { photoURL: base64String });

      setUserData((prev) => (prev ? { ...prev, photoURL: base64String } : null));
      setSuccess('Profile picture updated!');
      setShowUploadModal(false);
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      console.error("Failed to upload image:", error);
      setError("Image too large or invalid format.");
    } finally {
      setIsUploading(false);
    }
  };

  // 4. Other Handlers
  const handleSave = async () => {
    if (!userData || !editData) return;
    try {
      const userRef = doc(db, 'users', userData.uid);
      await updateDoc(userRef, editData as any);
      setUserData({ ...userData, ...editData });
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save changes');
    }
  };

  const handleAddSkill = () => {
    if (!userData || !newSkill.trim()) return;
    if (userData.skills?.includes(newSkill.trim())) {
      setError('Skill already added!');
      setTimeout(() => setError(null), 3000);
      return;
    }
    const updatedSkills = [...(userData.skills || []), newSkill.trim()];
    setUserData({ ...userData, skills: updatedSkills });
    updateDoc(doc(db, 'users', userData.uid), { skills: updatedSkills });
    setNewSkill('');
    setShowAddSkillModal(false);
    setSuccess('Skill added successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleRemoveSkill = (skill: string) => {
    if (!userData) return;
    const updatedSkills = userData.skills?.filter(s => s !== skill) || [];
    setUserData({ ...userData, skills: updatedSkills });
    updateDoc(doc(db, 'users', userData.uid), { skills: updatedSkills });
    setSuccess('Skill removed!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setSuccess('Profile link copied to clipboard!');
    setTimeout(() => setSuccess(null), 3000);
    setShowShareModal(false);
  };

  const handleDownload = () => {
    // Logic to download the saved file
    if (!fileInputRef.current?.files?.[0]) return;
    const file = fileInputRef.current.files[0];
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
  };

  // --- RENDER ---
  if (loading) return <LoadingSpinner />;
  
  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.center}>
          <h2>Please log in to view profile</h2>
          <Link to="/signin" style={styles.primaryBtnLink}>
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!userData) return <LoadingSpinner />;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      handleImageUpload(uploadedFile);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div style={styles.container}>
      
      {/* NAVIGATION */}
      <nav className="navbar-container2">
        <div className="navbar-logo2">
          <img src="src/assets/img/logo2.png" className="logo2" alt="Logo" />
        </div>
        <ul className="navbar-links2">
          <li>
            <NavLink to="/courses" className={({ isActive }) => `nav-link-item2 ${isActive ? 'active' : ''}`}>
              <BookOpen size={20} className="nav-icon2" /> Course
            </NavLink>
          </li>
          <li>
            <NavLink to="/jobs" className={({ isActive }) => `nav-link-item2 ${isActive ? 'active' : ''}`}>
              <Briefcase size={20} className="nav-icon2" /> Jobs
            </NavLink>
          </li>
          <li>
            <NavLink to="/ai" className={({ isActive }) => `nav-link-item2 chatbot-link2 ${isActive ? 'active' : ''}`}>
              <MessageSquare size={20} className="nav-icon2" /> Chatbot AI
            </NavLink>
          </li>
        </ul>
        <div className="profile-container">
          <button className="profile-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt="Profile" className="profile-img" />
            ) : (
              <FaUser size={24} color="#fff" />
            )}
          </button>
        </div>
        <div className="divider2"></div>
        <div className="navbar-actions">
          <button className="signOut-button">
            <Link to="/signin">Sign Out</Link>
          </button>
        </div>
      </nav>

      {/* ALERTS */}
      {success && (
        <div style={{ ...styles.alert, background: '#10b981' }}>
          <CheckCircle size={16} /> {success}
        </div>
      )}
      {error && (
        <div style={{ ...styles.alert, background: '#ef4444' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* HERO SECTION */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.profileHeader}>
            <div style={styles.profileImageWrapper}>
              <img
                src={userData.photoURL || 'https://i.pinimg.com/736x/18/b5/b5/18b5b599bb873285bd4def283c0d3c09.jpg'}
                alt="Profile"
                style={styles.profileImage}
              />
              <button onClick={() => setShowUploadModal(true)} style={styles.cameraBtn} title='btn'>
                <Camera size={16} />
              </button>
            </div>
            <div style={styles.profileInfo}>
              <div style={styles.nameSection}>
                <h1 style={styles.name}> 
                  {userData?.firstName && userData?.lastName
                    ? `${userData.firstName} ${userData.lastName}`
                    : userData.displayName || 'User'}
                </h1>
                <div style={styles.roleTag}>
                    <User size={12} /> {userData?.role}
                </div>
                <p style={styles.title}>{userData?.company || 'Aspiring Professional'}</p>
                <ProfileStrengthIndicator strength={appliedJobsList.length > 0 ? Math.min(100, appliedJobsList.length * 10) : (userData?.appliedJobs ? Math.min(100, userData.appliedJobs * 5) : 0)} />
              </div>
            </div>
            <div style={styles.actions}>
              <div style={styles.primaryActions}>
                {isEditing ? (
                  <>
                    <button onClick={handleSave} style={styles.saveBtn}>
                      <Save size={16} /> Save Changes
                    </button>
                    <button onClick={() => setIsEditing(false)} style={styles.cancelBtn}>
                      <X size={16} /> Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsEditing(true)} style={styles.editBtn}>
                      <Edit3 size={16} /> Edit Profile
                    </button>
                    <button onClick={() => setShowShareModal(true)} style={styles.shareBtn}>
                      <Share2 size={16} /> Share
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT / STATS */}
      <div style={styles.main}>
        
        {/* Modern Stats Grid */}
        <div style={styles.statsGrid}>
          {/* 1. Applications */}
          <StatCard
            icon={<Briefcase size={22} />}
            title="Total Applications"
            value={appliedJobsList.length}
            color="#3b82f6" // Blue
            change={appliedJobsList.length > 0 ? (10 + appliedJobsList.length * 2) : 0}
            subLabel="Active Opportunities"
          />

          {/* 2. Courses Enrolled */}
            <StatCard
            icon={<GraduationCap size={22} />}
            title={userData?.role === 'Coordinator' ? 'Courses Created' : 'Courses Enrolled'}
            value={
              userData?.role === 'Coordinator' 
              ?  1
              : userData.coursesEnrolled || enrolledCourses.length || 0
            }
            color="#10b981" // Emerald
            change={
              userData?.role === 'Coordinator'
              ? (userData.coursesCreated || 0) > 0
                ? Number(((userData.coursesCreated || 0) * 5.5).toFixed(1))
                : 0
              : (userData.coursesEnrolled || enrolledCourses.length) > 0
                ? Number(((userData.coursesEnrolled || enrolledCourses.length) * 5.5).toFixed(1))
                : 0
            }
            subLabel={userData?.role === 'Coordinator' ? 'Courses Published' : 'Skills Gained'}
            />

          {/* 3. Skills */}
          <StatCard
            icon={<Zap size={22} />}
            title="Skill Proficiency"
            value={userData?.skills?.length || 0}
            color="#8b5cf6" // Violet
            change={
              userData?.skills?.length > 0
                ? Math.ceil(userData.skills.length / 4)
                : 0
            }
            suffix=" New"
            subLabel="Technologies Mastered"
          />
        </div>

        {/* Tabs */}
        <div style={styles.tabsContainer}>
          <div style={styles.tabs}>
            {[
              { key: 'overview', label: 'Overview', icon: <User size={16} /> },
              // { key: 'courses', label: 'My Courses', icon: <BookOpen size={16} /> },
              { key: 'jobs', label: 'Jobs', icon: <Briefcase size={16} /> },
              { key: 'skills', label: 'Skills', icon: <Award size={16} /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab.key ? styles.activeTab : styles.inactiveTab),
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        <div style={styles.tabContent}>
          
          {/* --- MODERN PROFESSIONAL OVERVIEW TAB --- */}
          {activeTab === 'overview' && (
            <div style={styles.overviewGrid}>
              
              {/* Left Column: Bio & Activity */}
              <div style={styles.overviewLeft}>
                
                {/* About Me Section (Clean Card) */}
                <div style={styles.contentCard}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>About Me</h3>
                    {isEditing && <span style={styles.badge}>Editing Mode</span>}
                  </div>
                  {isEditing ? (
                    <textarea
                      value={editData.bio || ''}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      style={styles.textarea}
                      placeholder="Write a professional bio..."
                    />
                  ) : (
                    <div style={styles.bioContainer}>
                      {userData.bio ? (
                        <p style={styles.bioText}>{userData.bio}</p>
                      ) : (
                        <div style={styles.emptyBioState}>
                          <p>Tell recruiters about yourself.</p>
                          <button onClick={() => setIsEditing(true)} style={styles.linkButton}>Add Bio</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Recent Activity Timeline (Modern Feed) */}
                <div style={styles.contentCard}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardTitle}>Recent Activity</h3>
                    <button style={styles.iconButton}><MoreHorizontal size={18} /></button>
                  </div>
                  <div style={styles.timelineContainer}>
                    {recentActivity.length > 0 ? (
                      recentActivity.map((item, index) => (
                        <TimelineItem 
                          key={index}
                          title={item.title}
                          subtitle={item.subtitle}
                          date={formatDate(item.date)}
                          icon={item.icon}
                          color={item.color}
                          isLast={index === recentActivity.length - 1}
                        />
                      ))
                    ) : (
                      <div style={styles.emptyTimeline}>
                        <Clock size={40} color="#e2e8f0" strokeWidth={1.5} />
                        <p style={{marginTop: 10, color: '#94a3b8'}}>No recent activity.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Details & CTA */}
              <div style={styles.overviewRight}>
                
                {/* Profile Details Card */}
                <div style={styles.detailsCard}>
                  <h3 style={styles.cardTitle}>Contact & Info</h3>
                  <div style={styles.detailsList}>
                    <div style={styles.detailItem}>
                      <div style={styles.detailIconBox}><Mail size={16} /></div>
                      <div>
                        <span style={styles.detailLabel}>Email</span>
                        <p style={styles.detailValue}>{userData.email}</p>
                      </div>
                    </div>
                    
                    <div style={styles.detailItem}>
                      <div style={styles.detailIconBox}><MapPin size={16} /></div>
                      <div>
                        <span style={styles.detailLabel}>Location</span>
                        <p style={styles.detailValue}>{userData.location || 'Remote'}</p>
                      </div>
                    </div>
                    <div style={styles.detailItem}>
                      <div style={styles.detailIconBox}><Calendar size={16} /></div>
                      <div>
                        <span style={styles.detailLabel}>Joined</span>
                        <p style={styles.detailValue}>{formatDate(userData.createdAt || new Date())}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* "What's Next" CTA Card */}
                <div style={styles.ctaCard}>
                  <div style={styles.ctaContent}>
                    <div style={styles.ctaHeader}>
                        <div style={styles.ctaIconBadge}>
                            <FileText size={20} color="white" />
                        </div>
                        <h3 style={{fontSize: 16, fontWeight: 700, margin: 0, color: 'white'}}>Upload CV</h3>
                    </div>
                    <p style={{color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.5, margin: '10px 0'}}>
                        Boost your visibility by 50% with an updated resume.
                    </p>
                    <div>
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx"
      />

      {!file ? (
        // Initial Upload Button
        <button style={styles.ctaButton} onClick={handleUploadClick}>
          Upload Now <ChevronRight size={14} />
        </button>
      ) : (
        // Changed Download Button
        <button style={styles.downloadButton} onClick={handleDownload}>
          Download Your CV <Download size={14} />
        </button>
      )}
    </div>
                  </div>
                  {/* Decorative element */}
                  <div style={styles.ctaDecoration}></div>
                </div>

              </div>
            </div>
          )}
          {/* --- END OVERVIEW --- */}

      {activeTab === 'courses' && (
  <div>
    <div style={styles.sectionHeader}>
      <h2 style={styles.sectionTitle}>
        {userData?.role === 'Coordinator' ? 'My Created Courses' : 'My Enrolled Courses'}
      </h2>
      <p style={styles.sectionSubtitle}>
        {userData?.role === 'Coordinator' ? 'Manage your teaching content' : 'Continue your learning journey'}
      </p>
    </div>

    {/* Logic Helper Variables */}
    {(() => {
      const isCoordinator = userData?.role === 'Coordinator';
      const rawData = isCoordinator ? userData?.coursesCreated : enrolledCourses;
      const displayCourses = Array.isArray(rawData) ? rawData : [];

      if (displayCourses.length === 0) {
        return (
          <div style={styles.emptyState}>
            <BookOpen size={48} color="#d1d5db" />
            <h3 style={styles.emptyTitle}>
              {isCoordinator ? "You haven't created any courses" : "No enrolled courses yet"}
            </h3>
            <Link to={isCoordinator ? "/add-course" : "/courses"} style={styles.browseCoursesBtn}>
              {isCoordinator ? "Create a Course" : "Browse Courses"}
            </Link>
          </div>
        );
      }

      return (
        <div style={styles.coursesGrid}>
          {displayCourses.map((course: any, i: number) => {
            // Safety: define the link path once
            const courseId = course.id || course._id || i;
            const courseLink = isCoordinator 
              ? `/manage-course/${courseId}` 
              : `/courses/${courseId}`;

            return (
              <div key={courseId} style={styles.courseCard}>
                <div style={styles.courseImageWrapper}>
                  <img
                    src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop&crop=center'}
                    alt={course.title}
                    style={styles.courseImage}
                  />
                </div>
                
                <div style={styles.courseContent}>
                  <h3 style={styles.courseTitle}>{course.title}</h3>
                  
                  <div style={styles.courseMeta}>
                    <div style={styles.courseMetaItem}>
                      <Clock size={12} />
                      <span>{course.duration || 'N/A'}</span>
                    </div>
                    
                    <div style={styles.courseMetaItem}>
                      <User size={12} />
                      <span style={{ fontSize: '12px' }}>
                        {isCoordinator 
                          ? `${course.enrolledCount || 0} Students` 
                          : (course.instructor || 'Instructor')}
                      </span>
                    </div>
                  </div>

                  <div style={styles.courseFooter}>
                    <span style={styles.coursePrice}>
                      {(!course.price || course.price === 0 || course.price === 'Free') 
                        ? 'Free' 
                        : `$${course.price}`}
                    </span>
                    
                    <Link to={courseLink} style={styles.viewCourseBtn}>
                      {isCoordinator ? 'Edit/Manage' : 'View Course'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    })()}
  </div>
)}
          {activeTab === 'jobs' && (
            <div>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Job Applications</h2>
                <p style={styles.sectionSubtitle}>Track your career opportunities</p>
              </div>
              {appliedJobsList.length > 0 ? (
                <div style={styles.jobsGrid}>
                  {appliedJobsList.map((job, i) => (
                    <div key={i} style={styles.jobCard}>
                      <div style={styles.jobHeader}>
                        <div style={styles.jobInfo}>
                          <h3 style={styles.jobTitle}>{job.title}</h3>
                          <p style={styles.jobCompany}>{job.company}</p>
                          <p style={styles.jobLocation}>
                            <MapPin size={14} /> {job.location}
                          </p>
                        </div>
                        <div style={styles.jobMeta}>
                          <span style={styles.jobSalary}>{job.salary}</span>
                          <span style={styles.jobType}>{job.type}</span>
                        </div>
                      </div>
                      <div style={styles.jobFooter}>
                        <span style={styles.jobStatus}>Applied</span>
                        <span style={styles.jobDate}>Applied {formatDate(job.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <Briefcase size={48} color="#d1d5db" />
                  <h3 style={styles.emptyTitle}>No jobs found</h3>
                </div>
              )}
            </div>
          )}

          {activeTab === 'skills' && (
            <div>
              <div style={styles.sectionHeader}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div>
                    <h2 style={styles.sectionTitle}>Skills & Expertise</h2>
                    <p style={styles.sectionSubtitle}>Technologies and tools you are proficient in</p>
                  </div>
                  <button
                    onClick={() => setShowAddSkillModal(true)}
                    style={styles.modernAddBtn}
                  >
                    <Plus size={18} /> 
                    <span>Add Skill</span>
                  </button>
                </div>
              </div>

              {userData.skills && userData.skills.length > 0 ? (
                <div style={styles.modernSkillsGrid}>
                  {userData.skills.map((skill, i) => (
                    <SkillTag
                      key={i}
                      skill={skill}
                      onRemove={() => handleRemoveSkill(skill)}
                      isEditing={isEditing}
                    />
                  ))}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <Zap size={48} color="#cbd5e1" />
                  <h3 style={styles.emptyTitle}>No skills added yet</h3>
                  <p style={{color: '#94a3b8', marginBottom: 20}}>Add skills to highlight your strengths to recruiters.</p>
                  <button onClick={() => setShowAddSkillModal(true)} style={styles.secondaryBtn}>
                    Add Your First Skill
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      
      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Update Profile Picture"
      >
        <label 
          style={{
            ...styles.uploadArea,
            opacity: isUploading ? 0.5 : 1,
            cursor: isUploading ? 'wait' : 'pointer'
          }}
        >
          <div style={styles.uploadIcon}>
            <Upload size={48} color="#3b82f6" />
          </div>
          
          <p style={styles.uploadText}>
            {isUploading 
              ? "Processing image..." 
              : "Click here to choose a new profile picture"
            }
          </p>
          
          <input
            type="file"
            accept="image/*"
            disabled={isUploading}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleImageUpload(e.target.files[0]);
              }
            }}
            style={{ display: 'none' }} 
          />
        </label>
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Profile"
      >
         <div style={styles.shareContent}>
           <p style={styles.shareText}>Copy the link below to share your profile</p>
           <button onClick={handleShare} style={styles.copyBtn}>
             Copy Link
           </button>
         </div>
      </Modal>

      {/* Add Skill Modal */}
      <Modal
        isOpen={showAddSkillModal}
        onClose={() => setShowAddSkillModal(false)}
        title="Add New Skill"
      >
        <div style={styles.addSkillForm}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Skill Name</label>
            <input
              type="text"
              placeholder="e.g., React, Python"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              style={styles.formInput}
            />
          </div>
          <div style={styles.modalActions}>
            <button onClick={() => setShowAddSkillModal(false)} style={styles.cancelBtn}>
              Cancel
            </button>
            <button onClick={handleAddSkill} style={styles.saveBtn}>
              <Plus size={16} /> Add Skill
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

export default ProfilePage;

// --- MODERN STYLES OBJECT ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: "'Inter', sans-serif",
    background: '#f8fafc', // Very light slate background
    minHeight: '100vh',
    position: 'relative',
    padding:'20px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#f8fafc'
  },
  spinnerWrapper: {
    position: 'relative',
    width: 60,
    height: 60
  },
  spinner: {
    width: 60,
    height: 60,
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    position: 'absolute'
  },
  spinnerInner: {
    width: 40,
    height: 40,
    border: '3px solid transparent',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1.5s linear infinite reverse',
    position: 'absolute',
    top: 10,
    left: 10
  },
  loadingText: {
    marginTop: 20,
    color: '#64748b',
    fontWeight: 500
  },
  center: {
    textAlign: 'center',
    padding: 60,
    color: '#6b7280',
    fontSize: 18,
    fontWeight: 500
  },
  primaryBtnLink: {
    display: 'inline-block', marginTop: '20px', padding: '12px 24px', 
    background: '#3a25ff', color: 'white', borderRadius: '8px', 
    textDecoration: 'none', fontWeight: 600
  },
  alert: {
    position: 'fixed',
    top: 20,
    right: 20,
    padding: '16px 24px',
    color: 'white',
    borderRadius: 12,
    zIndex: 1000,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
  },
  
  // --- HERO SECTION ---
  hero: {
    background: 'linear-gradient(180deg, #fff 0%, #f1f5f9 100%)',
    padding: '200px 40px 60px',
    borderRadius: '0 0 40px 40px',
    position: 'relative',
    borderBottom: '1px solid #e2e8f0'
  },
  heroContent: {
    maxWidth: 1200,
    margin: '0 auto',
    position: 'relative',
    zIndex: 2,
  },
  profileHeader: {
    display: 'flex',
    gap: 32,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  profileImageWrapper: {
    position: 'relative',
    flexShrink: 0,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: "50%",
    objectFit: "cover",
    border: "4px solid #fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  cameraBtn: {
    position: "absolute",
    bottom: 5,
    right: 5,
    background: "#3a25ff",
    color: "white",
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid white",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  profileInfo: {
    flex: 1,
    minWidth: 300,
  },
  nameSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8
  },
  name: {
    fontFamily: "'Inter', sans-serif",
    fontSize: "2.5rem",
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
    margin: 0,
  },
  roleTag: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'rgba(231, 224, 254, 0.58)',
      color: '#3a25ff',
      padding: '4px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600
  },
  title: {
    fontSize: 18,
    color: '#64748b',
    margin: '0 0 12px 0',
    fontWeight: 500
  },
  
  // --- STRENGTH BAR ---
  strengthContainer: {
    width: '100%',
    maxWidth: 300,
    marginTop: 8
  },
  strengthHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  strengthLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 600
  },
  strengthValue: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0f172a'
  },
  strengthBar: {
    height: 6,
    background: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.5s ease'
  },
  
  // --- BUTTONS ---
  actions: {
    display: 'flex',
    gap: 12,
  },
  primaryActions: {
    display: 'flex',
    gap: 12
  },
  editBtn: {
    padding: '10px 20px',
    background: '#3a25ff',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
  },
  shareBtn: {
    padding: '10px 20px',
    background: 'white',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    transition: 'all 0.2s',
  },
  saveBtn: {
    padding: '10px 20px',
    background: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
  },
  cancelBtn: {
    padding: '10px 20px',
    background: 'white',
    color: '#ef4444',
    border: '1px solid #fee2e2',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
  },

  main: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '40px 20px'
  },

  // --- MODERN STAT CARD STYLES ---
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 24,
    marginBottom: 40
  },
  modernStatCard: {
    background: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    border: '1px solid #f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  statTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  statIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 8px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  statTitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: 500,
    margin: 0
  },
  statValue: {
    fontSize: 32,
    fontWeight: 800,
    color: '#0f172a',
    margin: '4px 0 0',
    letterSpacing: '-0.02em'
  },
  statSubLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4
  },

  // --- TABS ---
  tabsContainer: {
    width: "100%",
    marginBottom: 24,
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 0
  },
  tabs: {
    display: "flex",
    gap: 32,
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 0",
    fontWeight: 600,
    fontSize: 14,
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    background: "transparent",
    color: "#64748b",
    transition: "all 0.2s ease",
  },
  activeTab: {
    color: "#0f172a",
    borderBottom: "2px solid #0f172a",
  },
  inactiveTab: {
    color: "#64748b",
  },
  tabContent: {
    marginTop: 20,
  },
  
  // --- OVERVIEW LAYOUT ---
  overviewGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr", 
    gap: 24,
    alignItems: 'start',
  },
  overviewLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24
  },
  overviewRight: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24
  },
  contentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
    border: '1px solid #f1f5f9'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#0f172a',
    margin: 0
  },
  badge: {
    fontSize: 11,
    fontWeight: 700,
    backgroundColor: '#fff7ed',
    color: '#0c38eaff',
    padding: '2px 8px',
    borderRadius: 4,
    textTransform: 'uppercase'
  },
  iconButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8'
  },
  bioContainer: {
    minHeight: 60
  },
  bioText: {
    fontSize: 15,
    lineHeight: 1.6,
    color: '#334155',
    margin: 0
  },
  emptyBioState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 0',
    color: '#94a3b8',
    gap: 8
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    fontSize: 14,
    textDecoration: 'underline'
  },
  textarea: {
    width: '100%',
    padding: 16,
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    fontSize: 14,
    resize: 'vertical',
    minHeight: 100,
    fontFamily: 'inherit'
  },

  // --- MODERN TIMELINE ---
  timelineContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  timelineItem: {
    display: 'flex',
    gap: 16,
    position: 'relative',
    paddingBottom: 0
  },
  timelineLeft: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: 32
  },
  timelineIconCircle: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    zIndex: 2,
    flexShrink: 0,
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  timelineLine: {
    width: 2,
    flex: 1,
    background: '#f1f5f9',
    marginTop: 4,
    marginBottom: 4,
    minHeight: 20
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 24
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1e293b',
    margin: 0
  },
  timelineDate: {
    fontSize: 12,
    color: '#94a3b8',
    whiteSpace: 'nowrap'
  },
  timelineSubtitle: {
    fontSize: 13,
    color: '#64748b',
    margin: 0
  },
  emptyTimeline: {
    textAlign: 'center',
    padding: '30px 0',
    color: '#94a3b8',
    fontSize: 14,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },

  // --- DETAILS CARD ---
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
    border: '1px solid #f1f5f9'
  },
  detailsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginTop: 16
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  detailIconBox: {
    width: 32,
    height: 32,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    flexShrink: 0
  },
  detailLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 600,
    marginBottom: 0,
    display: 'block',
    textTransform: 'uppercase'
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: 500,
    margin: 0,
    wordBreak: 'break-all'
  },

  // --- CTA CARD ---
  ctaCard: {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    borderRadius: 16,
    padding: 24,
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 20px rgba(15, 23, 42, 0.2)'
  },
  ctaContent: {
      position: 'relative',
      zIndex: 2
  },
  ctaHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8
  },
  ctaIconBadge: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButton: {
    backgroundColor: 'white',
    color: '#0f172a',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    transition: 'transform 0.2s'
  },
  ctaDecoration: {
      position: 'absolute',
      top: -20,
      right: -20,
      width: 100,
      height: 100,
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '50%',
      zIndex: 1
  },

  // --- GENERAL SECTION STYLES ---
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    margin: 0
  },
  sectionHeader: {
    marginBottom: 24
  },
  
  // --- SKILLS GRID ---
  modernSkillsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 16,
  },
  skillCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
    transition: 'all 0.2s',
  },
  skillColorStrip: {
    width: 4,
    height: '100%',
    flexShrink: 0
  },
  skillInfo: {
    padding: '10px 12px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 2
  },
  skillHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  skillName: {
    fontWeight: 600,
    fontSize: 14,
    color: '#1e293b',
  },
  skillMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  skillDot: {
    width: 6,
    height: 6,
    borderRadius: '50%'
  },
  skillLevelText: {
    fontSize: 11,
    fontWeight: 600,
    opacity: 0.8
  },
  deleteSkillBtn: {
    background: 'none',
    color: '#94a3b8',
    border: 'none',
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  modernAddBtn: {
    backgroundColor: '#0f172a',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 20,
    fontWeight: 600,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.15)',
  },
  secondaryBtn: {
    backgroundColor: 'white',
    color: '#334155',
    border: '1px solid #cbd5e1',
    padding: '10px 20px',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
  },
  
  // --- CARDS (Jobs/Courses) ---
  jobsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 20
  },
  jobCard: {
    background: 'white',
    borderRadius: 12,
    padding: 20,
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    transition: 'transform 0.2s',
  },
  jobHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  jobInfo: {
    flex: 1
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 700,
    margin: 0,
    color: '#0f172a'
  },
  jobCompany: {
    fontSize: 14,
    color: '#64748b',
    margin: '4px 0 0 0'
  },
  jobLocation: {
    fontSize: 12,
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginTop: 8
  },
  jobMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    fontSize: 12,
  },
  jobSalary: {
    background: '#f1f5f9',
    color: '#475569',
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600
  },
  jobType: {
    border: '1px solid #e2e8f0',
    color: '#64748b',
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 11,
  },
  jobFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 12,
    color: '#64748b',
    borderTop: '1px solid #f8fafc',
    paddingTop: 16
  },
  jobStatus: {
    background: '#ecfdf5',
    color: '#059669',
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    textAlign: 'center',
    color: '#94a3b8',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    border: '2px dashed #e2e8f0'
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#64748b',
    margin: '16px 0 8px 0'
  },
  
  // --- MODALS ---
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: 'white',
    borderRadius: 20,
    padding: 24,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    color: '#0f172a'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 24
  },
  modalBody: {
    padding: '0 4px' // slight padding for scrollbar
  },
  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 40,
    border: '2px dashed #cbd5e1',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    transition: 'all 0.2s ease',
  },
  uploadIcon: {
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center' as const,
  },
  shareContent: {
    textAlign: 'center',
    padding: '20px 0'
  },
  shareText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24
  },
  copyBtn: {
    padding: '12px 32px',
    background: '#0f172a',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    margin: '0 auto'
  },
  addSkillForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  },
  formLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#334155'
  },
  formInput: {
    padding: '12px 16px',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8
  },
  coursesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 20
  },
  courseCard: {
    background: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #f1f5f9',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  },
  courseImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 140,
    overflow: 'hidden'
  },
  courseImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  certificateBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: 'rgba(16, 185, 129, 0.95)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  courseContent: {
    padding: 16
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 8px 0',
    lineHeight: 1.4,
    height: 42, 
    overflow: 'hidden'
  },
  courseMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
    alignItems: 'center'
  },
  courseMetaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: '#64748b'
  },
  courseFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #f1f5f9'
  },
  coursePrice: {
    fontSize: 16,
    fontWeight: 700,
    color: '#059669'
  },
  viewCourseBtn: {
    padding: '6px 16px',
    background: '#f1f5f9',
    color: '#334155',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 0.2s ease'
  },
  browseCoursesBtn: {
    display: 'inline-block',
    marginTop: 16,
    padding: '12px 24px',
    background: '#0f172a',
    color: 'white',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
  }
};