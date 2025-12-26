import {
  FaInstagram,
  FaFacebookF,
  FaTwitter,
  FaYoutube,
  FaFileAlt,
  FaTools,
  FaPlusSquare,
  FaUserTag,
} from 'react-icons/fa';
import { Video, Link as LucideLink, Image } from 'lucide-react';
// Courses page: courses, exercises, and shared notes hub
import { MessageSquare, BookOpen, Briefcase, Users, FileText, Award, Star, Clock, Play, Download, Eye, ThumbsUp, Calendar, ChevronLeft, CheckCircle, PlayCircle, FileVideo, User, Globe, Scroll, Book, FlaskConical, Languages, ThumbsDown, Send, X, Reply } from 'lucide-react';
import React, { useState, useEffect, useRef } from "react";
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, addDoc, arrayUnion, increment, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Courses.css';
import { useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faDownload, faEye, faUpload, faFilePdf, faFileWord } from '@fortawesome/free-solid-svg-icons';
import { useAuthState } from 'react-firebase-hooks/auth';
import { UserService, CourseService, ExercisesService, NotesService } from '../firebase/src/firebaseServices';
import toast, { Toaster } from 'react-hot-toast';
import {
  FaUser,
  FaBriefcase,
  FaBook,
  FaFileDownload,
  FaPencilAlt,
  FaSignOutAlt,
} from 'react-icons/fa';
import { FaPaintBrush, FaShieldAlt, FaChartLine, FaCode, FaMobileAlt } from 'react-icons/fa';
import { Tag, Bookmark } from 'lucide-react';
import { SECTIONS } from './CoursesData';
import { File, Plus } from 'lucide-react';

// --- INTERFACES ---
interface UserData {
  id: string;
  uid: string;
  email: string;
  role: 'Participant' | 'Coordinator';
  displayName: string;
  photoURL: string | null;
  phone: string | null;
  location: string | null;
  createdAt: Date;
  appliedJobs: number;
  coursesEnrolled: number;
  coursesCreated: number;
  sharedNotes: number;
  downloads: number;
  exercisesCompleted: number;
  completedExerciseIds?: string[];
  cvUploaded: boolean;
  cvDetails: any;
  registeredCourses: any[];
  appliedJobsList: any[];
  interestedJobs: any[];
  skills: string[];
  firstName?: string;
  lastName?: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  instructor: string;
  rating: number;
  Participants: number;
  duration: string;
  level: string;
  price: string;
  category?: string; 
  originalPrice?: string;
  modules: number;
  certificate: boolean;
  lessons: Lesson[];
  overview: string;
  requirements: string[];
  whatYouLearn: string[];
  progress?: number;
  courseLinks?: {
    type: 'video' | 'document' | 'image' | 'other';
    title: string;
    url: string;
  }[];
  reviews?: {
    Participant: string;
    avatar: string;
    rating: number;
    comment: string;
    date: string;
  }[];
  CoordinatorId?: string;
}

interface Lesson {
  id: number;
  title: string;
  duration: string;
  videoUrl: string;
  completed: boolean;
  description: string;
  quiz?: {
    questions: {
      question: string;
      options: string[];
      correct: number;
    }[];
  };
}

interface ExerciseQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface Exercise {
  id: number;
  title: string;
  type: string;
  difficulty: string;
  duration: string;
  points: number;
  completed?: boolean;
  questions?: ExerciseQuestion[];
  // optional fields used elsewhere
  progress?: number;
  CoordinatorId?: string;
  CoordinatorName?: string;
  createdAt?: any;
  rating?: number;
  reviews?: number;
  ParticipantsCount?: number;
}

interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  createdAt: any;
  replyTo?: string;
}

interface SharedNote {
  id: string;
  title: string;
  author: string;
  uploadDate: string;
  profilePic: string;
  course: string;
  category?: string; // For filtering by section
  downloads: number;
  views: number;
  fileType: string;
  size: string;
  preview: string;
  rating: number;
  tags: string[];
  comments: number;
  fileUrl: string;
  userId: string;
  description: string;
  likes?: number;
  dislikes?: number;
  likedBy?: string[];
  dislikedBy?: string[];
  commentCount?: number;
}



interface SectionType {
  id: string;
  title: string;
  icon: React.ReactNode;
  courses: Course[];
  exercises: Exercise[];
  sharedNotes: SharedNote[];
}

interface ExercisesProps {
  currentSection: SectionType;
  activeTab: string;
}
const faPaintBrush = <FaPaintBrush />;
const faShieldAlt = <FaShieldAlt />;
const faChartLine = <FaChartLine />;
const faCode = <FaCode />;
const faMobileAlt = <FaMobileAlt />;

// --- INTERFACES ---
interface UserData {
  id: string;
  uid: string;
  email: string;
  role: 'Participant' | 'Coordinator';
  displayName: string;
  photoURL: string | null;
  phone: string | null;
  location: string | null;
  createdAt: Date;
  appliedJobs: number;
  coursesEnrolled: number;
  coursesCreated: number;
  sharedNotes: number;
  downloads: number;
  exercisesCompleted: number;
  completedExerciseIds?: string[];
  cvUploaded: boolean;
  cvDetails: any;
  registeredCourses: any[];
  appliedJobsList: any[];
  interestedJobs: any[];
  skills: string[];
  firstName?: string;
  lastName?: string;
}

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  instructor: string;
  rating: number;
  Participants: number;
  duration: string;
  level: string;
  price: string;
  category?: string; // ✅ للتصفية حسب القسم
  originalPrice?: string;
  modules: number;
  certificate: boolean;
  lessons: Lesson[];
  overview: string;
  requirements: string[];
  whatYouLearn: string[];
  progress?: number;
  courseLinks?: {
    type: 'video' | 'document' | 'image' | 'other';
    title: string;
    url: string;
  }[];
  reviews?: {
    Participant: string;
    avatar: string;
    rating: number;
    comment: string;
    date: string;
  }[];
  CoordinatorId?: string;
}

interface Lesson {
  id: number;
  title: string;
  duration: string;
  videoUrl: string;
  completed: boolean;
  description: string;
  quiz?: {
    questions: {
      question: string;
      options: string[];
      correct: number;
    }[];
  };
}

interface ExerciseQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface Exercise {
  id: number;
  title: string;
  type: string;
  difficulty: string;
  duration: string;
  points: number;
  completed?: boolean;
  questions?: ExerciseQuestion[];
  // optional fields used elsewhere
  progress?: number;
  CoordinatorId?: string;
  CoordinatorName?: string;
  createdAt?: any;
  rating?: number;
  reviews?: number;
  ParticipantsCount?: number;
}

interface SharedNote {
  id: string;
  title: string;
  author: string;
  uploadDate: string;
  profilePic: string;
  course: string;
  downloads: number;
  views: number;
  fileType: string;
  size: string;
  preview: string;
  rating: number;
  tags: string[];
  comments: number;
  fileUrl: string;
  userId: string;
  description: string;
}

interface FormData {
  name: string;
  email: string;
  title: string;
  category: string[];
  message: string;
  attachedFile: File | null;
}

interface SectionType {
  id: string;
  title: string;
  icon: React.ReactNode;
  courses: Course[];
  exercises: Exercise[];
  sharedNotes: SharedNote[];
}

interface ExercisesProps {
  currentSection: SectionType;
  activeTab: string;
}

function Courses() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [activeTab, setActiveTab] = useState<'courses' | 'exercises' | 'sharedNotes'>('courses');
  const [viewMode, setViewMode] = useState<'courses' | 'lessons' | 'catalog'>('courses');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [viewModeE, setViewModeE] = useState<'catalog' | 'exercises' | 'exercise'>('catalog');
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<(string | number)[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState<{ correct: number; total: number } | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loadingExercise, setLoadingExercise] = useState(false);
  const [downloadedNotes, setDownloadedNotes] = useState<Record<string, boolean>>({});

  const [currentCourseSection, setCurrentCourseSection] = useState({
    id: '',
    title: '',
    icon: <></>,
    courses: [],
  });
  const [showCertificate, setShowCertificate] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<string | null>(null);
  const [mcqExpanded, setMcqExpanded] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState<(string | null)[]>([]);
  const [mcqSubmitted, setMcqSubmitted] = useState(false);
  const [mcqScore, setMcqScore] = useState<number | null>(null);
  const [exerciseAnswers, setExerciseAnswers] = useState<{ [key: string]: any }>({});
  const [user] = useAuthState(auth);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileURL, setFileURL] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  const prevSharedNotesCount = useRef<number>(0);
  const [firebaseCourses, setFirebaseCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const currentSection = SECTIONS.find(sec => sec.id === activeSection);
  const [sharedNotes, setSharedNotes] = useState<SharedNote[]>([]);
  const [sharedCount, setSharedCount] = useState(0);
  //  Single source of truth for exercises
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // If URL has ?tab=exercises (or other valid tab), open that tab automatically
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab');
      if (tab === 'exercises' || tab === 'courses' || tab === 'sharedNotes') {
        setActiveTab(tab as any);
      }
    } catch (e) { /* ignore malformed URLs */ }
  }, [location.search]);  const [allCourses, setAllCourses] = useState<(Course | Exercise)[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true); // Start true
  const [updatedCurrentSections, setUpdatedCurrentSection] = useState<Exercise | null>(null);
  const [firebaseExercises, setFirebaseExercises] = useState<Exercise[]>([]);
  const [currentSectionC, setCurrentSection] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [noteLikeState, setNoteLikeState] = useState<Record<string, 'like' | 'dislike' | null>>({});
  const [noteComments, setNoteComments] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<Record<string, string | null>>({});
  const [selectedNoteForDetail, setSelectedNoteForDetail] = useState<SharedNote | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedNoteForComments, setSelectedNoteForComments] = useState<SharedNote | null>(null);
  const [commentSort, setCommentSort] = useState<'newest' | 'oldest'>('newest');
  const [previewNote, setPreviewNote] = useState<SharedNote | null>(null);
  const commentsListenersRef = useRef<Record<string, () => void>>({});
  const noteViewedRef = useRef<Set<string>>(new Set());
  const shareCategories = useMemo(() => {
    const names = SECTIONS.map(sec => sec.title || String(sec.id));
    return Array.from(new Set(names)).filter(Boolean);
  }, []);

  // This list MUST match the values in your <select> dropdown exactly
  const categoryOptions = [
    { id: 'All', label: 'All Courses' },
    { id: 'design', label: 'Graphic Design' },
    { id: 'CyberSecurity', label: 'Cyber Security' },
    { id: 'Web-Development', label: 'Web Development' },
    { id: 'languages', label: 'Languages' },
    { id: 'History', label: 'History' },
    { id: 'Finance', label: 'Finance' },
    { id: 'mobile-development', label: 'Mobile Development' },
    { id: 'Chemistry', label: 'Chemistry' },
  ];
  ////////////////////////////////////////
  //////////////////////////////////////
  //COURSES LECTURES
  /////////////////////////////////////
  ///////////////////////////////////////

  //connection between course page and course
  const handleCourseClick = (course: any) => {
    const fullCourse: Course = {
      ...course,
      courseLinks: course.courseLinks || [],
      lessons: course.lessons || [],
      requirements: course.requirements || [],
      whatYouLearn: course.whatYouLearn || [],
      reviews: course.reviews || []
    };
    setSelectedCourse(fullCourse);
    setViewMode('courses');
    setCurrentLesson(null);
    setQuizOpen(false);
    setQuizAnswers([]);
    setQuizSubmitted(false);
    setQuizResults(null);
  };

  const handleLessonClick = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setViewMode('lessons');
    setQuizOpen(false);
    setQuizAnswers([]);
    setQuizSubmitted(false);
    setQuizResults(null);
  };

  const handleBackToCatalog = () => {
    setViewMode('catalog');
    setSelectedCourse(null);
    setCurrentLesson(null);
    setQuizOpen(false);
    setQuizAnswers([]);
    setQuizSubmitted(false);
    setQuizResults(null);
  };

  const handleBackToCourse = () => {
    setViewMode('courses');
    setCurrentLesson(null);
    setQuizOpen(false);
    setQuizAnswers([]);
    setQuizSubmitted(false);
    setQuizResults(null);
  };

  const handleShare = () => {
    if (navigator.clipboard && selectedCourse) {
      navigator.clipboard.writeText(window.location.href);
      setShareModal(true);
      setTimeout(() => setShareModal(false), 1500);
    }
  };

  const markLessonComplete = (lessonId: number) => {
    if (!selectedCourse) return;
    const updatedLessons = selectedCourse.lessons.map((lesson) =>
      lesson.id === lessonId ? { ...lesson, completed: true } : lesson
    );
    const completedCount = updatedLessons.filter((l) => l.completed).length;
    const progress = Math.round((completedCount / updatedLessons.length) * 100);
    setSelectedCourse({
      ...selectedCourse,
      lessons: updatedLessons,
      progress,
    });
    if (currentLesson && currentLesson.id === lessonId) {
      setCurrentLesson({ ...currentLesson, completed: true });
    }
  };
  // Load all courses from Firebase and format them for display
  const loadFirebaseCourses = async () => {
    try {
      setLoadingCourses(true);
      console.log('🔥 Starting to load courses from Firebase...');
      const courses = await CourseService.getAllCourses();
      console.log('🔥 Raw courses from Firebase:', courses);
      if (!courses || courses.length === 0) {
        console.log('🔥 No courses found in Firebase');
        setFirebaseCourses([]);
        return;
      }
      // Process and format each course from Firebase
      const formattedCourses: Course[] = courses.map((course: any, index: number) => {
        console.log(`🔥 Processing course ${index + 1}: "${course.title}" | Category: "${course.category}"`);
        return {
          id: parseInt(course.id) || Math.random() * 1000,
          title: course.title || 'Untitled Course',
          description: course.description || 'No description available',
          thumbnail: course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop&crop=center',
          instructor: course.instructor || course.CoordinatorName || 'Unknown Instructor',
          rating: course.rating || 0,
          Participants: course.ParticipantsCount || 0,
          duration: course.duration || 'Unknown',
          level: course.level || course.difficulty || 'Beginner',
          price: course.price || 'Free',
          category: course.category || '', // ✅ تأكد من تضمين الفئة
          originalPrice: course.originalPrice,
          modules: course.modules || course.lessons || 0,
          certificate: course.certificate || false,
          lessons: course.lessons || [],
          overview: course.overview || '',
          requirements: course.requirements || [],
          whatYouLearn: course.whatYouLearn || [],
          reviews: course.reviews || [],
          courseLinks: course.courseLinks || [],
          CoordinatorId: course.CoordinatorId,
        };
      });
      setFirebaseCourses(formattedCourses);
      console.log(`✅ Successfully loaded ${formattedCourses.length} courses from Firebase`);
      console.log('Details:', formattedCourses.map(c => ({ title: c.title, category: (c as any).category })));
    } catch (error) {
      console.error('🔥 Error loading courses:', error);
      setFirebaseCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };


  useEffect(() => {
    if (!user?.uid) return;

    let isMounted = true;

    const fetchUserData = async () => {
      try {
        const data = await UserService.getUserData(user.uid);
        if (isMounted && data) {
          setUserData(data);
          localStorage.setItem(`userData_${user.uid}`, JSON.stringify(data));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
    return () => { isMounted = false; };
  }, [user?.uid]);
  const handleEnroll = async (course: Course) => {
    if (!user) {
      alert('Please log in to enroll in this course.');
      return;
    }

    try {

      let courseId: string;
      if (typeof course.id === 'string') {
        courseId = course.id;
      } else if (typeof course.id === 'number') {
        courseId = course.id.toString();
      } else {

        courseId = `course-${Date.now()}`;
      }

      const courseData: any = {
        id: courseId,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        instructor: course.instructor,
        duration: course.duration,
        level: course.level,
        price: course.price,
        certificate: course.certificate,
        difficulty: course.level || 'Beginner',
      };

      await CourseService.enrollCourse(courseId, user.uid, courseData);


      const updatedData = await UserService.getUserData(user.uid);
      setUserData(updatedData);

      toast.success('Successfully enrolled in the course! 🎉');
    } catch (error: any) {
      console.error('Error enrolling in course:', error);
      toast.error(error.message || 'An error occurred while enrolling in the course');
    }
  };
  const isEnrolled = (course: Course): boolean => {
    if (!userData?.registeredCourses || course.id === undefined) return false;
    const courseId = typeof course.id === 'string' ? course.id : course.id.toString();
    return userData.registeredCourses.some((c: any) =>
      String(c.id) === courseId || String(c.courseId) === courseId
    );
  };

  useEffect(() => {
    loadSharedNotesFromFirebase();
    loadFirebaseCourses();
    loadFirebaseExercise();
  }, []);

  const formatNumber = (num: number) => {
    if (num === undefined || num === null) return '0';
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return '#28a745';
      case 'intermediate': return '#ffc107';
      case 'advanced': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getCurrentSectionWithFirebaseNotes = () => {
    if (!currentSection) return null;

    // Filter Firebase courses to only show courses in the current section
    const filteredFirebaseCourses = firebaseCourses.filter((course: any) => {
      const courseCategory = String(course.category || '').toLowerCase().trim();
      const activeKey = String(activeSection || '').toLowerCase().trim();
      return courseCategory && courseCategory === activeKey;
    });

    // Combine static courses with Firebase courses
    const allCourses = [
      ...currentSection.courses.map((course: any) => ({
        ...course,
        courseLinks: (course as any).courseLinks || []
      })),
      ...filteredFirebaseCourses.map((course: any) => {
        console.log('🔥 Adding Firebase course to section:', course.title, 'Category:', course.category);
        return {
          ...course,
          courseLinks: (course as any).courseLinks || []
        };
      })
    ];

    console.log(`📊 Section: ${activeSection} | Total courses: ${allCourses.length} | Firebase: ${filteredFirebaseCourses.length}`);

    const localExercises = Array.isArray(currentSection.exercises) ? currentSection.exercises : [];

    // Filter Firebase exercises precisely: match section ID or Title
    const firebaseExercisesForSection = (firebaseExercises || []).filter((ex: any) => {
      const exerciseCat = String(ex.category || ex.course || '').toLowerCase().trim();
      const currentSection = SECTIONS.find(s => s.id === activeSection);
      const sectionTitle = currentSection?.title || activeSection;
      const sectionId = currentSection?.id || activeSection;

      // Check if exercise matches current section
      const isMatch = exerciseCat === sectionId.toLowerCase() || exerciseCat === sectionTitle.toLowerCase();

      if (isMatch) {
        console.log(`📋 Exercise "${ex.title}" matches section "${sectionTitle}"`);
      }
      return isMatch;
    });

    const normalize = (ex: any) => ({
      id: ex.id,
      title: ex.title || 'Untitled Exercise',
      type: ex.type || 'General',
      difficulty: ex.difficulty || 'Easy',
      duration: ex.duration || 'Unknown',
      points: ex.points ?? 0,
      category: ex.category || '', // ✅ تضمين الـ category
      completed: !!ex.completed,
      questions: ex.questions || [],
      progress: ex.progress ?? 0,
      CoordinatorId: ex.CoordinatorId,
      CoordinatorName: ex.CoordinatorName,
      createdAt: ex.createdAt,
      rating: ex.rating,
      reviews: ex.reviews,
      ParticipantsCount: ex.ParticipantsCount,
    });
    const normalizedFirebaseExercises = firebaseExercisesForSection.map(normalize);
    const existingIds = new Set(localExercises.map((e: any) => String(e.id)));
    const mergedExercises = [
      ...localExercises,
      ...normalizedFirebaseExercises.filter((e: any) => !existingIds.has(String(e.id)))
    ];
    return {
      ...currentSection,
      sharedNotes: sharedNotes.filter(note => {
        // Filter shared notes to only show notes in the current section
        const noteCat = String(note.category || note.course || 'General').toLowerCase().trim();
        const currentSection = SECTIONS.find(s => s.id === activeSection);
        const sectionTitle = currentSection?.title || activeSection;
        const sectionId = currentSection?.id || activeSection;

        // Check if note matches current section
        const isMatch =
          noteCat === sectionId.toLowerCase() ||
          noteCat === sectionTitle.toLowerCase() ||
          noteCat === 'general';

        if (isMatch) {
          console.log(`✅ Note "${note.title}" (${noteCat}) matches section "${sectionTitle}"`);
        }
        return isMatch;
      }),
      courses: allCourses,
      exercises: mergedExercises,
    };
  };

  const updatedCurrentSection = getCurrentSectionWithFirebaseNotes();

  // Optimized filtering: precise match between course section and activeSection
  const firebaseForSection = (firebaseCourses || []).filter((course: any) => {
    const courseCategory = String(course.category || '').toLowerCase().trim();
    const currentSection = SECTIONS.find(s => s.id === activeSection);
    const sectionTitle = currentSection?.title || activeSection;
    const sectionId = currentSection?.id || activeSection;

    // Match with ID or Title
    const isMatch = courseCategory === sectionId.toLowerCase() || courseCategory === sectionTitle.toLowerCase();

    console.log(`Course "${course.title}": category="${courseCategory}" vs section="${sectionTitle}"(${sectionId}) => ${isMatch ? 'show' : 'hide'}`);

    return isMatch;
  });

  // Log filtering results for debugging
  console.log(`Filtered ${firebaseForSection.length} courses from ${firebaseCourses.length} total courses for section "${activeSection}"`);

  const courses = [
    ...currentCourseSection.courses.map((course: any) => ({
      ...course,
      courseLinks: (course as any).courseLinks || []
    })),
    ...firebaseForSection.map((course: any) => ({
      ...course,
      courseLinks: (course as any).courseLinks || []
    }))
  ];

  /////////////////////////////////////////
  //////////////////////////////////////
  //COURSES Edit
  /////////////////////////////////////
  /////////////////////////////////////
  const handleEditClick = (courseId: string) => {
    if (!user) return;
    navigate(`/edit-course?id=${courseId}`);
  };


  ////////////////////////////////////////////////////////////////
  // COMPLETE EXERCISE LOGIC (Copy & Paste this entire block)
  ////////////////////////////////////////////////////////////////

  const [userData, setUserData] = useState<UserData | any>(() => {
    // 1. Try to load from LocalStorage immediately so it doesn't show 0
    if (auth.currentUser?.uid) {
      const storageKey = `userData_${auth.currentUser.uid}`;
      const savedData = localStorage.getItem(storageKey);
      try {
        return savedData ? JSON.parse(savedData) : { exercisesCompleted: 0, completedExerciseIds: [] };
      } catch (e) {
        return { exercisesCompleted: 0, completedExerciseIds: [] };
      }
    }
    return { exercisesCompleted: 0, completedExerciseIds: [] };
  });

  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserData = async () => {
      try {
        const data = await UserService.getUserData(user.uid);
        if (data) {
          const safeData = data as any;

          const mergedData = {
            ...safeData,
            exercisesCompleted: safeData.exercisesCompleted ?? 0,
            completedExerciseIds: safeData.completedExerciseIds ?? [],
            sharedNotes: safeData.sharedNotes ?? 0
          };

          setUserData(mergedData);
          localStorage.setItem(`userData_${user.uid}`, JSON.stringify(mergedData));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (user?.uid && userData) {
      localStorage.setItem(`userData_${user.uid}`, JSON.stringify(userData));
    }
  }, [userData, user]);

  // --- END OF REPLACEMENT ---

  // 1. HELPER: Color for badges
  const getLevelColor = useCallback((level: string = ''): string => {
    if (!level) return '#6c757d';
    switch (level.trim().toLowerCase()) {
      case 'beginner': case 'beginners': case 'beginners ': case 'beginner to advanced':
        return '#28a745';
      case 'intermediate': return '#ffc107';
      case 'advanced': return '#dc3545';
      default: return '#6c757d';
    }
  }, []);

  // Force update hook
  const [, forceUpdate] = useState({});

  // 2. DATA LOADING EFFECT (Smart Merge + Timeout)
  useEffect(() => {
    if (activeTab !== "exercises") return;

    if (userData?.currentSection) {
      setCurrentSection(userData.currentSection);
    }

    let isMounted = true;

    const loadAndSyncExercises = async () => {
      if (firebaseExercises.length === 0) setLoadingExercises(true);

      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), 5000)
        );

        const firebaseData: any = await Promise.race([
          ExercisesService.getAllExercises(),
          timeoutPromise
        ]);

        if (!isMounted) return;

        // Process Data (Ensure safe types)
        const fetchedExercises = (firebaseData || []).map((ex: any) => ({
          ...ex,
          id: typeof ex.id === 'number' ? ex.id : Number(ex.id) || Date.now() + Math.floor(Math.random() * 1000),
          title: ex.title || "Exercise",
          type: ex.type || "quiz",
          difficulty: ex.difficulty || "medium",
          duration: ex.duration || "10 min",
          points: ex.points ?? 10,
          questions: ex.questions || [],
          completed: ex.completed === true,
          // Keep explicit category and derive sectionId from it when missing
          category: ex.category || '',
          sectionId: ex.sectionId ? String(ex.sectionId) : (ex.category ? String(ex.category) : undefined),
        }));

        setFirebaseExercises(fetchedExercises);

        // Smart Merge into SECTIONS
        const targetSectionId = activeSection ? String(activeSection) : null;
        if (targetSectionId) {
          const secIndex = SECTIONS.findIndex(s => String(s.id) === targetSectionId);
          if (secIndex >= 0) {
            const current = SECTIONS[secIndex];
            const exerciseMap = new Map();

            (current.exercises || []).forEach((ex: any) => exerciseMap.set(String(ex.id), ex));

            fetchedExercises.forEach((ex: any) => {
              const isMatch = String(ex.sectionId) === targetSectionId ||
                String(ex.course) === targetSectionId ||
                String(ex.CoordinatorId) === targetSectionId ||
                (!ex.sectionId && !ex.course && !ex.CoordinatorId);
              if (isMatch) exerciseMap.set(String(ex.id), ex);
            });

            SECTIONS[secIndex].exercises = Array.from(exerciseMap.values()) as any[];
          }
        }
      } catch (error) {
        console.error("Error loading exercises:", error);
      } finally {
        if (isMounted) {
          setLoadingExercises(false);
          forceUpdate({});
        }
      }
    };

    loadAndSyncExercises();
    return () => { isMounted = false; };
  }, [activeTab, userData?.currentSection, activeSection]);


  // 3. QUIZ FUNCTIONS (Fixes 'openQuiz', 'submitQuiz' errors)

  const openQuiz = () => {
    setQuizOpen(true);
    setQuizAnswers([]);
    setQuizSubmitted(false);
    setQuizResults(null);
  };

  const markExerciseComplete = (exerciseId: number | string) => {
    if (!selectedExercise) return;
    setSelectedExercise({
      ...selectedExercise,
      completed: true,
      progress: 100,
    } as any);
    if (currentExercise && String(currentExercise.id) === String(exerciseId)) {
      setCurrentExercise({ ...currentExercise, completed: true } as any);
    }
  };

  const submitQuiz = () => {
    if (!currentExercise || !currentExercise.questions) return;
    let correct = 0;
    currentExercise.questions.forEach((q, i) => {
      const correctAns = (q as any).correctAnswer ?? (q as any).correct;
      if (quizAnswers[i] === correctAns) correct++;
    });
    setQuizSubmitted(true);
    setQuizResults({ correct, total: currentExercise.questions.length });
    if (currentExercise.questions.length > 0 && correct / currentExercise.questions.length >= 0.7) {
      markExerciseComplete(currentExercise.id);
    }
  };

  // 4. DATA MANAGEMENT FUNCTIONS

  const addExerciseToSection = (exercisePartial: Partial<Exercise>, sectionId: string = activeSection) => {
    const newExercise: any = {
      id: Date.now(),
      title: exercisePartial.title || 'Untitled Exercise',
      type: (exercisePartial as any).type || 'MCQ',
      difficulty: (exercisePartial.difficulty as string) || 'Beginner',
      duration: (exercisePartial.duration as string) || 'Unknown',
      points: exercisePartial.points ?? 0,
      completed: false,
      questions: (exercisePartial.questions as any) || [],
      progress: 0,
    };
    const secIndex = SECTIONS.findIndex(s => String(s.id) === String(sectionId));
    if (secIndex >= 0) {
      SECTIONS[secIndex].exercises = [newExercise, ...(SECTIONS[secIndex].exercises || [])] as any[];
      setLoadingExercises(p => !p);
      setTimeout(() => { setExpandedId(newExercise.id); forceUpdate({}); }, 80);
    }
  };

  const createAndShowExercise = (exerciseData: Partial<Exercise>, targetSectionId?: string) => {
    addExerciseToSection(exerciseData, targetSectionId || activeSection);
  };

  // Load all exercises from Firebase and format them for display
  const loadFirebaseExercise = async () => {
    try {
      setLoadingExercises(true);
      const exercises = await ExercisesService.getAllExercises();
      if (!exercises) return;
      // Format and process each exercise from Firebase
      const formatted: any[] = exercises.map((ex: any) => {
        console.log(
          `📚 Processing exercise: "${ex.title}" | Category: "${ex.category || 'Not specified'}"`
        );

        return {
          ...ex,
          id: typeof ex.id === 'number' ? ex.id : Number(ex.id) || Date.now(),
          completed: ex.completed === true,
          category: ex.category || '' // ✅ Make sure the category field is included
        };
      });
      setFirebaseExercises(formatted);
      console.log(`✅ Successfully loaded ${formatted.length} exercises from Firebase`);
    } catch (e) { console.error(e); }
    finally { setLoadingExercises(false); }
  };

  const getExercisesForCourse = (course: Course) => {
    const all = [...SECTIONS.flatMap(s => s.exercises || []), ...firebaseExercises];
    return all.filter((ex: any) =>
      String(ex.course) === String(course.id) ||
      String(ex.CoordinatorId) === String(course.id) ||
      String(ex.sectionId) === String(activeSection)
    );
  };

  // 5. UI HANDLERS

  const toggleExpand = (id: number | string) => {
    setExpandedId((prev: any) => (prev === id ? null : id) as any);
  };

  const handleExerciseClick = (exercise: any) => {
    setSelectedExercise({ ...exercise, questions: exercise.questions || [] });
    setViewModeE('exercise');
    setCurrentExercise(null);
    setQuizOpen(false);
  };

  const handleBackToExercises = () => {
    setViewModeE('exercises');
    setSelectedExercise(null);
    setQuizOpen(false);
  };

  const handleBackToExercise = () => {
    setViewModeE('exercise');
    setCurrentExercise(null);
    setQuizOpen(false);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/signin');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error logging out');
    }
  };
  /////////////////////////////////////////
  //////////////////////////////////////////////
  //SHARED NOTES
  ////////////////////////////////////////////////
  /////////////////////////////////////////////////
  // Load shared notes from Firebase database
  const loadSharedNotesFromFirebase = async () => {
    try {
      const q = query(collection(db, 'sharedNotes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      // Map documents and ensure default values are set
      const notesList = snapshot.docs.map(doc => {
        const data = doc.data();
        // Set default category for old notes without category field
        const noteCategory = data.category || data.course || 'General';
        console.log(`📝 Loading note: "${data.title}" | Category: "${noteCategory}"`);

        return {
          id: doc.id,
          ...data,
          category: noteCategory,
          likes: data.likes || 0,
          dislikes: data.dislikes || 0,
          commentCount: data.commentCount || 0,
          likedBy: data.likedBy || [],
          dislikedBy: data.dislikedBy || []
        } as SharedNote;
      });

      setSharedNotes(notesList);

      // Initialize like/dislike state for current user
      if (user) {
        const initialStates: Record<string, 'like' | 'dislike' | null> = {};
        notesList.forEach(note => {
          if (note.likedBy?.includes(user.uid)) {
            initialStates[note.id] = 'like';
          } else if (note.dislikedBy?.includes(user.uid)) {
            initialStates[note.id] = 'dislike';
          } else {
            initialStates[note.id] = null;
          }
        });
        setNoteLikeState(initialStates);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      alert('Failed to load notes. Please refresh the page.');
    }
  };

  // Set up real-time listener for comments on a specific note
  // Prevents duplicate listeners on the same note
  const ensureCommentsListener = (noteId: string) => {
    if (!noteId || typeof noteId !== 'string' || noteId.trim() === '') {
      console.error('Invalid noteId:', noteId);
      return;
    }

    // Already listening? Skip it
    if (commentsListenersRef.current[noteId]) return;

    try {
      const commentsRef = collection(db, 'sharedNotes', noteId, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'asc'));

      // Watch for changes to this note's comments
      const unsubscribe = onSnapshot(q,
        (snapshot) => {
          const comments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Comment));
          setNoteComments(prev => ({ ...prev, [noteId]: comments }));
        },
        (error) => {
          console.error(`Comments error for ${noteId}:`, error);
        }
      );

      // Keep track of this listener so we can turn it off later
      commentsListenersRef.current[noteId] = unsubscribe;
    } catch (error) {
      console.error('Listener setup error:', error);
    }
  };

  // Toggle like/dislike reaction on a note
  // User cannot like and dislike at the same time - must remove one to switch
  const toggleNoteReaction = async (noteId: string, action: 'like' | 'dislike') => {
    if (!user) {
      alert('Please sign in to react.');
      return;
    }

    if (!noteId || typeof noteId !== 'string' || noteId.trim() === '') {
      console.error('Invalid noteId:', noteId);
      alert('Error: Invalid note. Please refresh the page.');
      return;
    }

    const current = noteLikeState[noteId] || null;
    const userId = user.uid;

    try {
      if (action === 'like') {
        if (current === 'dislike') {
          alert('Remove your dislike first before liking.');
          return;
        }

        if (current === 'like') {
          await NotesService.unlikeNote(noteId, userId);
          setNoteLikeState(prev => ({ ...prev, [noteId]: null }));
        } else {
          await NotesService.likeNote(noteId, userId);
          setNoteLikeState(prev => ({ ...prev, [noteId]: 'like' }));
        }
      } else {
        if (current === 'like') {
          alert('Remove your like first before disliking.');
          return;
        }

        if (current === 'dislike') {
          await NotesService.undislikeNote(noteId, userId);
          setNoteLikeState(prev => ({ ...prev, [noteId]: null }));
        } else {
          await NotesService.dislikeNote(noteId, userId);
          setNoteLikeState(prev => ({ ...prev, [noteId]: 'dislike' }));
        }
      }

      await loadSharedNotesFromFirebase();
    } catch (err) {
      console.error('Reaction error:', err);
      alert('Failed to update. Please try again.');
    }
  };

  // Submit a new comment or reply to an existing comment
  // Uses server timestamp to ensure consistent timing across all users
  const handleCommentSubmit = async (noteId: string, parentId?: string) => {
    if (!user || !userData) {
      alert('Please sign in to comment.');
      return;
    }

    const inputKey = parentId ? `${noteId}_reply_${parentId}` : noteId;
    const text = commentInputs[inputKey]?.trim();

    if (!text) return;

    try {
      const commentData: any = {
        text,
        userId: user.uid,
        userName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || user.email || 'User',
        userPhoto: userData.photoURL || null,
        createdAt: serverTimestamp()
      };

      // If replying to another comment, link them together
      // Link reply to parent comment
      if (parentId) {
        commentData.replyTo = parentId;
      }

      // Save comment to Firebase
      await NotesService.addComment(noteId, commentData);

      // Clear input field after submission
      setCommentInputs(prev => ({ ...prev, [inputKey]: '' }));

      // Close reply input if replying to another comment
      if (parentId) {
        setReplyTo(prev => ({ ...prev, [noteId]: null }));
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment. Please try again.');
    }
  };

  // Increment view count for a note when user opens it
  // Only counts once per session per note to avoid inflating view count
  const incrementNoteViews = async (noteId: string) => {
    if (!noteId || noteViewedRef.current.has(noteId)) return;

    noteViewedRef.current.add(noteId);

    try {
      await updateDoc(doc(db, 'sharedNotes', noteId), { views: increment(1) });

      setSharedNotes(prev => prev.map(note =>
        note.id === noteId ? { ...note, views: (note.views || 0) + 1 } : note
      ));
    } catch (err) {
      console.error('Failed to increment views:', err);
    }
  };

  // Detect file type to determine how to preview it
  // Returns appropriate preview handler for pdf, image, video, or other types
  const detectFileKind = (note: SharedNote): 'pdf' | 'image' | 'video' | 'other' => {
    const type = (note.fileType || '').toLowerCase();
    const url = (note.fileUrl || '').toLowerCase();
    const check = (match: string) => type.includes(match) || url.includes(match);

    if (check('pdf')) return 'pdf';
    if (check('png') || check('jpg') || check('jpeg') || check('webp') || check('gif')) return 'image';
    if (check('mp4') || check('webm') || check('mov')) return 'video';
    return 'other';
  };

  // Open modal to preview a note's file
  const handlePreview = (note: SharedNote) => {
    if (!note.fileUrl) {
      alert('No file available to preview.');
      return;
    }
    setPreviewNote(note);
  };

  // Download a note file and increment the download counter
  const handleNoteDownload = (e: React.MouseEvent, note: SharedNote) => {
    e.stopPropagation();

    if (!note.fileUrl || note.fileUrl === '') {
      alert('No file available to download.');
      return;
    }

    try {
      const a = document.createElement('a');
      a.href = note.fileUrl;
      a.download = `${note.title.replace(/\s+/g, '_')}.${note.fileType.split('/')[1] || 'txt'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Increment download count
      updateDoc(doc(db, 'sharedNotes', note.id), { downloads: increment(1) });

      setSharedNotes(prev => prev.map(n =>
        n.id === note.id ? { ...n, downloads: (n.downloads || 0) + 1 } : n
      ));
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file.');
    }
  };

  // Render a single comment with its replies
  // Supports nested replies and adds a reply button
  const renderComment = (comment: Comment, noteId: string, depth = 0) => {
    const isReply = !!comment.replyTo;
    const inputKey = `${noteId}_reply_${comment.id}`;

    return (
      <div
        key={`comment_${comment.id}_${depth}`}
        style={{
          marginBottom: '0',
          padding: '0',
          background: 'transparent',
          borderRadius: '0',
          border: 'none',
          boxShadow: 'none',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* User avatar */}
          {comment.userPhoto ? (
            <img
              src={comment.userPhoto}
              alt={comment.userName}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                objectFit: 'cover',
                flexShrink: 0,
                border: '2px solid #e2e8f0',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            />
          ) : (
            // Default avatar with gradient background
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '2px solid #e2e8f0',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              <User size={20} color="#ffffff" />
            </div>
          )}

          {/* Comment content section */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Comment header: username, reply badge, timestamp */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '8px',
              flexWrap: 'wrap'
            }}>
              {/* Username */}
              <span style={{
                fontWeight: 700,
                color: '#1e293b',
                fontSize: '15px',
                letterSpacing: '-0.2px'
              }}>
                {comment.userName}
              </span>

              {/* Reply badge (shown if this is a reply to another comment) */}
              {isReply && (
                <span style={{
                  fontSize: '11px',
                  color: '#667eea',
                  background: 'linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  border: '1px solid #c7d2fe'
                }}>
                  Reply
                </span>
              )}

              {/* Timestamp */}
              {comment.createdAt?.toDate && (
                <span style={{
                  fontSize: '12px',
                  color: '#64748b',
                  fontWeight: 500
                }}>
                  {(() => {
                    const date = comment.createdAt.toDate();
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    // Format time display: Today/Yesterday/Date
                    if (date.toDateString() === today.toDateString()) {
                      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
                    } else if (date.toDateString() === yesterday.toDateString()) {
                      return 'Yesterday';
                    } else {
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    }
                  })()}
                </span>
              )}
            </div>

            {/* Comment text */}
            <p style={{
              margin: '0 0 12px 0',
              color: '#334155',
              fontSize: '15px',
              lineHeight: '1.6',
              wordBreak: 'break-word',
              fontWeight: 400
            }}>
              {comment.text}
            </p>

            {/* Reply button (only for parent comments) */}
            {!isReply && (
              <button
                onClick={() => setReplyTo(prev => ({ ...prev, [noteId]: comment.id }))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#5568d3';
                  e.currentTarget.style.background = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#667eea';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Reply size={14} /> Reply
              </button>
            )}

            {/* Reply input form (shown when user clicks Reply button) */}
            {replyTo[noteId] === comment.id && (
              <div style={{
                marginTop: '12px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-end'
              }}>
                <input
                  type="text"
                  placeholder="Write your reply..."
                  value={commentInputs[inputKey] || ''}
                  onChange={e => setCommentInputs(prev => ({ ...prev, [inputKey]: e.target.value }))}
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      handleCommentSubmit(noteId, comment.id);
                    }
                  }}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  onClick={() => handleCommentSubmit(noteId, comment.id)}
                  style={{
                    padding: '10px 16px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#5568d3';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#667eea';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Send size={14} /> Reply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Separate parent comments from their replies
  // So we can show replies nested under parent comments
  const groupComments = (comments: Comment[]) => {
    const parents: Comment[] = [];
    const replies: Record<string, Comment[]> = {};

    comments.forEach(c => {
      if (c.replyTo) {
        if (!replies[c.replyTo]) replies[c.replyTo] = [];
        replies[c.replyTo].push(c);
      } else {
        parents.push(c);
      }
    });

    return { parents, replies };
  };

  // Submit a new note to be shared
  // Saves to Firebase and updates user's note count
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !userData) {
      alert('Please sign in to share a note.');
      return;
    }

    try {
      const newNote: any = {
        title: formData.title || 'Untitled Note',
        author: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User',
        uploadDate: new Date().toISOString().split('T')[0],
        profilePic: userData.photoURL || null,
        course: formData.category || 'General',
        category: formData.category || 'General',
        downloads: 0,
        views: 0,
        fileType: formData.attachedFile ? formData.attachedFile.type : 'TEXT',
        size: formData.attachedFile ? `${(formData.attachedFile.size / 1024).toFixed(1)} KB` : 'Text only',
        preview: formData.message.substring(0, 150) + (formData.message.length > 150 ? '...' : ''),
        rating: 0,
        tags: ['General'],
        userId: user.uid,
        description: formData.message,
        likes: 0,
        dislikes: 0,
        commentCount: 0,
        likedBy: [],
        dislikedBy: [],
        createdAt: serverTimestamp(),
      };
      console.log(`Saved new note: "${newNote.title}" in category: "${newNote.category}"`);
      if (fileURL) {
        newNote.fileUrl = fileURL;
      }

      await addDoc(collection(db, 'sharedNotes'), newNote);
      await updateDoc(doc(db, 'users', user.uid), { sharedNotes: increment(1) });

      setShowForm(false);
      setFormData({ title: '', category: '', message: '', attachedFile: null });
      setFileURL("");
      loadSharedNotesFromFirebase();

      alert('Note shared successfully! 🎉');
    } catch (err) {
      console.error('Error sharing note:', err);
      alert('Failed to share note.');
    }
  };
  const MAX_MESSAGE_LEN = 500;

  // Handle file upload to a note
  // Check file size and convert to base64
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 700 * 1024) {
      alert("File is too large! Must be under 700KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setFileURL(reader.result as string);
    reader.readAsDataURL(file);

    setFormData(prev => ({ ...prev, attachedFile: file }));
  };

  // Load notes when component starts, clean up listeners when it unmounts
  useEffect(() => {
    loadSharedNotesFromFirebase();
    return () => {
      Object.values(commentsListenersRef.current).forEach(unsub => unsub());
    };
  }, []);

  // Form state for sharing a new note
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    message: '',
    attachedFile: null as File | null,
  });

  // Render the shared notes section with all the cards and modals
  const renderSharedNotesTab = () => {
    const filteredSharedNotes = updatedCurrentSection?.sharedNotes || [];

    console.log(`📊 عدد الملاحظات المصفاة للقسم "${activeSection}": ${filteredSharedNotes.length}`);

    return (
      <div className="sharedNotesWrapper_x91">
        {/* Header */}
        <h2 className="sharedNotesTitle_x91">
          <Users size={40} style={{ marginRight: '1rem', color: '#1201b1ff' }} />
          Collaborative Learning Board
        </h2>
        <p className="sharedNotesDesc_x91">
          Welcome to the Study Materials Exchange! Here, Participants upload, download, and rate collective notes. Let's learn together!
        </p>

        {/* Share button */}
        <div className="sharedNotesBtnWrap_x91">
          <button
            className="sharedNotesButton_x91"
            type="button"
            onClick={() => setShowForm(true)}
          >
            <FileText size={20} style={{ marginRight: '8px' }} />
            Share Your Notes
          </button>
        </div>

        {/* Notes grid */}
        <div className="sharedNotesGrid_x92">
          {filteredSharedNotes && filteredSharedNotes.length > 0 ? (
            filteredSharedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  if (note.id) {
                    ensureCommentsListener(note.id);
                    setSelectedNoteForDetail(note);
                    incrementNoteViews(note.id);
                  }
                }}
                className="noteCard_x92"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Decorative tape element */}
                <div className="noteTape_x92" />
                <div className="noteHeader_x92">
                  <div className="noteAuthorBox_x92">
                    {note.profilePic ? (
                      <img
                        src={note.profilePic}
                        alt={note.author || 'Anonymous'}
                        className="noteAuthorImg_x92"
                      />
                    ) : (
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <User size={20} color="#94a3b8" />
                      </div>
                    )}
                    <span className="noteAuthorName_x92">
                      by {note.author || 'Anonymous'}
                    </span>
                  </div>
                  <div className="noteCardFileType_x93">
                    {note.fileType || 'Doc'}
                  </div>
                </div>
                <h3 className="noteCardTitle_x93">{note.title || 'Untitled Note'}</h3>
                <p className="notePreview_f7g" style={{ marginBottom: '12px' }}>
                  {note.preview || 'No preview available for this note. Download to view full content.'}
                </p>
                <div className="noteAdditional_f7g" style={{ gap: '12px' }}>
                  <div className="noteFeatureLeft_f7g" style={{ gap: '8px' }}>
                    <div className="noteFeatureItem_f7g" style={{ gap: '6px' }}>
                      <Calendar size={16} />
                      <span>Uploaded: {note.uploadDate || 'N/A'}</span>
                    </div>
                    <div className="noteFeatureItem_f7g" style={{ gap: '6px' }}>
                      <Tag size={16} />
                      <span>Tags: {(note.tags && note.tags.join(', ')) || 'General'}</span>
                    </div>
                  </div>
                  <div className="noteFeatureRight_f7g">
                    <div className="noteFeatureRightItem_f7g" style={{ gap: '6px' }}>
                      <FileText size={16} />
                      {note.size || 'Unknown Size'}
                    </div>
                  </div>
                  <div className="noteActions_f7g" style={{ gap: '8px', marginTop: '12px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(note);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        border: '1px solid #e2e8f0',
                        background: '#fff',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#0f172a',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Eye size={16} /> Preview
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (note.id && note.id.trim() !== '') {
                          toggleNoteReaction(note.id, 'like');
                        }
                      }}
                      disabled={noteLikeState[note.id] === 'dislike'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        border: noteLikeState[note.id] === 'like' ? '2px solid #667eea' : '1px solid #e2e8f0',
                        background: noteLikeState[note.id] === 'like' ? '#ede9fe' : noteLikeState[note.id] === 'dislike' ? '#f1f5f9' : 'white',
                        borderRadius: '8px',
                        cursor: noteLikeState[note.id] === 'dislike' ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: noteLikeState[note.id] === 'like' ? '#667eea' : noteLikeState[note.id] === 'dislike' ? '#94a3b8' : '#64748b',
                        transition: 'all 0.2s',
                        opacity: noteLikeState[note.id] === 'dislike' ? 0.5 : 1
                      }}
                      title={noteLikeState[note.id] === 'dislike' ? 'Remove your dislike first' : ''}
                    >
                      <ThumbsUp size={16} />
                      <span>{note.likes || 0}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (note.id && note.id.trim() !== '') {
                          toggleNoteReaction(note.id, 'dislike');
                        }
                      }}
                      disabled={noteLikeState[note.id] === 'like'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        border: noteLikeState[note.id] === 'dislike' ? '2px solid #ef4444' : '1px solid #e2e8f0',
                        background: noteLikeState[note.id] === 'dislike' ? '#fee2e2' : noteLikeState[note.id] === 'like' ? '#f1f5f9' : 'white',
                        borderRadius: '8px',
                        cursor: noteLikeState[note.id] === 'like' ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: noteLikeState[note.id] === 'dislike' ? '#ef4444' : noteLikeState[note.id] === 'like' ? '#94a3b8' : '#64748b',
                        transition: 'all 0.2s',
                        opacity: noteLikeState[note.id] === 'like' ? 0.5 : 1
                      }}
                      title={noteLikeState[note.id] === 'like' ? 'Remove your like first' : ''}
                    >
                      <ThumbsDown size={16} />
                      <span>{note.dislikes || 0}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (note.id) {
                          ensureCommentsListener(note.id);
                          setSelectedNoteForComments(note);
                          setShowCommentsModal(true);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        border: '1px solid #e2e8f0',
                        background: 'white',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#64748b',
                        transition: 'all 0.2s'
                      }}
                    >
                      <MessageSquare size={16} />
                      <span>{note.commentCount || 0}</span>
                    </button>
                  </div>
                  <button
                    className="noteDownloadButton_f9x"
                    type="button"
                    onClick={(e) => handleNoteDownload(e, note)}
                    style={{ marginTop: '12px' }}
                  >
                    <Download size={18} style={{ marginRight: '8px' }} />
                    {downloadedNotes[note.id] ? 'Downloaded ✓' : 'Download'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="notesEmptyMessage_f9x">
              <Users size={60} color="#c5d9e5" className="notesEmptyMessageIcon_f9x" />
              <h3 className="notesEmptyMessageTitle_f9x">No notes on the board yet!</h3>
              <p className="notesEmptyMessageText_f9x">
                Be the first to upload your study materials or check back soon for notes shared by the community.
              </p>
            </div>
          )}
        </div>

        {/* Share Form Modal */}
        {showForm && (
          <div className="notesFormOverlay_f9x">
            <form onSubmit={handleSubmit} className="notesFormContainer_f9x">
              <h3 className="notesFormTitle_f9x">Share Your Study Notes</h3>
              <div className="notesAuthorInfo_f9x">
                <p className="notesAuthorName_f9x">
                  {userData?.firstName && userData?.lastName
                    ? `${userData.firstName} ${userData.lastName}`
                    : 'Unknown User'}
                </p>
                <p className="notesAuthorEmail_f9x">
                  {user?.email || 'No email available'}
                </p>
              </div>
              <input
                type="text"
                name="title"
                placeholder="Title of your note/course"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                className="notesFormInput_f9x"
              />
              <select
                name="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="notesFormInput_f9x"
                required
                style={{ cursor: 'pointer' }}
              >
                <option value="">Choose Category</option>
                {shareCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <textarea
                name="message"
                placeholder="Describe your notes or add details..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={9}
                required
                className="notesFormTextarea_f9x"
                maxLength={MAX_MESSAGE_LEN}
                style={{
                  overflowY: 'auto',
                  resize: 'none'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', marginTop: '-6px', marginBottom: '6px' }}>
                <span>Keep it concise and clear.</span>
                <span>{formData.message.length}/{MAX_MESSAGE_LEN}</span>
              </div>
              <input type="file" onChange={handleUpload} />
              {formData.attachedFile && (
                <div style={{
                  fontSize: '13px',
                  color: '#334155',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '8px 12px'
                }}>
                  File: <strong>{formData.attachedFile.name}</strong> ({(formData.attachedFile.size / 1024).toFixed(1)} KB, {formData.attachedFile.type || 'unknown'})
                </div>
              )}
              <div className="notesFormActions_f9x">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ title: '', category: '', message: '', attachedFile: null });
                    setFileURL("");
                  }}
                  className="notesFormCancelButton_f9x"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="notesFormSubmitButton_f9x"
                  disabled={
                    !formData.title.trim() ||
                    !formData.category.trim() ||
                    !formData.message.trim() ||
                    formData.message.length > MAX_MESSAGE_LEN
                  }
                >
                  Share Notes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Note Detail Modal */}
        {selectedNoteForDetail && (
          <div
            onClick={() => setSelectedNoteForDetail(null)}
            className="notesModalOverlay_f9x"
          >
            <div
              onClick={e => e.stopPropagation()}
              className="notesModalContainer_f9x"
            >
              <div className="notesModalHeader_f9x">
                <div className="notesModalAuthor_f9x">
                  {selectedNoteForDetail.profilePic ? (
                    <img
                      src={selectedNoteForDetail.profilePic}
                      alt={selectedNoteForDetail.author || 'Anonymous'}
                      className="notesModalAuthorImg_f9x"
                    />
                  ) : (
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        backgroundColor: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <User size={24} color="#94a3b8" />
                    </div>
                  )}
                  <div>
                    <h2 className="notesModalTitle_f9x">{selectedNoteForDetail.title || 'Untitled Note'}</h2>
                    <p className="notesModalAuthorName_f9x">
                      by {selectedNoteForDetail.author || 'Anonymous'} • {selectedNoteForDetail.uploadDate || 'N/A'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNoteForDetail(null)}
                  className="notesModalCloseButton_f9x"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="notesModalBody_f9x">
                <div className="notesModalDescription_f9x">
                  <p className="notesModalDescriptionText_f9x">
                    {selectedNoteForDetail.description || selectedNoteForDetail.preview}
                  </p>
                </div>
                <div className="notesModalActions_f9x">
                  <button
                    onClick={() => toggleNoteReaction(selectedNoteForDetail.id, 'like')}
                    disabled={noteLikeState[selectedNoteForDetail.id] === 'dislike'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      border: noteLikeState[selectedNoteForDetail.id] === 'like' ? '2px solid #667eea' : '1px solid #e2e8f0',
                      background: noteLikeState[selectedNoteForDetail.id] === 'like' ? '#ede9fe' : noteLikeState[selectedNoteForDetail.id] === 'dislike' ? '#f1f5f9' : 'white',
                      borderRadius: '10px',
                      cursor: noteLikeState[selectedNoteForDetail.id] === 'dislike' ? 'not-allowed' : 'pointer',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: noteLikeState[selectedNoteForDetail.id] === 'like' ? '#667eea' : noteLikeState[selectedNoteForDetail.id] === 'dislike' ? '#94a3b8' : '#64748b',
                      transition: 'all 0.2s',
                      opacity: noteLikeState[selectedNoteForDetail.id] === 'dislike' ? 0.5 : 1
                    }}
                    title={noteLikeState[selectedNoteForDetail.id] === 'dislike' ? 'Remove your dislike first' : ''}
                  >
                    <ThumbsUp size={18} />
                    <span>{selectedNoteForDetail.likes || 0} Likes</span>
                  </button>
                  <button
                    onClick={() => toggleNoteReaction(selectedNoteForDetail.id, 'dislike')}
                    disabled={noteLikeState[selectedNoteForDetail.id] === 'like'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      border: noteLikeState[selectedNoteForDetail.id] === 'dislike' ? '2px solid #ef4444' : '1px solid #e2e8f0',
                      background: noteLikeState[selectedNoteForDetail.id] === 'dislike' ? '#fee2e2' : noteLikeState[selectedNoteForDetail.id] === 'like' ? '#f1f5f9' : 'white',
                      borderRadius: '10px',
                      cursor: noteLikeState[selectedNoteForDetail.id] === 'like' ? 'not-allowed' : 'pointer',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: noteLikeState[selectedNoteForDetail.id] === 'dislike' ? '#ef4444' : noteLikeState[selectedNoteForDetail.id] === 'like' ? '#94a3b8' : '#64748b',
                      transition: 'all 0.2s',
                      opacity: noteLikeState[selectedNoteForDetail.id] === 'like' ? 0.5 : 1
                    }}
                    title={noteLikeState[selectedNoteForDetail.id] === 'like' ? 'Remove your like first' : ''}
                  >
                    <ThumbsDown size={18} />
                    <span>{selectedNoteForDetail.dislikes || 0}</span>
                  </button>
                  <button
                    onClick={() => handlePreview(selectedNoteForDetail)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      border: '1px solid #e2e8f0',
                      background: '#fff',
                      color: '#0f172a',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: 600,
                      transition: 'all 0.2s'
                    }}
                  >
                    <Eye size={18} /> Preview
                  </button>
                  <button
                    onClick={(e) => handleNoteDownload(e, selectedNoteForDetail)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: 600,
                      transition: 'transform 0.2s',
                      marginLeft: 'auto'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <Download size={18} /> Download
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (selectedNoteForDetail.id) {
                      ensureCommentsListener(selectedNoteForDetail.id);
                      setSelectedNoteForComments(selectedNoteForDetail);
                      setShowCommentsModal(true);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    border: '1px solid #667eea',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    marginTop: '20px',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <MessageSquare size={18} />
                  View Comments ({noteComments[selectedNoteForDetail.id]?.length || 0})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comments Modal */}
        {showCommentsModal && selectedNoteForComments && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '20px',
              backdropFilter: 'blur(4px)',
              animation: 'fadeIn 0.3s ease-out'
            }}
            onClick={() => {
              setShowCommentsModal(false);
              setSelectedNoteForComments(null);
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '800px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                animation: 'slideUp 0.3s ease-out',
                position: 'relative',
                border: '1px solid rgba(102, 126, 234, 0.1)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{
                padding: '28px 32px',
                borderBottom: '2px solid #f1f5f9',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}>
                    <MessageSquare size={28} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                      Comments
                    </h2>
                    <p style={{ margin: '6px 0 0 0', fontSize: '15px', opacity: 0.95, fontWeight: 500 }}>
                      {selectedNoteForComments.title || 'Untitled Note'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCommentsModal(false);
                    setSelectedNoteForComments(null);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    transition: 'all 0.2s',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.transform = 'rotate(90deg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.transform = 'rotate(0deg)';
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Comments List */}
              <div
                className="comments-scroll-container"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '28px 32px',
                  background: 'linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Likes', value: selectedNoteForComments.likes || 0, color: '#667eea' },
                      { label: 'Dislikes', value: selectedNoteForComments.dislikes || 0, color: '#ef4444' },
                      { label: 'Comments', value: noteComments[selectedNoteForComments.id]?.length || 0, color: '#0f172a' },
                      { label: 'Views', value: selectedNoteForComments.views || 0, color: '#16a34a' },
                      { label: 'Downloads', value: selectedNoteForComments.downloads || 0, color: '#6366f1' },
                    ].map(stat => (
                      <div key={stat.label} style={{
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        fontWeight: 700,
                        fontSize: '13px',
                        color: '#0f172a'
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: stat.color }} />
                        {stat.label}: {stat.value}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>Sort by</span>
                    <select
                      value={commentSort}
                      onChange={(e) => setCommentSort(e.target.value as 'newest' | 'oldest')}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        fontSize: '13px',
                        fontWeight: 600,
                        background: '#fff',
                        color: '#0f172a',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                      }}
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                    </select>
                  </div>
                </div>
                {noteComments[selectedNoteForComments.id] && noteComments[selectedNoteForComments.id].length > 0 ? (() => {
                  const commentsForNote = noteComments[selectedNoteForComments.id] || [];
                  const toMs = (c: Comment) => {
                    // Support Firestore Timestamp or Date
                    if ((c as any)?.createdAt?.toMillis) return (c as any).createdAt.toMillis();
                    if ((c as any)?.createdAt?.seconds) return (c as any).createdAt.seconds * 1000;
                    return 0;
                  };
                  const sortedComments = [...commentsForNote].sort((a, b) => {
                    const diff = toMs(b) - toMs(a);
                    return commentSort === 'newest' ? diff : -diff;
                  });
                  const { parents, replies } = groupComments(sortedComments);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {parents.map((parent) => (
                        <div key={`comment_group_${parent.id}`} style={{
                          background: 'white',
                          borderRadius: '20px',
                          padding: '24px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                          border: '2px solid #e9ecef',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.2)';
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.borderColor = '#c7d2fe';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = '#e9ecef';
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '20px 20px 0 0'
                          }} />
                          {renderComment(parent, selectedNoteForComments.id, 0)}
                          {replies[parent.id] && replies[parent.id].length > 0 && (
                            <div style={{
                              marginTop: '20px',
                              paddingTop: '20px',
                              borderTop: '2px solid #f1f5f9',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '16px'
                            }}>
                              <div style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#667eea',
                                marginBottom: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <MessageSquare size={14} />
                                {replies[parent.id].length} {replies[parent.id].length === 1 ? 'Reply' : 'Replies'}
                              </div>
                              {replies[parent.id].map((reply) => (
                                <div key={`reply_${reply.id}`} style={{
                                  background: 'linear-gradient(135deg, #f8f9fa 0%, #f1f5f9 100%)',
                                  borderRadius: '16px',
                                  padding: '20px',
                                  border: '2px solid #e2e8f0',
                                  marginLeft: '16px',
                                  position: 'relative'
                                }}>
                                  <div style={{
                                    position: 'absolute',
                                    left: '-8px',
                                    top: '24px',
                                    width: '16px',
                                    height: '16px',
                                    background: '#f8f9fa',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '50%'
                                  }} />
                                  {renderComment(reply, selectedNoteForComments.id, 1)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })() : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 20px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '20px',
                      opacity: 0.1
                    }}>
                      <MessageSquare size={40} color="#667eea" />
                    </div>
                    <h3 style={{
                      margin: '0 0 8px 0',
                      fontSize: '20px',
                      fontWeight: 600,
                      color: '#2d3748'
                    }}>
                      No comments yet
                    </h3>
                    <p style={{
                      margin: 0,
                      fontSize: '15px',
                      color: '#718096'
                    }}>
                      Be the first to comment! 💭
                    </p>
                  </div>
                )}
              </div>

              {/* Add Comment Section */}
              <div style={{
                padding: '24px 32px',
                borderTop: '2px solid #f1f5f9',
                background: 'linear-gradient(to top, #ffffff 0%, #f8f9fa 100%)',
                boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-end'
                }}>
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentInputs[selectedNoteForComments.id] || ''}
                    onChange={e => setCommentInputs(prev => ({ ...prev, [selectedNoteForComments.id]: e.target.value }))}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        handleCommentSubmit(selectedNoteForComments.id);
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '16px 20px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '16px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.3s',
                      background: 'white',
                      fontWeight: 400,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.background = 'white';
                      e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.15)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.background = 'white';
                      e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  />
                  <button
                    onClick={() => handleCommentSubmit(selectedNoteForComments.id)}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '16px 32px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.3s',
                      boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                      letterSpacing: '-0.3px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
                    }}
                  >
                    <Send size={20} /> Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FILE PREVIEW MODAL */}
        {previewNote && (
          <div
            onClick={() => setPreviewNote(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              backdropFilter: 'blur(4px)'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                width: '100%',
                height: 'auto',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
                animation: 'fadeIn 0.3s ease'
              }}
            >
              {/* Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h2 style={{
                    margin: '0 0 6px 0',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#1e293b'
                  }}>
                    {previewNote.title}
                  </h2>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#64748b'
                  }}>
                    by {previewNote.author} • {previewNote.uploadDate}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewNote(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#1e293b'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {detectFileKind(previewNote) === 'pdf' ? (
                  <iframe
                    src={previewNote.fileUrl}
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '500px',
                      border: 'none'
                    }}
                  />
                ) : detectFileKind(previewNote) === 'image' ? (
                  <img
                    src={previewNote.fileUrl}
                    alt={previewNote.title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      borderRadius: '8px',
                      objectFit: 'contain'
                    }}
                  />
                ) : detectFileKind(previewNote) === 'video' ? (
                  <video
                    controls
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      borderRadius: '8px'
                    }}
                  >
                    <source src={previewNote.fileUrl} type={previewNote.fileType} />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px'
                  }}>
                    <FileText size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                    <h3 style={{
                      margin: '12px 0 8px 0',
                      color: '#475569',
                      fontSize: '16px',
                      fontWeight: 600
                    }}>
                      Document Preview
                    </h3>
                    <p style={{
                      margin: '0 0 20px 0',
                      color: '#94a3b8',
                      fontSize: '14px'
                    }}>
                      {previewNote.fileType} • {previewNote.size}
                    </p>
                    <button
                      onClick={(e) => handleNoteDownload(e, previewNote)}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 28px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <Download size={18} /> Download File
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  onClick={() => setPreviewNote(null)}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e2e8f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                  }}
                >
                  Close
                </button>
                <button
                  onClick={(e) => handleNoteDownload(e, previewNote)}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Download size={16} /> Download
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  ///////////////////////////////////////////
  /////////////////////////////////////////// 
  // Course Overview Component
  //////////////////////////////////////////
  //////////////////////////////////////////



  const CourseOverview = ({ course }: { course: Course }) => (
    <div className="crsOv_1">
      <nav className="crsOv_2">
        <div className="crsOv_3">
          <button onClick={handleBackToCatalog} className="crsOv_4">
            <ChevronLeft size={24} />
          </button>
          <div className="crsOv_5">EDU</div>
        </div>
        <div className="crsOv_6">
          <BookOpen size={20} /> Course Overview
        </div>
      </nav>
      <div className="crsOv_10">
        <div className="crsOv_11">
          <div>
            <h1 className="crsOv_13">{course.title}</h1>
            <p className="crsOv_14">{course.description}</p>
            <div className="crsOv_15">
              <div className="crsOv_16">
                <Star fill="gold" color="gold" size={20} />
                <span className="crsOv_17">{course.rating}</span>
                <span>({formatNumber(course.Participants)} Participants)</span>
              </div>
              <div className="crsOv_18">
                <Clock size={20} />
                <span>{course.duration}</span>
              </div>
              <div className="crsOv_19">
                <User size={20} />
                <span>{course.instructor}</span>
              </div>
              <div className="crsOv_20">
                <Globe size={20} />
                <span>{course.level}</span>
              </div>
            </div>
            <button
              className="crsOv_21"
              onClick={() =>
                // start the first lesson if available; guard against missing lessons
                course.lessons && course.lessons.length > 0 ? handleLessonClick(course.lessons[0]) : null
              }
            >
              Start Learning Now
            </button>
          </div>
          <div>
            <img src={course.thumbnail} alt={course.title} className="crsOv_22" />
          </div>
        </div>
      </div>
      <div className="crsSec_1">
        <div>
          <div className="crsSec_2">
            <h2 className="crsSec_3">Course Overview</h2>
            <p className="crsSec_4">{course.overview}</p>
          </div>
          <div className="crsSec_5">
            <h2 className="crsSec_6">What You'll Learn</h2>
            <div className="crsSec_7">
              {course.whatYouLearn.map((item, index) => (
                <div key={index} className="crsSec_8">
                  <CheckCircle size={20} color="#28a745" />
                  <span className="crsSec_9">{item}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Course Links Section */}
          {(course as any).courseLinks && (course as any).courseLinks.length > 0 && (
            <div className="crsSec_5">
              <h2 className="crsSec_6">Course Resources</h2>
              <div className="crsSec_7">
                {(course as any).courseLinks.map((link: any, index: number) => (
                  <div key={index} className="crsSec_8" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {link.type === 'video' && <Video size={20} color="#3a25ff" />}
                    {link.type === 'document' && <File size={20} color="#3a25ff" />}
                    {link.type === 'image' && <Image size={20} color="#3a25ff" />}
                    {link.type === 'other' && <LucideLink size={20} color="#3a25ff" />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#2d3748' }}>{link.title}</div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#3a25ff',
                          textDecoration: 'none',
                          fontSize: '14px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                      >
                        {link.url}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {course.progress !== undefined && (
            <div className="crsPrg_1">
              <h2 className="crsPrg_2">Your Progress</h2>
              <div className="crsPrg_3">
                <div className="crsPrg_4">
                  <span>Progress: {course.progress}%</span>
                  <span>
                    {course.lessons.filter(l => l.completed).length}/{course.lessons.length} lessons
                  </span>
                </div>
                <div className="crsPrg_5">
                  <div
                    className="crsPrg_6"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>
              {course.progress === 100 && course.certificate && (
                <div className="crsPrg_7">
                  <Award size={24} color="#28a745" />
                  <span className="crsPrg_8">
                    🎉 Congratulations! You've earned a certificate.
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="unique-course-section">
            <h2 className="unique-course-title">
              Course Curriculum ({course.lessons.length} lessons)
            </h2>
            <div className="unique-lessons-container">
              {course.lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className={`unique-lesson-card ${lesson.completed ? 'unique-lesson-completed' : ''}`}
                  onClick={() => handleLessonClick(lesson)}
                >
                  <div className="unique-lesson-top">
                    <div className="unique-lesson-info">
                      <div
                        className={`unique-lesson-index ${lesson.completed ? 'unique-lesson-index-done' : ''}`}
                      >
                        {lesson.completed ? <CheckCircle size={20} /> : index + 1}
                      </div>
                      <div>
                        <h3 className="unique-lesson-title">{lesson.title}</h3>
                        <p className="unique-lesson-desc">{lesson.description}</p>
                      </div>
                    </div>
                    <div className="unique-lesson-meta">
                      <div className="unique-lesson-duration">
                        <FileVideo size={16} />
                        <span>{lesson.duration}</span>
                      </div>
                      <PlayCircle size={24} color="#3a25ff" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="unique-pricing-card">
            <div className="unique-pricing-top">
              <span className="unique-price">{course.price}</span>
              {course.originalPrice && (
                <span className="unique-original-price">{course.originalPrice}</span>
              )}
            </div>
            <Toaster position="top-right" />

            <button
              className="unique-enroll-btn"
              value={userData?.coursesEnrolled || 0}
              onClick={() => handleEnroll(course)}
              disabled={isEnrolled(course)}
              style={{
                opacity: isEnrolled(course) ? 0.6 : 1,
                cursor: isEnrolled(course) ? 'not-allowed' : 'pointer'
              }}
            >
              {isEnrolled(course) ? 'Already Enrolled' : 'Enroll Now'}
            </button>
            <button onClick={handleShare} className="unique-share-btn">
              Share Course
            </button>
            {shareModal && (
              <div className="unique-share-modal">Link copied to clipboard!</div>
            )}
            <div className="unique-course-details">
              <div>
                <span>Duration:</span>
                <span>{course.duration}</span>
              </div>
              <div>
                <span>Lessons:</span>
                <span>{course.lessons.length}</span>
              </div>
              <div>
                <span>Level:</span>
                <span>{course.level}</span>
              </div>
              <div>
                <span>Certificate:</span>
                <span className={course.certificate ? 'yes' : 'no'}>
                  {course.certificate ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
          <div className="unique-req-section">
            <h3 className="unique-req-title">Requirements</h3>
            <div className="unique-req-list">
              {course.requirements.map((req, index) => (
                <div key={index} className="unique-req-item">
                  <div className="unique-req-dot"></div>
                  <span className="unique-req-text">{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {showCertificate && (
        <div className="unique-cert-overlay">
          <div className="unique-cert-modal">
            <Award size={64} color="#28a745" style={{ marginBottom: '1rem' }} />
            <h2 className="unique-cert-title">🎉 Certificate of Completion</h2>
            <p className="unique-cert-text">
              Congratulations! You have successfully completed "{course.title}".
            </p>
            <button
              onClick={() => setShowCertificate(false)}
              className="unique-cert-btn"
            >
              Download Certificate
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const LessonView = ({ lesson, course }: { lesson: Lesson, course: Course }) => (
    <div className="lessonview-unique-wrapper">
      <nav className="lessonview-unique-nav">
        <div className="lessonview-unique-nav-left">
          <button onClick={handleBackToCourse} className="lessonview-unique-back-btn">
            <ChevronLeft size={24} />
          </button>
          <div className="lessonview-unique-titlebox">
            <span className="lessonview-unique-course-title">{course.title}</span>
            <span className="lessonview-unique-lesson-title">{lesson.title}</span>
          </div>
        </div>
        <div className="lessonview-unique-nav-right">
          <button
            onClick={() => markLessonComplete(lesson.id)}
            className={`lessonview-unique-complete-btn ${lesson.completed ? 'lessonview-unique-complete-btn--done' : ''}`}
          >
            {lesson.completed ? <CheckCircle size={16} /> : <PlayCircle size={16} />}
            {lesson.completed ? 'Completed' : 'Mark Complete'}
          </button>
        </div>
      </nav>
      <div className="lessonview-unique-video-wrapper">
        <iframe
          src={lesson.videoUrl}
          title={lesson.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="lessonSection-x12A3">
        <div className="lessonGrid-y8B9f">
          <div>
            <div className="lessonCard-z4P7d">
              <h2 className="lessonTitle-c3R2k">{lesson.title}</h2>
              <p className="lessonDescription-b6L1m">{lesson.description}</p>
              <div className="lessonInfoBox-p2K9x">
                <div className="lessonInfoItem-h4N7j">
                  <Clock size={20} color="#666" />
                  <span>Duration: {lesson.duration}</span>
                </div>
                <div className="lessonInfoItem-h4N7j">
                  <User size={20} color="#666" />
                  <span>Instructor: {course.instructor}</span>
                </div>
              </div>
              {lesson.quiz && !quizOpen && (
                <div className="quizNotice-x9D3f">
                  <h3 className="quizNoticeTitle-k7L1p">Quiz Available</h3>
                  <p className="quizNoticeText-b4R2v">Test your knowledge after watching this lesson.</p>
                  <button onClick={openQuiz} className="quizStartBtn-j2N8m">Start Quiz</button>
                </div>
              )}
              {quizOpen && lesson.quiz && (
                <div className="quizContainer-h3L7b">
                  <h3 className="quizHeaderTitle-d2K5n">Quiz: {lesson.title}</h3>
                  {lesson.quiz.questions.map((q, i) => (
                    <div key={i} className="quizQuestionBlock-a8F1k">
                      <p className="quizQuestionText-r7G3s">{i + 1}. {q.question}</p>
                      {q.options.map((opt, idx) => (
                        <label
                          key={idx}
                          className={`quizOptionLabel-y4N2t ${quizAnswers[i] === idx ? 'selectedOpt-c9Q8b' : ''}`}
                        >
                          <input
                            type="radio"
                            name={`q${i}`}
                            value={idx}
                            checked={quizAnswers[i] === idx}
                            onChange={() => {
                              const newAnswers = [...quizAnswers];
                              newAnswers[i] = idx;
                              setQuizAnswers(newAnswers);
                            }}
                            className="quizRadioInput-t5C6j"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ))}
                  <button onClick={submitQuiz} disabled={quizSubmitted} className="quizSubmitBtn-z3L4m">
                    {quizSubmitted ? 'Submitted' : 'Submit Quiz'}
                  </button>
                  {quizSubmitted && quizResults && (
                    <div
                      className={`quizResultBox-p2V9n ${quizResults.correct / quizResults.total >= 0.7 ? 'quizSuccess-b6L8w' : 'quizFail-x1R2d'
                        }`}
                    >
                      <strong>Result:</strong> {quizResults.correct}/{quizResults.total} correct.
                      {quizResults.correct / quizResults.total >= 0.7 ? (
                        <span> 🎉 Lesson marked as completed!</span>
                      ) : (
                        <span> ❌ Please review the lesson and try again.</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="lessonListContainer-c7L9x">
              <h3 className="lessonListTitle-x2B5n">Course Lessons</h3>
              <div className="lessonListWrapper-t8R4m">
                {course.lessons.map((courseLesson, index) => (
                  <div
                    key={courseLesson.id}
                    className={`lessonListItem-p3K6v ${courseLesson.id === lesson.id
                      ? 'activeLesson-b2Y8r'
                      : courseLesson.completed
                        ? 'completedLesson-v1D4n'
                        : 'defaultLesson-m9F5t'
                      }`}
                    onClick={() => handleLessonClick(courseLesson)}
                  >
                    <div className="lessonListItemHeader-y6T3p">
                      <div className="lessonListItemInfo-a9W2k">
                        <div
                          className={`lessonListStatusCircle-n7C1f ${courseLesson.completed
                            ? 'circleCompleted-h5B3x'
                            : courseLesson.id === lesson.id
                              ? 'circleActive-q4V6m'
                              : 'circleDefault-e8K2t'
                            }`}
                        >
                          {courseLesson.completed ? <CheckCircle size={12} /> : index + 1}
                        </div>
                        <div>
                          <div
                            className={`lessonListTitleText-d3P9b ${courseLesson.id === lesson.id ? 'titleActive-j2Q7l' : 'titleDefault-s5L8r'
                              }`}
                          >
                            {courseLesson.title}
                          </div>
                          <div className="lessonListDuration-f4T6y">{courseLesson.duration}</div>
                        </div>
                      </div>
                      {courseLesson.id === lesson.id && <PlayCircle size={20} color="#3a25ff" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (viewMode === 'courses' && selectedCourse) {
    return <CourseOverview course={selectedCourse} />;
  }
  if (viewMode === 'lessons' && currentLesson && selectedCourse) {
    return <LessonView lesson={currentLesson} course={selectedCourse} />;
  }
  const Dashboard = () => {
    // 1. Initialize State for User Data
    const [user, setUser] = useState({ name: "Participant" }); // Simulating a logged-in user
    const [userData, setUserData] = useState({
      coursesEnrolled: 5, // Initial value
      // ... other data
    });

    const [dropdownOpen, setDropdownOpen] = useState(false);

    // 2. Create the Handle Click Function
    const handleEnrollClick = () => {
      // Check if user is logged in
      if (!user) {
        alert('Please log in to enroll in this course.');
        return;
      }

      // A. Increment the count in State
      setUserData(prevData => ({
        ...prevData,
        coursesEnrolled: (prevData.coursesEnrolled || 0) + 1
      }));

      toast.success("Successfully enrolled in the course!");

      setDropdownOpen(true);
    };
  };

  return (
    <div className="min-h-screen" style={{
      backgroundColor: '#f8f7f4',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#333'
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <nav className="navbar-container2">
        <div className="navbar-logo2">
          <NavLink to="/homepage">
            <img src="src/assets/img/logo2.png" className="logo2" alt="Logo" />
          </NavLink>
        </div>
        <ul className="navbar-links2">
          <li>
            <NavLink
              to="/courses"
              className={({ isActive }) => `nav-link-item2 ${isActive ? 'active' : ''}`}
            >
              <BookOpen size={20} className="nav-icon2" /> Course
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/jobs"
              className={({ isActive }) => `nav-link-item2 ${isActive ? 'active' : ''}`}
            >
              <Briefcase size={20} className="nav-icon2" /> Jobs
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/ai"
              className={({ isActive }) =>
                `nav-link-item2 chatbot-link2 ${isActive ? 'active' : ''}`
              }
            >
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

          {dropdownOpen && (
            <div className="profile-dropdown">
              <div className="profile-header">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="Profile" className="profile-pic" />
                ) : (
                  <FaUser size={40} color="#fff" />
                )}
                <div className="user-dropdown-info">
                  <h4>Welcome, {userData?.displayName || user?.displayName || 'User'}!</h4>
                  <div className="role-badge">
                  </div>
                </div>
              </div>

              <ul className="dropdown-stats">
                <li><FaUserTag /> Role:<span>{userData?.role || 'Member'}</span></li>
                <li><FaTools /> Skills: <span>{userData?.skills?.length || 0}</span></li>
                <li><FaBriefcase /> Applied Jobs: <span>{userData?.appliedJobs || 0}</span></li>
                <li><FaPlusSquare /> Jobs Added: <span>{userData?.jobsPosted || 0}</span></li>
                <li><FaFileAlt /> Shared Notes: <span>{ 1}</span></li>
              </ul>

              <div className="profile-actions">
                <Link to="/profile" className="profile-link" onClick={() => setDropdownOpen(false)}>
                  View Profile
                </Link>
                <button className="logout-btn" onClick={handleLogout}>
                  <FaSignOutAlt /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="divider2"></div>


        <div className="navbar-actions">
          <button className="signOut-button">
            <Link to="/signin">Sign Out</Link>
          </button>

        </div>


      </nav>
      {/* Main Hero Section */}
      <main style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '90px', width: '100%', paddingLeft: '50px', minHeight: '70vh'
      }}>
        <div style={{ flex: 1, maxWidth: '500px', paddingRight: '150px' }}>
          <h1 className='title-courses'>
            Discover Courses That Empower Your Next Chapter
          </h1>
          <p className='para-courses'>
            New School is an Aggregator Multimedia education Materials from around the world.
          </p>
        </div>
        <div className="landing-right-panel">
          <div className="deco-circle circle-1"></div>
          <div className="deco-circle circle-2"></div>
          <div className="deco-circle circle-3"></div>
          <div className="deco-circle circle-4"></div>
          <div className="deco-circle circle-5"></div>
          <div className="deco-circle circle-6"></div>
          <div className="deco-circle circle-7"></div>
          <div className="student-image-grid">
            <div className="student-card card-1">
              <img src='https://i.pinimg.com/736x/3e/58/8d/3e588df028341b0e3962727a7e9f196c.jpg' alt="student 1" />
            </div>
            <div className="student-card card-2">
              <img src='https://i.pinimg.com/736x/e6/31/e0/e631e0915e5a6e48ab5fd5ccaa1ea241.jpg' alt="student 2" />
            </div>
            <div className="student-card card-3">
              <img src='https://i.pinimg.com/736x/60/a1/71/60a1719d559469dbb6bfa1b6d0890e5e.jpg' alt="student 3" />
            </div>
            <div className="student-card card-4">
              <img src='https://i.pinimg.com/736x/b7/e1/89/b7e1890a31f2565cadb80779c7386c2d.jpg' alt="student 4" />
            </div>
          </div>
        </div>
      </main>
      <h2 className='categories-title'>Available Categories</h2>
      <p className='section-subtitle'>Explore our wide range of categories to meet all your needs.</p>
      <nav style={{
        display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap'
      }}>
        {SECTIONS.map((sec) => (
          <button key={sec.id} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '50px', border: activeSection === sec.id ? '1px solid #3a25ff' : '1px solid #ddd', background: activeSection === sec.id ? 'linear-gradient(135deg, #3a25ff, #5a4bff)' : '#fff', color: activeSection === sec.id ? '#fff' : '#333', cursor: 'pointer', fontWeight: '500', transition: 'all 0.3s ease', boxShadow: activeSection === sec.id ? '0 4px 15px rgba(58, 37, 255, 0.3)' : 'none'
          }} onClick={() => setActiveSection(sec.id)}>
            <span style={{ fontSize: '1.1rem' }}>{React.isValidElement(sec.icon) ? sec.icon : null}</span> {sec.title}
          </button>
        ))}
      </nav>
      {userData?.role === 'Coordinator' && (
        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
          padding: '0 50px'
        }}>

        </div>
      )}
      {userData?.role === 'Coordinator' && (
        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
          padding: '0 20px'
        }}>

        </div>
      )}
      <div style={{
        backgroundColor: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', border: '1px solid #e8e9ea'
      }}>
        {updatedCurrentSection && (
          <>
            <div className="tab-buttons">
              <button
                className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
                onClick={() => setActiveTab('courses')}
              >
                <BookOpen size={20} />
                Courses
              </button>
              <button
                className={`tab-button ${activeTab === 'exercises' ? 'active' : ''}`}
                onClick={() => setActiveTab('exercises')}
              >
                <Award size={20} />
                Exercises
              </button>
              <button
                className={`tab-button ${activeTab === 'sharedNotes' ? 'active' : ''}`}
                onClick={() => setActiveTab('sharedNotes')}
              >
                <Users size={20} />
                Shared Notes
              </button>

            </div>
            {activeTab === 'courses' && (

              <div style={{ padding: '20px' }}> {/* Optional: A main container with padding for the entire page content */}
                {/* Only show the Add Course button if the user is a Coordinator */}
                {userData?.role === 'Coordinator' && (
                  <button
                    onClick={() => navigate('/add-course')}
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      margin: '0 auto',
                      marginBottom: '30px',

                      // LIGHT GREY BASE
                      backgroundColor: '#f8f9fa',
                      color: '#343a40',

                      // Modern Shape and Shadow
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #dee2e6',
                      padding: '12px 30px',
                      borderRadius: '16px',
                      fontSize: '17px',
                      fontWeight: '600',
                      cursor: 'pointer',

                      // Smoother, professional transition
                      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',

                      width: '240px',
                      height: '60px',
                      gap: '10px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                      e.currentTarget.style.backgroundColor = '#e9ecef';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(58, 37, 255, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }}
                  >
                    <Plus size={20} />
                    Add New Course
                  </button>
                )}
                <div className="courseGrid-x8R1m">

                  {loadingCourses ? (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '40px',
                      flexDirection: 'column',
                      gap: '16px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #e2e8f0',
                        borderTop: '4px solid #3a25ff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <p style={{ color: '#718096', fontSize: '16px' }}>Loading courses...</p>

                    </div>
                  ) : updatedCurrentSection && updatedCurrentSection.courses.length > 0 ? (
                    <>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "24px",
                          padding: "16px 24px",
                          borderRadius: "10px",
                          height: "100px",
                          position: 'absolute',
                          top: '1065px',
                          gap: "40px",            // space between left & right sections
                        }}
                      >
                        {/* Left Side */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",          // space between icon & title
                          }}
                        >
                          <BookOpen size={20} color="#3a25ff" />
                          <h3
                            style={{
                              margin: 0,
                              color: "#2d3748",
                              fontSize: "16px",
                              fontWeight: "700",
                            }}
                          >
                            Courses ({updatedCurrentSection.courses.length})
                          </h3>
                        </div>

                        {/* Right Side */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",          // space between users, count, loading, button
                          }}
                        >
                          <Users size={14} color="#4a5568" />
                          <span style={{ fontSize: "12px", color: "#4a5568" }}>
                            {firebaseCourses.length}
                          </span>

                          {/* Loading */}
                          {loadingCourses && (
                            <div
                              style={{
                                width: "12px",
                                height: "12px",
                                border: "2px solid #3a25ff",
                                borderTop: "2px solid transparent",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                              }}
                            />
                          )}

                          {/* Reload button */}
                          {!loadingCourses && firebaseCourses.length === 0 && (
                            <button
                              onClick={loadFirebaseCourses}
                              style={{
                                background: "#0a091bff",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                padding: "6px 10px",
                                fontSize: "11px",
                                cursor: "pointer",
                                fontWeight: "600",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Reload
                            </button>
                          )}
                        </div>

                      </div>
                      {updatedCurrentSection.courses.map((course) => (

                        <div
                          key={course.id}
                          className="courseCard-k4L9b"
                          onClick={() => handleCourseClick(course as any)}
                        >
                          <div className="courseThumbnailContainer-b7C2v">
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="courseThumbnailImage-n6Q5t"
                            />
                            <div className="courseOverlay-f5T8n">
                              <button title="btn" className="coursePlayBtn-d9K3y">
                                <Play size={24} fill="#3a25ff" color="#3a25ff" />
                              </button>
                            </div>
                            {course.certificate && (
                              <div className="courseCertificateBadge-h2P7w">
                                <Award size={16} /> Certificate
                              </div>
                            )}
                          </div>

                          <div className="courseContent-v3M6q">
                            <div className="courseHeader-r9X2s">
                              <h3 className="courseTitle-y8D4l">{course.title}</h3>
                              {/* Firebase Course Indicator */}
                              {firebaseCourses.some(fc => fc.id === course.id) && (
                                <div style={{
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  padding: '4px 8px',
                                  borderRadius: '12px',
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  marginLeft: '8px'
                                }}>
                                  🔥 Firebase
                                </div>
                              )}
                              <div className="courseRatingBox-p1B7f">
                                <Star size={16} fill="#ffc107" color="#ffc107" />
                                <span className="courseRatingValue-f3N1k">{course.rating}</span>
                                <span className="courseParticipantCount-t6L8r">
                                  ({formatNumber(course.Participants)})
                                </span>
                              </div>
                            </div>
                            <p className="courseDescription-n2W4z">{course.description}</p>
                            <div className="courseInstructorBox-c7F1m">
                              <span className="courseInstructorLabel-d3R5x">Instructor:</span>
                              <span className="courseInstructorName-h4N9p">
                                {course.instructor}
                              </span>
                            </div>
                            <div className="courseInfoGroup-s5B8k">
                              <div className="courseInfoItem-j2T3r">
                                <Clock size={14} /> <span>{course.duration}</span>
                              </div>
                              <div className="courseInfoItem-j2T3r">
                                <BookOpen size={14} />{' '}
                                <span>{course.lessons.length} lessons</span>
                              </div>
                              <div className="courseInfoItem-j2T3r">
                                <Users size={14} />{' '}
                                <span>{formatNumber(course.Participants)} Participants</span>
                              </div>
                            </div>
                            <div className="courseLevelBox-q9V5e">
                              <span
                                className="courseLevelLabel-m6L1a"
                                style={{ backgroundColor: getLevelColor(course.level) }}
                              >
                                {course.level}
                              </span>
                            </div>
                            <div className="courseFooter-t8W7l">
                              <div className="coursePriceBox-p6C3n">
                                <span className="coursePrice-r4A2j">{course.price}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                                {user && user.uid === course.CoordinatorId && (
                                  <button
                                    className='editcourse2'
                                    onClick={(e) => {
                                      navigate('/add-course')
                                      e.stopPropagation();
                                      handleEditClick(course.id);

                                    }}
                                    style={{
                                      background: 'transparent', // Transparent for "bordered" look
                                      color: '#3a25ff',
                                      border: '1.5px solid #3a25ff', // Visible border
                                      borderRadius: '8px',
                                      padding: '6px 14px',
                                      fontSize: '13px',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                      width: '100px',
                                      height: '40px',
                                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                      letterSpacing: '0.3px',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = '#3a25ff'; // Fills color on hover
                                      e.currentTarget.style.color = 'white';
                                      e.currentTarget.style.transform = 'translateY(-2px)';
                                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(58, 37, 255, 0.25)'; // Glow effect
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'transparent';
                                      e.currentTarget.style.color = '#3a25ff';
                                      e.currentTarget.style.transform = 'translateY(0)';
                                      e.currentTarget.style.boxShadow = 'none';
                                    }}
                                  >
                                    Edit
                                  </button>
                                )}
                                <button className="courseViewBtn-f7B9q">View Course</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                      } </>
                  ) : (
                    <div className="noCoursesBox-c9K4t">
                      <BookOpen size={48} color="#ccc" />
                      <h3 className="noCoursesTitle-x3L1p">No courses available</h3>
                      <p className="noCoursesText-v2N6m">
                        Check back soon for new courses in this category.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === "exercises" && (
              <div className="exercisesContainer_a92hL">
                {userData?.role === 'Coordinator' && (
                  <button
                    onClick={() => navigate('/addExercises')}
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      margin: '0 auto',

                      // LIGHT GREY BASE
                      backgroundColor: '#f8f9fa',
                      color: '#343a40',

                      // Modern Shape and Shadow
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #dee2e6',
                      padding: '12px 30px',
                      borderRadius: '16px',
                      fontSize: '17px',
                      fontWeight: '600',
                      cursor: 'pointer',

                      // Smoother, professional transition
                      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',

                      width: '240px',
                      height: '60px',
                      gap: '10px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                      e.currentTarget.style.backgroundColor = '#e9ecef';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }}
                  >
                    <Plus size={20} />
                    Add New Exercise
                  </button>
                )}
                {loadingExercises ? (

                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    Loading exercises...
                  </div>
                ) : (
                  (() => {
                    // Only include firebase exercises that belong to the current section (by category/id/title)
                    const firebaseExercisesForSection = (firebaseExercises || []).filter((ex: any) => {
                      const exerciseCat = String(ex.category || ex.course || '').toLowerCase().trim();
                      const currentSectionObj = SECTIONS.find(s => s.id === activeSection);
                      const sectionTitle = currentSectionObj?.title || activeSection;
                      const sectionId = currentSectionObj?.id || activeSection;
                      return exerciseCat === sectionId.toLowerCase() || exerciseCat === sectionTitle.toLowerCase();
                    });

                    const existingIds = new Set((updatedCurrentSection?.exercises || []).map((e: any) => String(e.id)));

                    const allExercises: Exercise[] = [
                      ...(updatedCurrentSection?.exercises || []),
                      ...firebaseExercisesForSection.filter((e: any) => !existingIds.has(String(e.id)))
                    ];
                    if (allExercises.length === 0) {
                      return (
                        <div className="noExercisesContainer_b2hPq">

                          <h3 className="noExercisesTitle_z3kWf">No exercises available</h3>
                          <p className="noExercisesText_c7rNs">
                            Check back soon for new exercises in this category.
                          </p>

                          {!loadingExercise && firebaseExercises.length === 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                              <span style={{ color: '#e53e3e', fontSize: '12px' }}>
                                No Firebase exercise found
                              </span>
                              <button
                                onClick={loadFirebaseExercise}
                                style={{
                                  background: '#3a25ff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  fontSize: '10px',
                                  cursor: 'pointer',
                                  fontWeight: '600'
                                }}
                              >
                                🔄 Reload Firebase
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <>

                        {!loadingExercise && firebaseExercises.length === 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                            <span style={{ color: '#e53e3e', fontSize: '12px' }}>
                              No Firebase exercise found
                            </span>
                            <button
                              onClick={loadFirebaseExercise}
                              style={{
                                background: '#3a25ff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '10px',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                            >
                              🔄 Reload
                            </button>
                          </div>
                        )}
                        {/* Map over the combined list of all exercises */}
                        {allExercises.map((exercise: Exercise) => ( // Explicit type for exercise
                          <div key={exercise.id} className="exerciseCard_s73Kx">
                            <div className="exerciseTop_xb7Lp">
                              <div
                                className={`exerciseIcon_wf5Rt ${exercise.completed ? "completed" : "notCompleted"
                                  }`}
                              >
                                {exercise.completed ? "🏆" : "▶️"}
                              </div>
                              <div className="exerciseContent_i9rTb">
                                <div className="exerciseHeader_d4mQp">
                                  <h3 className="exerciseTitle_o8rVz">{exercise.title}</h3>
                                  {firebaseExercises.some(fc => fc.id === exercise.id) && ( // Simplified check
                                    <div style={{
                                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      color: 'white',
                                      padding: '4px 8px',
                                      borderRadius: '12px',
                                      fontSize: '10px',
                                      fontWeight: '600',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                      marginLeft: '8px'
                                    }}>
                                      🔥 Firebase
                                    </div>
                                  )}
                                  <span
                                    className={`exerciseDifficulty_w8nLo ${exercise.difficulty}`}
                                    style={{
                                      backgroundColor: getDifficultyColor(exercise.difficulty),
                                    }}
                                  >
                                    {exercise.difficulty}
                                  </span>
                                </div>
                                <div className="exerciseDetails_n6yQr">
                                  <span className="exerciseType_m3pDs">{exercise.type}</span>
                                  <div className="exerciseStats_c2eHr">
                                    <div className="exerciseStat_g5kLp">⏱️ {exercise.duration}</div>
                                    <div className="exerciseStat_g5kLp">⭐ {exercise.points} pts</div>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => toggleExpand(exercise.id)}
                                className={`exerciseButton_v4tLs ${exercise.completed ? "completedBtn" : ""
                                  }`}
                              >
                                {exercise.completed
                                  ? "Completed"
                                  : expandedId === exercise.id
                                    ? "Hide"
                                    : "Start Now"}
                              </button>
                            </div>
                            {expandedId === exercise.id && exercise.questions && (
                              <div className="exerciseExpandArea_a7pFt">
                                {exercise.questions.map((q: ExerciseQuestion, idx: number) => (
                                  <div key={idx} className="exerciseQuestion_r2bKp">
                                    <div className="exerciseQuestionText_g1nQo">
                                      {idx + 1}. {q.question}
                                    </div>
                                    {q.options.map((option: string) => (
                                      <label key={option} className="exerciseOption_b3xYn">
                                        <input
                                          type="radio"
                                          name={`exercise-${exercise.id}-q${idx}`}
                                          value={option}
                                          checked={
                                            exerciseAnswers[exercise.id]?.[idx] === option
                                          }
                                          onChange={(e) => {
                                            const newAnswers = [...(exerciseAnswers[exercise.id] || [])];
                                            newAnswers[idx] = e.target.value;
                                            setExerciseAnswers((prev) => ({
                                              ...prev,
                                              [exercise.id]: newAnswers,
                                            }));
                                          }}
                                        />
                                        {option}
                                      </label>
                                    ))}
                                  </div>
                                ))}
                                <button
                                  className="exerciseSubmit_k7sUi"
                                  onClick={async () => {
                                    const answers: string[] = exerciseAnswers[exercise.id] || [];
                                    let correctCount = 0;

                                    // 1. Check Answers
                                    if (exercise.questions?.length) {
                                      exercise.questions.forEach((q: ExerciseQuestion, idx: number) => {
                                        const selected = String(answers[idx] || "").trim().toLowerCase();
                                        const correct = String(q.correctAnswer || "").trim().toLowerCase();
                                        if (selected === correct) {
                                          correctCount++;
                                        }
                                      });

                                      // 2. Show UI Result
                                      setExerciseAnswers((prev) => ({
                                        ...prev,
                                        [`${exercise.id}_result`]: `You got ${correctCount} out of ${exercise.questions?.length || 0} correct!`,
                                      }));

                                      // 3. CHECK DUPLICATES (Prevent double counting)
                                      const currentExerciseId = String(exercise.id);
                                      const completedIds: string[] = userData?.completedExerciseIds || [];

                                      if (completedIds.includes(currentExerciseId)) {
                                        toast('You have already completed this exercise.');
                                        return;
                                      }

                                      // 4. Update Local State (Immediate UI Update)
                                      if (setUserData) {
                                        setUserData((prev: any) => ({
                                          ...prev,
                                          exercisesCompleted: (prev?.exercisesCompleted || 0) + 1,
                                          completedExerciseIds: [...(prev?.completedExerciseIds || []), currentExerciseId],
                                        }));
                                      }

                                      // 5. Save to Backend (Firebase)
                                      if (user?.uid) {
                                        try {
                                          const userRef = doc(db, "users", user.uid);
                                          await updateDoc(userRef, {
                                            exercisesCompleted: increment(1), // Atomic increment
                                            completedExerciseIds: arrayUnion(currentExerciseId) // Atomic array add
                                          });
                                          console.log("Progress saved to Firebase");
                                        } catch (error) {
                                          console.error("Failed to save progress", error);
                                        }
                                      }

                                    } else {
                                      setExerciseAnswers((prev) => ({
                                        ...prev,
                                        [`${exercise.id}_result`]: "No questions to check.",
                                      }));
                                    }
                                  }}
                                >
                                  Submit
                                </button>
                                {exerciseAnswers[`${exercise.id}_result`] && (
                                  <div className="exerciseResult_j9uQo">
                                    {exerciseAnswers[`${exercise.id}_result`]}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    );
                  })()
                )}
              </div>
            )}
            {activeTab === 'sharedNotes' && renderSharedNotesTab()}
          </>
        )}
      </div>
    </div>
  );
}

export default Courses;