import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, FolderGit2, Settings, Moon, Sun, Github, X, Menu } from 'lucide-react';

export default function Layout() {
  const { t, theme, setTheme, lang, setLang, meta } = useApp();
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      {/* Header */}
      <header className="border-b px-6 py-3 flex items-center justify-between sticky top-0 z-40"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--accent)' }}>
            Pm2 Server
          </span>
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2
              ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5'}` }
            >
              <LayoutDashboard size={15} /> {t('dashboard')}
            </NavLink>
            <NavLink to="/projects" className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2
              ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5'}` }
            >
              <FolderGit2 size={15} /> {t('projects')}
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2
              ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5'}` }
            >
              <Settings size={15} /> {t('settings')}
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <select value={lang} onChange={(e) => setLang(e.target.value)}
            className="text-sm px-2 py-1 rounded-md border outline-none cursor-pointer hidden md:block"
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
              className="p-2 rounded-md transition-colors hover:bg-white/5 hidden md:block"
              style={{ color: 'var(--muted)' }}>
              <Github size={16} />
            </a>
          )}

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md transition-colors hover:bg-white/5 md:hidden"
            style={{ color: 'var(--muted)' }}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-50 md:hidden"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="fixed top-0 right-0 h-full w-72 z-50 md:hidden flex flex-col shadow-2xl"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="border-b px-4 py-3 flex items-center justify-between"
              style={{ borderColor: 'var(--border)' }}>
              <span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>Menu</span>
              <button onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md hover:bg-white/5"
                style={{ color: 'var(--muted)' }}>
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 flex flex-col gap-1 p-4">
              <NavLink to="/" end className={({ isActive }) =>
                `px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3
                ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5'}` }
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard size={18} /> {t('dashboard')}
              </NavLink>
              <NavLink to="/projects" className={({ isActive }) =>
                `px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3
                ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5'}` }
                onClick={() => setMobileMenuOpen(false)}
              >
                <FolderGit2 size={18} /> {t('projects')}
              </NavLink>
              <NavLink to="/settings" className={({ isActive }) =>
                `px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3
                ${isActive ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-white/5'}` }
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings size={18} /> {t('settings')}
              </NavLink>

              <div className="border-t my-2" style={{ borderColor: 'var(--border)' }} />

              <div className="px-4 py-3 flex items-center gap-3">
                <span className="text-sm" style={{ color: 'var(--muted)' }}>Language</span>
                <select value={lang} onChange={(e) => setLang(e.target.value)}
                  className="flex-1 text-sm px-3 py-2 rounded-lg border outline-none cursor-pointer"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}>
                  <option value="tr">TR</option>
                  <option value="en">EN</option>
                </select>
              </div>

              {meta?.githubUrl && (
                <a href={meta.githubUrl} target="_blank" rel="noreferrer"
                  className="px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 hover:bg-white/5"
                  style={{ color: 'var(--muted)' }}>
                  <Github size={18} /> GitHub
                </a>
              )}
            </nav>
          </aside>
        </>
      )}

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
