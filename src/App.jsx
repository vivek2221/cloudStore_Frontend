import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
let Dashboard = lazy(()=>'./pages/Dashboard')
import Upgrade from './pages/Upgrade';

function App() {
  return (
    <BrowserRouter fallback={<div>loading...</div>}>
    <Suspense>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upgrade" element={<Upgrade />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
