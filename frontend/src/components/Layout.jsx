import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, FolderGit2, Settings, Moon, Sun, Github } from 'lucide-react';

export default function Layout() {
  const { t, theme, setTheme, lang, setLang, meta } = useApp();
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Always check if user has valid session by trying to access protected endpoint
        const checkRes = await fetch('/pm2/master/api/settings', { credentials: 'include' });
        setAuthenticated(checkRes.ok);
      } catch (err) {
        console.error('Auth check failed:', err);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, [navigate]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !authenticated) {
      navigate('/login');
    }
  }, [loading, authenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div style={{ color: 'var(--muted)' }}>{t('loading')}</div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      <header className="border-b px-6 py-3 flex items-center justify-between"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--accent)' }}>
            Pm2 Server
          </span>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2
              ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5'}`
            }>
              <LayoutDashboard size={15} /> {t('dashboard')}
            </NavLink>
            <NavLink to="/projects" className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2
              ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5'}`
            }>
              <FolderGit2 size={15} /> {t('projects')}
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2
              ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5'}`
            }>
              <Settings size={15} /> {t('settings')}
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <select value={lang} onChange={(e) => setLang(e.target.value)}
            className="text-sm px-2 py-1 rounded-md border outline-none cursor-pointer"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}>
            <option value="tr">TR</option>
            <option value="en">EN</option>
          </select>

          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-md transition-colors hover:bg-white/5"
            style={{ color: 'var(--muted)' }}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {meta?.githubUrl && (
            <a href={meta.githubUrl} target="_blank" rel="noreferrer"
              className="p-2 rounded-md transition-colors hover:bg-white/5"
              style={{ color: 'var(--muted)' }}>
              <Github size={16} />
            </a>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>

      <footer className="border-t px-6 py-3 text-center text-xs"
        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
        {meta?.footerText && <span>{meta.footerText}</span>}
        {meta?.githubUrl && (
          <a href={meta.githubUrl} target="_blank" rel="noreferrer"
            className="ml-2 hover:underline" style={{ color: 'var(--accent)' }}>
            GitHub
          </a>
        )}
      </footer>
    </div>
  );
}
