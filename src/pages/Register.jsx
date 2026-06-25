import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const validateForm = () => {
    const tempErrors = {};
    if (!name.trim()) {
      tempErrors.name = 'Full name is required';
    }
    if (!email) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Invalid email address';
    }
    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }
    if (!agreeTerms) {
      tempErrors.agreeTerms = 'You must agree to the Terms of Service';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      setSuccessMsg('');
      
      if (errors.submit) {
        const { submit, ...rest } = errors;
        setErrors(rest);
      }

      fetch('http://localhost:2000/register', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials:'include',
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Response data:', data);
        
        localStorage.setItem('name', data.name);
        localStorage.setItem('email', data.email);
        localStorage.setItem('accessToken',data.accessToken)
        localStorage.setItem('parentfolderId',data.folderId)
        setLoading(false);
         if(data.mainPage==='go'){
          navigate('/dashboard')
        }
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setLoading(false);
        setErrors(prev => ({
          ...prev,
          submit: 'Could not connect to the authentication server. Please make sure the backend is running.'
        }));
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-decor-1"></div>
      <div className="auth-decor-2"></div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <svg viewBox="0 0 24 24">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
            </svg>
          </div>
          <h1 className="auth-title">Get Started</h1>
          <p className="auth-subtitle">Get 2 GB of secure cloud storage free</p>
        </div>

        {successMsg && (
          <div className="auth-alert auth-alert-success">
            {successMsg}
          </div>
        )}

        {errors.submit && (
          <div className="auth-alert auth-alert-error">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label className="auth-label" htmlFor="name">Full Name</label>
            <div className="auth-input-wrapper">
              <input
                id="name"
                type="text"
                className="auth-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            {errors.name && <span className="auth-error-text">{errors.name}</span>}
          </div>

          <div className="auth-input-group">
            <label className="auth-label" htmlFor="email">Email Address</label>
            <div className="auth-input-wrapper">
              <input
                id="email"
                type="email"
                className="auth-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            {errors.email && <span className="auth-error-text">{errors.email}</span>}
          </div>

          <div className="auth-input-group">
            <label className="auth-label" htmlFor="password">Password</label>
            <div className="auth-input-wrapper">
              <input
                id="password"
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {errors.password && <span className="auth-error-text">{errors.password}</span>}
          </div>

          <div className="auth-input-group">
            <label className="auth-label" htmlFor="confirmPassword">Confirm Password</label>
            <div className="auth-input-wrapper">
              <input
                id="confirmPassword"
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {errors.confirmPassword && <span className="auth-error-text">{errors.confirmPassword}</span>}
          </div>

          <div className="auth-options">
            <label className="auth-remember-me">
              <input
                type="checkbox"
                className="auth-checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                disabled={loading}
              />
              I agree to the Terms of Service
            </label>
          </div>
          {errors.agreeTerms && <span className="auth-error-text" style={{ marginTop: '-12px' }}>{errors.agreeTerms}</span>}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">or sign up with</div>

        <div className="auth-social-buttons">
          <button type="button" className="auth-social-btn" disabled={loading}>
            {/* Google Icon SVG */}
            <svg viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 15.02 1 12 1 7.24 1 3.2 3.81 1.34 7.92l3.86 3C6.12 7.7 8.84 5.04 12 5.04z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.69 2.87c2.16-1.99 3.4-4.92 3.4-8.55z"/>
              <path fill="#FBBC05" d="M5.2 14.54c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18v-3L1.34 7.26C.49 8.97 0 10.89 0 12.91s.49 3.94 1.34 5.65l3.86-3.02z"/>
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.09 7.96-2.95l-3.69-2.87c-1.11.75-2.52 1.2-4.27 1.2-3.16 0-5.88-2.66-6.84-5.88l-3.86 3.02C3.2 20.19 7.24 23 12 23z"/>
            </svg>
            Google
          </button>
          <button type="button" className="auth-social-btn" disabled={loading}>
            {/* GitHub Icon SVG */}
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2A10 10 0 002 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
            </svg>
            GitHub
          </button>
        </div>

        <div className="auth-switch-type">
          Already have an account?
          <Link to="/" className="auth-switch-link">Log In</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
