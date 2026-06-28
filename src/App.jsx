import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
const Dashboard = lazy(()=>'./pages/Dashboard')
import Upgrade from './pages/Upgrade';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upgrade" element={<Upgrade />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
