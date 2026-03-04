import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { Moon, Sun } from 'lucide-react';

export default function Login() {
  const { t, theme, setTheme, lang, setLang } = useApp();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);

  // Check if password is required on page load
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const res = await axios.get('/pm2/master/auth/status', { withCredentials: true });
        setPasswordRequired(res.data.passwordRequired);
      } catch (err) {
        console.error('Failed to check auth status:', err);
        setError(t('error_checking_status'));
      }
    }
    checkAuthStatus();
  }, [t]);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/pm2/master/auth/login', { password }, { withCredentials: true });
      
      if (res.data.success) {
        // Login successful
        navigate('/');
      }
    } catch (err) {
      setLoading(false);
      const errorMsg = err.response?.data?.error || t('login_failed');
      setError(errorMsg);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: 'var(--bg)' }}>
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <select value={lang} onChange={(e) => setLang(e.target.value)}
          className="text-sm px-2 py-1 rounded-md border outline-none cursor-pointer"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--fg)' }}>
          <option value="tr">TR</option>
          <option value="en">EN</option>
        </select>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-md transition-colors hover:bg-white/5"
          style={{ color: 'var(--muted)' }}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
      <form onSubmit={handleLogin}
        className="w-full max-w-sm p-8 rounded-2xl border shadow-xl"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h1 className="text-xl font-bold mb-6 text-center" style={{ color: 'var(--accent)' }}>pm2-panel</h1>
        
        <input
          type="password"
          placeholder={passwordRequired ? t('password') : t('leave_empty_to_continue')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border outline-none mb-3 text-sm"
          style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
          disabled={loading}
        />
        
        {error && <p className="text-xs mb-3" style={{ color: 'var(--danger)' }}>{error}</p>}
        
        <button 
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          {loading ? t('loading') : t('login')}
        </button>
        
        <p className="text-xs mt-4 text-center" style={{ color: 'var(--muted)' }}>
          {passwordRequired ? t('enter_password_to_continue') : t('no_password_set')}
        </p>
      </form>
    </div>
  );
}