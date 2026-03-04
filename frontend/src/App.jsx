import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Layout from './components/Layout';

function LoginPage() {
  const [passwordRequired, setPasswordRequired] = useState(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/pm2/master/auth/status', { credentials: 'include' });
        const data = await res.json();
        
        // If no password required, user shouldn't be on login page
        if (!data.passwordRequired) {
          window.location.href = '/';
        } else {
          setPasswordRequired(data.passwordRequired);
        }
      } catch (err) {
        console.error('Failed to check auth status:', err);
      }
    }
    checkStatus();
  }, []);

  if (passwordRequired === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div style={{ color: 'var(--muted)' }}>Loading...</div>
      </div>
    );
  }

  return <Login />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/logs/:name" element={<Logs />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
