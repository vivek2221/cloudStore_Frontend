import React from 'react';
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

function GoogleAuth({ onError }) {
  const navigate = useNavigate();

  const handleSuccess = (credentialResponse) => {
    fetch(`${import.meta.env.VITE_API_URL}/google-login`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ key: credentialResponse.credential }),
      credentials: 'include'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Google authentication failed');
        }
        return response.json();
      })
      .then((data) => {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('parentfolderId', data.folderId);
        localStorage.setItem('name', data.name);
        localStorage.setItem('email', data.email);
        if (data.mainPage === 'go') {
          navigate('/dashboard');
        }
      })
      .catch(err => {
        console.error('Google login error:', err);
        if (onError) {
          onError('Google authentication failed. Please make sure the backend is running and client ID is valid.');
        }
      });
  };

  return (
    <div className="google-auth-wrapper">
      <button type="button" className="custom-google-btn">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 48 48">
          <g>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.5 24c0-1.61-.15-3.16-.42-4.69H24v9.09h12.64c-.55 2.87-2.17 5.3-4.61 6.93l7.2 5.58C43.43 36.29 46.5 30.66 46.5 24z"></path>
            <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.2-5.58c-2.01 1.35-4.58 2.19-8.69 2.19-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </g>
        </svg>
        <span>Continue with Google</span>
      </button>
      <div className="google-invisible-overlay">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => {
            console.log('Login Failed');
            if (onError) {
              onError('Google Login Failed');
            }
          }}
          text="continue_with"
          width="384"
        />
      </div>
    </div>
  );
}

export default GoogleAuth;
