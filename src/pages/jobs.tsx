import { useState, useEffect, useMemo } from "react";
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, BookOpen, Briefcase, Users, Search, 
  Plus, Clock
} from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import {
  FaUser,
  FaBriefcase,
  FaBook,
  FaFileDownload,
  FaPencilAlt,
  FaSignOutAlt,
  FaMapMarkerAlt,
  FaLaptopCode,
  FaMoneyBillWave,
  FaSearch
} from 'react-icons/fa';
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
import { auth, db } from '../firebase/firebaseConfig';
import { UserService } from '../firebase/src/firebaseServices';
import "./jobs.css";

interface Job {
  id?: string;
  company: string;
  title: string;
  location: string;
  remote: string;
  salary: string;
  tech: string;
  type: string;
  posterId?: string;
  posterName?: string;
  timestamp?: any;
}

function Jobs() {
  // --- State ---
  const [activeMode, setActiveMode] = useState<'seek' | 'recruit'>('seek');
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState<any>(null);
  const [jobsData, setJobsData] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  // Search State
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    type: "",
    remote: "",
    tech: "",
    salary: ""
  });

  // Post Job State
  const [hireData, setHireData] = useState<Job>({
    company: "", title: "", location: "", remote: "", salary: "", tech: "", type: ""
  });

  const [applicantsCounts] = useState<Record<string, number>>({}); 

  // --- Effects ---
  useEffect(() => {
    if (user) {
      UserService.getUserData(user.uid).then(setUserData);
    }
  }, [user]);

  useEffect(() => {
    setIsLoading(true);
    const q = query(collection(db, 'jobs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setJobsData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Helpers ---
  const handleSignOut = () => { auth.signOut(); navigate("/signin"); };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please sign in to post.");
    try {
      await addDoc(collection(db, 'jobs'), {
        ...hireData,
        posterId: user.uid,
        posterName: userData?.displayName || 'Anonymous',
        timestamp: new Date(),
      });
      alert('Job posted successfully!');
      setHireData({ company: "", title: "", location: "", remote: "", salary: "", tech: "", type: "" });
      setActiveMode('seek'); // Auto switch to list to show the new job
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const data = await UserService.getUserData(user.uid);
        setUserData(data);
        // Sync stats whenever they visit home
        await UserService.updateUserStats(user.uid);
      }
    };
    fetchUserData();
  }, [user]);

  const displayName = userData?.firstName && userData?.lastName
    ? `${userData.firstName} ${userData.lastName}`
    : userData?.firstName || 'User';

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/signin");
  };
  // Missing handlers added here to fix errors
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleHireChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setHireData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    console.log("Searching...");
  };

  const filteredJobs = useMemo(() => {
    return jobsData.filter(job => {
      const matchSearch = !filters.search || 
        job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.company.toLowerCase().includes(filters.search.toLowerCase());
      const matchLoc = !filters.location || job.location.toLowerCase().includes(filters.location.toLowerCase());
      const matchType = !filters.type || job.type === filters.type;
      const matchRemote = !filters.remote || job.remote === filters.remote;
      const matchTech = !filters.tech || job.tech.toLowerCase().includes(filters.tech.toLowerCase());
      
      return matchSearch && matchLoc && matchType && matchRemote && matchTech;
    });
  }, [jobsData, filters]);

  return (
    <div>
    <div className="jobsbody">
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
                      <h4>Welcome, {displayName}!</h4>
                      <div className="role-badge">
                      </div>
                    </div>
                  </div>
    
                  <ul className="dropdown-stats">
                                     <li><FaUserTag />Role: <span>{userData?.role || 'Member'}</span></li>
                                     <li><FaTools /> Skills: <span>{userData?.skills?.length || 0}</span></li>
                                     <li><FaBriefcase /> Applied Jobs: <span>{userData?.appliedJobs || 0}</span></li>
                                     <li><FaPlusSquare /> Jobs Added: <span>{userData?.jobsPosted || 0}</span></li>
                                     <li><FaFileAlt /> Shared Notes: <span>{userData?.sharedNotes || 0}</span></li>
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
      <div className="page-container">
        
        <header className="hero-header">
          <h1 className="hero-title">
            {activeMode === 'seek' ? 'Discover Your Next ' : 'Find Your Perfect '}
            <span className="highlight-text">{activeMode === 'seek' ? 'Opportunity' : 'Candidate'}</span>
          </h1>
          <p className="hero-desc">
            {activeMode === 'seek' 
             ? "Browse thousands of job openings from top companies and startups. Take the next step in your career today."
             : "Post a job in minutes and connect with top-tier talent from our community of developers."}
          </p>
          
          {/* Mode Switcher */}
          <div className="mode-toggle">
            <button 
              className={`toggle-btn ${activeMode === 'seek' ? 'active' : ''}`}
              onClick={() => setActiveMode('seek')}
            >
              <Search size={18} /> Find Work
            </button>
            <button 
              className={`toggle-btn ${activeMode === 'recruit' ? 'active' : ''}`}
              onClick={() => setActiveMode('recruit')}
            >
              <Plus size={18} /> Post a Job
            </button>
          </div>
        </header>

        {/* 3. SEEK MODE */}
        {activeMode === 'seek' && (
          <>
            {/* Modern Search Bar */}
           <div className="filter-container">
          <h1 className="filter-title">Find Your Dream Job</h1>
          <p className="filter-paragraph">
            Browse <span>exciting job openings</span>, explore <span>new career paths</span>,
            and apply <span>instantly</span> with just a few clicks.
          </p>

          <div className="Filter-bar">
        
            <div className="filter-input">
              <FaMapMarkerAlt className="filter-icon" />
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={filters.location}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-input">
              <FaBriefcase className="filter-icon" />
              <select name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="">Job Type</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            <div className="filter-input">
              <FaLaptopCode className="filter-icon" />
              <input
                type="text"
                name="tech"
                placeholder="Tech Stack"
                value={filters.tech}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-input">
              <FaMoneyBillWave className="filter-icon" />
              <input
                type="text"
                name="salary"
                placeholder="Salary Range"
                value={filters.salary}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-input">
              <select name="remote" value={filters.remote} onChange={handleFilterChange}>
                <option value="">Remote or On-site</option>
                <option value="remote">Remote</option>
                <option value="on-site">On-site</option>
              </select>
            </div>
            <button className="filter-button" onClick={handleSearch}>
              <FaSearch /> Search
            </button>
          </div>

          <div className="filter-card">
            {filteredJobs.map((job, index) => (
              <div
                key={job.id}
                className={`job-card ${index === 0 ? "blue" : index === 1 ? "pink" : "yellow"}`}
              >
                <div className="job-header">
                  <span className="job-type">{job.company}</span>
                </div>
                <h3 className="job-title">{job.title}</h3>
                <p className="job-salary">{job.salary} / Yearly</p>
                <div className="job-footer">
                  <p><FaMapMarkerAlt /> {job.location}</p>
                  <p><FaBriefcase /> {job.tech}</p>
                  <p><FaMoneyBillWave /> {job.salary}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Link to={`/apply/${job.id}`} className="apply-button">Apply Now</Link>
                  {user && job.posterId === user.uid && (
                    <Link
                      to={`/applicants?jobId=${job.id}`}
                      title="View applicants"
                      style={{
                        padding: '8px 12px',
                        color: '#444242ff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        textDecoration: 'none'
                      }}
                    >
                      <Users size={16} />
                      Applicants
                      <span style={{ background: '#fff', color: '#000000', borderRadius: '999px', padding: '2px 8px', fontWeight: 700 }}>
                        {applicantsCounts[job.id || ''] || 0}
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {filteredJobs.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
                No jobs found matching your search.
              </div>
            )}
          </div>
          </div>
          </>
        )}
        
        {/* 4. RECRUIT MODE (Post Job) */}
        {activeMode === 'recruit' && (
          <div className="post-form-card">
            <div className="body-form">
          <h1 className="form-title-hire">Hire the Best Talent</h1>
          <p className="form-para-hire">Post a job and get candidates quickly.</p>
          <h2 className="hire-title">Enter Job Details</h2>
          <form className="hire-bar" onSubmit={handlePostJob}>
            <input
              type="text"
              name="company"
              placeholder="Company Name"
              value={hireData.company}
              onChange={handleHireChange}
              required
            />
            <input
              type="text"
              name="title"
              placeholder="Job Title"
              value={hireData.title}
              onChange={handleHireChange}
              required
            />
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={hireData.location}
              onChange={handleHireChange}
              required
            />
            <select
              name="type"
              value={hireData.type}
              onChange={handleHireChange}
              required
            >
              <option value="">Job Type</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
            </select>
            <input
              type="text"
              name="tech"
              placeholder="Tech Stack (e.g. React, Node.js)"
              value={hireData.tech}
              onChange={handleHireChange}
              required
            />
            <input
              type="text"
              name="salary"
              placeholder="Salary Offered"
              value={hireData.salary}
              onChange={handleHireChange}
              required
            />
            <select
              name="remote"
              value={hireData.remote}
              onChange={handleHireChange}
              required
            >
              <option value="">Remote or On-site</option>
              <option value="remote">Remote</option>
              <option value="on-site">On-site</option>
            </select>
            <button type="submit" className="hire-button">Post Job</button>
          </form>
        </div>
      </div>
        )}
      </div>
    </div>
  </div>
  );
}

export default Jobs;