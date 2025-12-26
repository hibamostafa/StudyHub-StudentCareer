import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SignIn.css';
import { Mail, Lock } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

const illustrationUrl = 'https://i.pinimg.com/1200x/f0/a2/c4/f0a2c4b7b69ee1e6d3e92bb85a558b11.jpg';

function SignIn() {
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    const email = (form.email as HTMLInputElement).value;
    const password = (form.password as HTMLInputElement).value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Welcome to the website");
      navigate('/homepage');
    } catch (error: any) {
      
      let errorMessage = 'An unknown error occurred. Please try again.';
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check your input.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please register first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
      console.error('Sign-in error:', error);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="visual-panel">
        <div className="visual-content">
          <h1 className="visual-title">
            Unlock Your
            <br />
            Full Potential.
          </h1>
          <p className="visual-subtitle">
            Study smarter and find jobs faster with our AI-powered tools.
          </p>
          <img 
            src={illustrationUrl}
            className="auth-illustration" 
            alt="Person working on a laptop with abstract shapes"
          />
        </div>
      </div>

      <div className="form-container">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="form-title">Welcome Back!</h2>
          <p className="form-message">Sign in to continue to your account.</p>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-group">
              <Mail size={20} className="input-icon" />
              <input
                id="email"
                name="email"
                placeholder="you@example.com"
                type="email"
                className="input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-group">
              <Lock size={20} className="input-icon" />
              <input
                id="password"
                name="password"
                placeholder="••••••••"
                type="password"
                className="input"
                required
              />
            </div>
          </div>

          <button type="submit" className="submit-btn">Sign In</button>

          <p className="signin-link">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignIn;