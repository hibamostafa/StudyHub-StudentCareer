import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  addDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  increment, 
  getCountFromServer,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../firebaseConfig';

// --- Interfaces ---

// Represents a user in our system (Participant or Coordinator)
export interface UserData {
  id: string;
  uid: string;
  email: string;
  role: 'Participant' | 'Coordinator';
  isApproved: boolean;
  displayName: string;
  photoURL: string | null;
  phone: string | null;
  location: string | null;
  createdAt: any;
  appliedJobs: number;
  coursesEnrolled: number;
  coursesCreated: number;
  sharedNotes: number;
  downloads: number;
  exercisesCompleted: number;
  cvUploaded: boolean;
  cvDetails: any;
  registeredCourses: any[];
  appliedJobsList: any[];
  interestedJobs: any[];
  skills: string[];
  firstName?: string;
  lastName?: string;
}

// A single lesson inside a course
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

// Full course info — used when creating or viewing a course
export interface CourseData {
  id?: string;
  title: string;
  description: string;
  category: string;
  price?: string;
  instructor: string;
  duration: string;
  lessons: number | Lesson[]; // Initially number, later becomes array
  difficulty: string;
  certificate: boolean;
  overview: string;
  requirements: string[];
  whatYouLearn: string[];
  courseLinks: Array<{ id: string; title: string; url: string; type: string }>;
  thumbnail?: File | string | null;
  CoordinatorId?: string;
  CoordinatorName?: string;
  createdAt?: any;
  Participants?: any[];
  rating?: number;
  reviews?: number;
  ParticipantsCount?: number;
  modules?: number;
  level?: string;
  originalPrice?: string | null;
  progress?: number;
}

// Represents a practice exercise (like a quiz or coding task)
interface ExerciseData {
  id?: string | number;
  title: string;
  category: string;
  difficulty: string;
  duration: string;
  points: number;
  completed?: boolean;
  questions?: {
    question: string;
    options: string[];
    correctAnswer: string;
  }[];
}

// --- Auth Service ---

export const AuthService = {
  // Creates a new user + profile. Used by admin after interview.
  signUp: async (
    email: string,
    password: string,
    role: 'Participant' | 'Coordinator',
    additionalData: { firstName: string; lastName: string; phone?: string }
  ): Promise<User> => {
    // Step 1: Create Firebase Auth account
    const res = await createUserWithEmailAndPassword(auth, email, password);

    // Step 2: Save full profile in Firestore instantly
    await setDoc(doc(db, 'users', res.user.uid), {
      uid: res.user.uid,
      email: email.toLowerCase(),
      role: role, 
      isApproved: true, // No approval needed — assume trusted sign-up
      firstName: additionalData.firstName,
      lastName: additionalData.lastName,
      displayName: `${additionalData.firstName} ${additionalData.lastName}`,
      photoURL: null,
      phone: additionalData.phone || null,
      location: null,
      createdAt: serverTimestamp(),
      appliedJobs: 0,
      coursesEnrolled: 0,
      coursesCreated: 0,
      sharedNotes: 0,
      downloads: 0,
      exercisesCompleted: 0,
      cvUploaded: false,
      cvDetails: null,
      registeredCourses: [],
      appliedJobsList: [],
      interestedJobs: [],
      skills: [],
    });
    
    return res.user;
  },

  // 2. Fetch user role (Important for Redirection)
  getUserRole: async (uid: string): Promise<'Participant' | 'Coordinator' | null> => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().role as 'Participant' | 'Coordinator';
    }
    return null;
  },

  // 3. SignIn with role check
  signIn: async (email: string, password: string) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const role = await AuthService.getUserRole(res.user.uid);
    
    if (!role) {
      throw new Error("No user profile found. Please contact support.");
    }

    return { user: res.user, role };
  },

  signOut: async (): Promise<void> => {
    await signOut(auth);
  },

  onAuthChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },
};

// --- User Service ---

export const UserService = {
  getUserData: async (userId: string): Promise<UserData | null> => {
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);
    return userSnapshot.exists() ? { id: userSnapshot.id, ...userSnapshot.data() } as UserData : null;
  },

  getAllUsers: async () => {
    const usersCollectionRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollectionRef);
    return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  incrementField: async (userId: string, fieldName: string) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [fieldName]: increment(1)
    });
  },

  updateUserData: async (userId: string, data: Record<string, any>) => {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, data);
  },

  uploadProfileImage: async (userId: string, file: File): Promise<string> => {
    const storageRef = ref(storage, `profile-images/${userId}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    const userDocRef = doc(db, 'users', userId);
    const currentUser = auth.currentUser;

    const promises: Promise<any>[] = [updateDoc(userDocRef, { photoURL: downloadURL })];

    if (currentUser && currentUser.uid === userId) {
      promises.push(updateProfile(currentUser, { photoURL: downloadURL }));
    }

    await Promise.all(promises);
    return downloadURL;
  },

  updateUserStats: async (userId: string) => {
    try {
      const applicationsQuery = query(collection(db, 'applications'), where('userId', '==', userId));
      const countSnapshot = await getCountFromServer(applicationsQuery);
      const appliedJobsCount = countSnapshot.data().count;

      const userDocRef = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userDocRef);
      if (!userSnapshot.exists()) return;

      const userData = userSnapshot.data();
      const coursesEnrolledCount = (userData.registeredCourses || []).length;

      await updateDoc(userDocRef, {
        appliedJobs: appliedJobsCount,
        coursesEnrolled: coursesEnrolledCount,
      });

      return { appliedJobs: appliedJobsCount, coursesEnrolled: coursesEnrolledCount };
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  },
};



export const NotesService = {
  // Upload a note file (PDF, DOC, etc.) and save metadata
  uploadNote: async (file: File, userId: string) => {
    const storageRef = ref(storage, `notes/${userId}/${file.name}`);
    
    await uploadBytes(storageRef, file);
    const fileURL = await getDownloadURL(storageRef);

    // Save note record + increment user's "shared notes" count
    await Promise.all([
        addDoc(collection(db, 'notes'), {
            fileName: file.name,
            fileURL,
            userId,
            uploadedAt: serverTimestamp(),
            shared: false, // Could be used later for public/private toggle
        }),
        UserService.incrementField(userId, 'sharedNotes') // Track how many notes user shared
    ]);

    return fileURL;
  },

  // Like a note (in 'sharedNotes' collection)
  likeNote: async (noteId: string, userId: string) => {
    const noteRef = doc(db, 'sharedNotes', noteId);
    await updateDoc(noteRef, {
      likes: increment(1),
      likedBy: arrayUnion(userId) // Prevent double-liking
    });
  },

  // Unlike a note
  unlikeNote: async (noteId: string, userId: string) => {
    const noteRef = doc(db, 'sharedNotes', noteId);
    await updateDoc(noteRef, {
      likes: increment(-1),
      likedBy: arrayRemove(userId)
    });
  },

  // Dislike (similar logic)
  dislikeNote: async (noteId: string, userId: string) => {
    const noteRef = doc(db, 'sharedNotes', noteId);
    await updateDoc(noteRef, {
      dislikes: increment(1),
      dislikedBy: arrayUnion(userId)
    });
  },

  undislikeNote: async (noteId: string, userId: string) => {
    const noteRef = doc(db, 'sharedNotes', noteId);
    await updateDoc(noteRef, {
      dislikes: increment(-1),
      dislikedBy: arrayRemove(userId)
    });
  },

  // Add a comment under a note (stores in sub-collection)
  addComment: async (
    noteId: string,
    commentData: {
      text: string;
      userId: string;
      userName: string;
      userPhoto: string | null;
      replyTo?: string; // For nested replies (optional)
    }
  ) => {
    const commentsRef = collection(db, 'sharedNotes', noteId, 'comments');
    const newComment = {
      ...commentData,
      createdAt: serverTimestamp(),
    };
    await addDoc(commentsRef, newComment);

    // Also update total comment count on the note
    const noteRef = doc(db, 'sharedNotes', noteId);
    await updateDoc(noteRef, {
      commentCount: increment(1)
    });
  },

  // Get a single note by ID
  getNote: async (noteId: string) => {
    const noteRef = doc(db, 'sharedNotes', noteId);
    const noteSnap = await getDoc(noteRef);
    if (noteSnap.exists()) {
      return { id: noteSnap.id, ...noteSnap.data() };
    }
    return null;
  },
};

// Job applications management
export const ApplicationsService = {
  // Move an application to next stage (e.g., from "pending" to "interview")
  updateStatus: async (applicationId: string, nextStatus: 'pending' | 'reviewing' | 'interview' | 'offered' | 'rejected' | 'hired') => {
    const appRef = doc(db, 'applications', applicationId);
    const snap = await getDoc(appRef);
    if (!snap.exists()) return;
    const data = snap.data();
    
    await updateDoc(appRef, {
      status: nextStatus,
      stage: nextStatus,
      lastUpdatedAt: serverTimestamp(),
      statusHistory: arrayUnion({ status: nextStatus, at: new Date() }) 
    });

    // Keep job-level stats updated (e.g., how many applicants in "reviewing")
    if (data.jobId) {
        await JobService.updateApplicantsAggregates(String(data.jobId));
    }
  },

  // Mark application as viewed by recruiter
  markViewed: async (applicationId: string) => {
    const appRef = doc(db, 'applications', applicationId);
    const snap = await getDoc(appRef);
    if (!snap.exists()) return;
    const data = snap.data();

    await updateDoc(appRef, { viewed: true, viewedAt: serverTimestamp(), lastUpdatedAt: serverTimestamp() });
    
    if (data.jobId) {
      await JobService.updateApplicantsAggregates(String(data.jobId));
    }
  },

  // Add internal note to an application (for recruiters)
  addNote: async (applicationId: string, note: string) => {
    const appRef = doc(db, 'applications', applicationId);
    await updateDoc(appRef, { 
        notes: arrayUnion({ note, at: new Date() }), 
        lastUpdatedAt: serverTimestamp() 
    });
  },

  // Score an applicant (e.g., 1–5 rating)
  scoreApplicant: async (applicationId: string, score: number) => {
    const appRef = doc(db, 'applications', applicationId);
    await updateDoc(appRef, { score, lastUpdatedAt: serverTimestamp() });
  },

  // Get all applications for a specific job
  getByJob: async (jobId: string) => {
    const qApps = query(collection(db, 'applications'), where('jobId', '==', jobId));
    const snap = await getDocs(qApps);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // Generate stats for a job (used in dashboard)
  getStats: async (jobId: string) => {
    const apps = await ApplicationsService.getByJob(jobId);
    
    const byStatus: Record<string, number> = {};
    const domains: Record<string, number> = {};
    let viewed = 0;
    const userIds = new Set<string>();
    
    apps.forEach((a: any) => {
      const s = a.status || 'pending';
      byStatus[s] = (byStatus[s] || 0) + 1;
      if (a.viewed) viewed += 1;
      const d = a.emailDomain; // e.g., "gmail.com"
      if (d) domains[d] = (domains[d] || 0) + 1;
      if (a.userId) userIds.add(String(a.userId));
      else if (a.email) userIds.add(`email:${a.email}`); // Fallback for non-auth applicants
    });
    
    const total = apps.length;
    return { total, byStatus, viewed, domains, uniqueApplicants: userIds.size };
  },
};

// Keeps job postings updated with real-time applicant stats
export const JobService = {
  updateApplicantsAggregates: async (jobId: string) => {
    const stats = await ApplicationsService.getStats(jobId);
    
    // Get top 5 email domains (to spot spam or target schools/companies)
    const topDomains = Object.entries(stats.domains)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([domain, count]) => ({ domain, count }));
    
    const jobRef = doc(db, 'jobs', jobId);
    
    await updateDoc(jobRef, {
      applicantsCount: stats.total,
      applicantsByStatus: stats.byStatus,
      applicantsViewedCount: stats.viewed,
      topEmailDomains: topDomains,
      uniqueApplicants: stats.uniqueApplicants,
      aggregatesUpdatedAt: serverTimestamp(),
    });
  },
};

// Handles course creation, enrollment, and management
export const CourseService = {
  // Coordinator uploads a new course
  uploadCourse: async (courseData: CourseData, userId: string) => {
    const userData = await UserService.getUserData(userId);

    // Only Coordinators can create courses
    if (!userData || userData.role !== 'Coordinator') {
      throw new Error('You do not have permission to upload courses. You must be a Coordinator.');
    }

    // Enforce category selection
    if (!courseData.category || courseData.category.trim() === '') {
      throw new Error('❌ Course category is required! Please select a category before submitting.');
    }

    // Upload thumbnail if provided
    let thumbnailUrl = null;
    if (courseData.thumbnail && courseData.thumbnail instanceof File) {
      const thumbnailRef = ref(storage, `courses/${userId}/${Date.now()}_${courseData.thumbnail.name}`);
      const snapshot = await uploadBytes(thumbnailRef, courseData.thumbnail);
      thumbnailUrl = await getDownloadURL(snapshot.ref);
    }

    // Convert courseLinks (from form) into structured lessons
    const lessons: Lesson[] = courseData.courseLinks.map((link, index) => ({
      id: index + 1,
      title: link.title || `Lesson ${index + 1}`,
      duration: '00:00',
      videoUrl: link.url || '',
      completed: false,
      description: `This is ${link.title || `lesson ${index + 1}`}.`,
    }));

    // Save course to Firestore
    const courseRef = await addDoc(collection(db, 'courses'), {
      title: courseData.title,
      description: courseData.description,
      category: courseData.category,
      price: courseData.price || 'Free',
      instructor: courseData.instructor,
      duration: courseData.duration,
      lessons: lessons,
      difficulty: courseData.difficulty,
      certificate: courseData.certificate,
      overview: courseData.overview,
      requirements: courseData.requirements,
      whatYouLearn: courseData.whatYouLearn,
      courseLinks: courseData.courseLinks,
      thumbnail: thumbnailUrl,
      CoordinatorId: userId,
      CoordinatorName: userData.displayName || `${userData.firstName} ${userData.lastName}`.trim() || 'Coordinator',
      createdAt: serverTimestamp(),
      Participants: [],
      rating: 0,
      reviews: 0,
      ParticipantsCount: 0,
      modules: courseData.courseLinks.length,
      level: courseData.difficulty,
      originalPrice: null,
      progress: 0,
    });

    // Increment coordinator's course count
    await updateDoc(doc(db, 'users', userId), {
        coursesCreated: increment(1)
    });

    return { id: courseRef.id, ...courseData, thumbnail: thumbnailUrl };
  },

  // Get all courses (for homepage or catalog)
  getAllCourses: async () => {
    try {
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      return coursesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CourseData));
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },

  // Get courses created by a specific Coordinator
  getCoursesByCoordinator: async (CoordinatorId: string) => {
    const q = query(collection(db, 'courses'), where('CoordinatorId', '==', CoordinatorId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as CourseData));
  },

  getMyCourses: async (CoordinatorId: string) => {
    // Alias for getCoursesByCoordinator
    return CourseService.getCoursesByCoordinator(CoordinatorId);
  },

  // Edit an existing course (only owner can do this)
  updateCourse: async (courseId: string, updatedData: Partial<CourseData>, userId: string) => {
    const courseDocRef = doc(db, 'courses', courseId);
    const courseSnapshot = await getDoc(courseDocRef);

    if (!courseSnapshot.exists()) {
      throw new Error('Course not found');
    }

    const existingCourse = courseSnapshot.data();

    if (existingCourse.CoordinatorId !== userId) {
      throw new Error('You do not have permission to edit this course');
    }

    // Handle thumbnail update if new file uploaded
    let thumbnailUrl = existingCourse.thumbnail;
    if (updatedData.thumbnail && updatedData.thumbnail instanceof File) {
      const thumbnailRef = ref(storage, `courses/${userId}/${Date.now()}_${updatedData.thumbnail.name}`);
      const snapshot = await uploadBytes(thumbnailRef, updatedData.thumbnail);
      thumbnailUrl = await getDownloadURL(snapshot.ref);
    }

    // Rebuild lessons if courseLinks changed
    let lessonsUpdate: Lesson[] | undefined = undefined;
    if (updatedData.courseLinks) {
      lessonsUpdate = updatedData.courseLinks.map((link, index) => ({
        id: index + 1,
        title: link.title || `Lesson ${index + 1}`,
        duration: '00:00',
        videoUrl: link.url || '',
        completed: false,
        description: `This is ${link.title || `lesson ${index + 1}`}.`,
      }));
    }

    const dataToUpdate: any = {
      ...updatedData,
      thumbnail: thumbnailUrl,
      updatedAt: serverTimestamp(),
    };

    if (lessonsUpdate) {
      dataToUpdate.lessons = lessonsUpdate;
      dataToUpdate.modules = lessonsUpdate.length;
    }

    // Protect critical fields from being overwritten
    delete dataToUpdate.CoordinatorId;
    delete dataToUpdate.createdAt;
    delete dataToUpdate.id;

    await updateDoc(courseDocRef, dataToUpdate);

    return { id: courseId, ...dataToUpdate };
  },

  // Enroll a Participant in a course
  enrollCourse: async (courseId: string, userId: string, courseData: CourseData) => {
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);

    if (!userSnapshot.exists()) {
      throw new Error('User does not exist');
    }

    const userData = userSnapshot.data();
    const registeredCourses = userData.registeredCourses || [];

    // Prevent duplicate enrollment
    const isAlreadyEnrolled = registeredCourses.some((c: any) =>
      c.id === courseId || c.courseId === courseId
    );

    if (isAlreadyEnrolled) {
      throw new Error('You are already enrolled in this course');
    }

    // Create a simplified course record for the user's profile
    const courseToAdd = {
      id: courseId,
      courseId: courseId,
      title: courseData.title,
      description: courseData.description,
      thumbnail: courseData.thumbnail,
      instructor: courseData.instructor,
      duration: courseData.duration,
      level: courseData.level || courseData.difficulty,
      price: courseData.price,
      certificate: courseData.certificate,
      enrolledAt: new Date(),
      progress: 0,
    };

    // Save to user + increment counter
    await updateDoc(userDocRef, {
      registeredCourses: arrayUnion(courseToAdd),
      coursesEnrolled: increment(1),
    });

    return courseToAdd;
  },

  // Get courses a user is enrolled in
  getEnrolledCourses: async (userId: string) => {
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);
    if (!userSnapshot.exists()) return [];
    const userData = userSnapshot.data();
    return userData.registeredCourses || [];
  },
};

// Manage practice exercises (quizzes, coding tasks, etc.)
export const ExercisesService = {
  // Coordinator uploads a new exercise
  uploadExercises: async (exercise: ExerciseData, userId: string) => {
    const userData = await UserService.getUserData(userId);

    if (!userData || userData.role !== 'Coordinator') {
      throw new Error('You do not have permission to upload exercises. You must be a Coordinator.');
    }

    if (!exercise.category || exercise.category.trim() === '') {
      throw new Error('Exercise category is required! Please select a category.');
    }

    // Save exercise to Firestore
    const [exerciseRef] = await Promise.all([
        addDoc(collection(db, 'exercises'), {
            title: exercise.title,
            category: exercise.category,
            difficulty: exercise.difficulty,
            duration: exercise.duration,
            points: exercise.points || 0,
            completed: exercise.completed || false,
            questions: exercise.questions || [],
            CoordinatorId: userId,
            CoordinatorName:
              userData.displayName ||
              `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
              'Coordinator',
            createdAt: serverTimestamp(),
            rating: 0,
            reviews: 0,
            ParticipantsCount: 0,
            progress: 0,
        }),
        // Also increment Coordinator's exercise count
        updateDoc(doc(db, 'users', userId), {
            exercisesCreated: increment(1)
        })
    ]);

    return { id: exerciseRef.id, ...exercise };
  },

  // Get all exercises (e.g., for exercise catalog)
  getAllExercises: async () => {
    try {
      const exercisesSnapshot = await getDocs(collection(db, 'exercises'));
      return exercisesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching exercises:', error);
      throw error;
    }
  },

  // Get exercises created by a specific Coordinator
  getExercisesByCoordinator: async (CoordinatorId: string) => {
    const q = query(collection(db, 'exercises'), where('CoordinatorId', '==', CoordinatorId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },
};