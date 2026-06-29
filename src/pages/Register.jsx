import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GoogleAuth from './GoogleAuth.jsx';
import './Auth.css';

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

      fetch(`${import.meta.env.VITE_API_URL}/register`, {
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



          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">or sign up with</div>

        <div className="auth-social-buttons" >
          <GoogleAuth onError={(msg) => setErrors(prev => ({ ...prev, submit: msg }))} />
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
