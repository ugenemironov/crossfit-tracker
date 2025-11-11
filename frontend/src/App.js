import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Movements from './components/Movements';
import MovementDetail from './components/MovementDetail';
import AddPR from './components/AddPR';
import WODs from './components/WODs';
import WODDetail from './components/WODDetail';
import AddWODResult from './components/AddWODResult';
import Profile from './components/Profile';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем есть ли сохранённый токен
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleOnboardingComplete = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Если не залогинен — показываем Login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Если нужен онбординг
  if (user.needs_onboarding || user.name === 'New User') {
    return <Onboarding user={user} onComplete={handleOnboardingComplete} />;
  }

  // Основное приложение
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">🏋️ CrossFit Tracker</div>
          <div className="nav-links">
            <a href="/">Home</a>
            <a href="/movements">Movements</a>
            <a href="/wods">WODs</a>
            <a href="/profile">Profile</a>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/movements" element={<Movements />} />
          <Route path="/movements/:id" element={<MovementDetail user={user} />} />
          <Route path="/movements/:id/add-pr" element={<AddPR user={user} />} />
          <Route path="/wods" element={<WODs />} />
          <Route path="/wods/:id" element={<WODDetail user={user} />} />
          <Route path="/wods/:id/add-result" element={<AddWODResult user={user} />} />
          <Route path="/profile" element={<Profile user={user} onUpdate={setUser} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;