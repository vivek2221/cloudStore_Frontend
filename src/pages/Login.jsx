import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GoogleAuth from './GoogleAuth.jsx';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(()=>{
    fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials:'include',
        body: JSON.stringify({
          email: email || '',
          password: password || '',
          accessToken:localStorage.getItem('accessToken') || null
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Invalid email or password');
        }
        return response.json();
      })
      .then(data => {
        setLoading(false);
        localStorage.setItem('accessToken',data.accessToken)
        localStorage.setItem('parentfolderId',data.folderId)
        localStorage.setItem('name', data.name)
        localStorage.setItem('email', data.email)
        if(data.mainPage=='go'){
          navigate('/dashboard')
        }
      })
      .catch(err => {
        console.error('Login fetch error:', err);
        setLoading(false);
      })
  },[])
  const validateForm = () => {
    const tempErrors = {};
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

      fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials:'include',
        body: JSON.stringify({
          email: email,
          password: password,
          accessToken:localStorage.getItem('accessToken') || null
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Invalid email or password');
        }
        return response.json();
      })
      .then(data => {
        setLoading(false);
        localStorage.setItem('accessToken',data.accessToken)
        localStorage.setItem('parentfolderId',data.folderId)
        localStorage.setItem('name', data.name)
        localStorage.setItem('email', data.email)
        if(data.mainPage=='go'){
          navigate('/dashboard')
        }
      })
      .catch(err => {
        console.error('Login fetch error:', err);
        setLoading(false);
        setErrors(prev => ({
          ...prev,
          submit: 'Invalid credentials or connection to authentication server failed.'
        }));
      });
    }
  };

  return (
    <div className="auth-container">
      {/* Decorative blurry backgrounds */}
      <div className="auth-decor-1"></div>
      <div className="auth-decor-2"></div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            {/* Modern Cloud Icon */}
            <svg viewBox="0 0 24 24">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
            </svg>
          </div>
          <h1 className="auth-title">cloudStore</h1>
          <p className="auth-subtitle">Secure cloud storage for your files</p>
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



          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">or continue with</div>

        <div className="auth-social-buttons" style={{ display: 'flex', justifyContent: 'center', width: '100%',backgroundColor:'transparent' }}>
          <GoogleAuth onError={(msg) => setErrors(prev => ({ ...prev, submit: msg }))} />
        </div>

        <div className="auth-switch-type">
          Don't have an account?
          <Link to="/register" className="auth-switch-link">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
