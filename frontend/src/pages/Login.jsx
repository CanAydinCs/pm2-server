import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    try {
      await axios.post('/pm2/master/auth/login', { password }, { withCredentials: true });
      navigate('/');
    } catch {
      setError('Hatali sifre');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <form onSubmit={handleLogin}
        className="w-full max-w-sm p-8 rounded-2xl border shadow-xl"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h1 className="text-xl font-bold mb-6 text-center" style={{ color: 'var(--accent)' }}>pm2-panel</h1>
        <input
          type="password"
          placeholder={t('password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border outline-none mb-3 text-sm"
          style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
        />
        {error && <p className="text-xs mb-3" style={{ color: 'var(--danger)' }}>{error}</p>}
        <button type="submit"
          className="w-full py-2.5 rounded-lg font-medium text-sm transition-colors"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          {t('login')}
        </button>
      </form>
    </div>
  );
}
