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
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => {
        console.log('Login Failed');
        if (onError) {
          onError('Google Login Failed');
        }
      }}
      text="continue_with"
    />
  );
}

export default GoogleAuth;
