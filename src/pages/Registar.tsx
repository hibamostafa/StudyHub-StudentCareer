import React, { useState } from 'react';
import './Registar.css';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ShieldCheck } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { AuthService } from '../firebase/src/firebaseServices';

function Registar() {
  const navigate = useNavigate();
  const [role, setRole] = useState<'Participant' | 'Coordinator'>('Participant');
  const [accessKey, setAccessKey] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);

  const COORDINATOR_SECRET_KEY = "2025"; 

  const completeAuth = (userData: any) => {
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.role === 'Coordinator') {
      navigate('/homepage');
    }
  };

  const handleGoogleSignUp = async () => {
    if (role === 'Coordinator' && accessKey !== COORDINATOR_SECRET_KEY) {
      alert("Invalid Access Key!");
      return;
    }

    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: role,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', user.uid), userData);
      completeAuth(userData);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    if (role === 'Coordinator' && accessKey !== COORDINATOR_SECRET_KEY) {
      alert("Invalid Access Key!");
      return;
    }

    setIsLoading(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const firstName = (form.elements.namedItem('firstName') as HTMLInputElement).value;
    const lastName = (form.elements.namedItem('lastName') as HTMLInputElement).value;

    try {
      const userResult = await AuthService.signUp(email, password, role, { firstName, lastName });

      // FIXED: Accessing uid directly from the returned user object
      const userData = {
        uid: userResult.uid, 
        email: email,
        role: role,
        displayName: `${firstName} ${lastName}`,
      };

      completeAuth(userData);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="info-panel">
        <div className="info-content">
          <h1 className="info-title">Study smarter.<br />Find jobs faster.</h1>
          <p className="info-subtitle">All in one place — join our community for free!</p>
          <img src="https://i.pinimg.com/1200x/f0/a2/c4/f0a2c4b7b69ee1e6d3e92bb85a558b11.jpg" className="auth-illustration" alt="Student" />
        </div>
      </div>

      <div className="form-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="form-title">Create Your Account</h2>
          
          <button type="button" className="google-btn" onClick={handleGoogleSignUp}>
            {/* FIXED: SVG attributes converted to camelCase */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign Up with Google
          </button>

          <div className="divider"><span>OR</span></div>

          <div className="name-flex">
            <div className="form-group">
              <User size={20} className="input-icon" />
              <input placeholder="First Name" type="text" className="input" name="firstName" required />
            </div>
            <div className="form-group">
              <User size={20} className="input-icon" />
              <input placeholder="Last Name" type="text" className="input" name="lastName" required />
            </div>
          </div>

          <div className="form-group">
            <Mail size={20} className="input-icon" />
            <input placeholder="Email" type="email" className="input" name="email" required />
          </div>

          <div className="form-group">
            <Lock size={20} className="input-icon" />
            <input placeholder="Password" type="password" className="input" name="password" required />
          </div>

          <div className="form-group user-type-group">
            <label className="user-type-label">I am registering as a:</label>
            <div className="radio-group">
              <label className="radio-option">
                <input type="radio" name="role" checked={role === 'Participant'} onChange={() => setRole('Participant')} />
                Participant
              </label>
              <label className="radio-option">
                <input type="radio" name="role" checked={role === 'Coordinator'} onChange={() => setRole('Coordinator')} />
                Coordinator
              </label>
            </div>
          </div>

          {role === 'Coordinator' && (
            <div className="form-group">
              <ShieldCheck size={20} className="input-icon" style={{ color: '#dc3545' }} />
              <input
                placeholder="Access Key"
                type="password"
                className="input"
                style={{ borderColor: '#dc3545' }}
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                required
              />
            </div>
          )}
          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Submit"}
          </button>

          <p className="signin-link">
            Already have an account? <Link to="/signin">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Registar;