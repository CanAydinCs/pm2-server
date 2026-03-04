import { useEffect, useState } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { RefreshCw, Copy, Check, ExternalLink, Key, Trash2 } from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
            style={{ color: 'var(--muted)' }}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Settings() {
  const { t, theme, setTheme, lang, setLang } = useApp();
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  // SSH Key Yönetimi
  const [hasKey, setHasKey] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteFromSystem, setDeleteFromSystem] = useState(false);

  useEffect(() => {
    axios.get('/pm2/master/api/settings', { withCredentials: true })
      .then((res) => setConfig(res.data))
      .catch(console.error);

    fetchSSHKeyInfo();
  }, []);

  async function fetchSSHKeyInfo() {
    try {
      const [existsRes, keyRes] = await Promise.all([
        axios.get('/pm2/master/api/settings/ssh/key-exists', { withCredentials: true }),
        axios.get('/pm2/master/api/settings/ssh/public-key', { withCredentials: true }).catch(() => ({ data: null }))
      ]);
      setHasKey(existsRes.data.exists);
      if (keyRes.data?.publicKey) {
        setPublicKey(keyRes.data.publicKey);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function saveConfig() {
    setSaving(true);
    try {
      const res = await axios.patch('/pm2/master/api/settings', config, { withCredentials: true });
      setConfig(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handlePassword(e) {
    e.preventDefault();
    setPasswordMsg('');
    try {
      await axios.post('/pm2/master/auth/password', passwordForm, { withCredentials: true });
      setPasswordMsg('Sifre guncellendi');
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPasswordMsg(err.response?.data?.error || 'Hata olustu');
    }
  }

  async function removePassword() {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await axios.delete('/pm2/master/auth/password',
        { data: { currentPassword: passwordForm.currentPassword }, withCredentials: true }
      );
      setPasswordMsg('Sifre kaldirildi');
    } catch (err) {
      setPasswordMsg(err.response?.data?.error || 'Hata olustu');
    }
  }

  async function handleGenerateKey() {
    try {
      const res = await axios.post('/pm2/master/api/settings/ssh/generate-key', {}, { withCredentials: true });
      setPublicKey(res.data.publicKey);
      setHasKey(true);
      setShowKeyModal(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Key oluşturulamadı');
    }
  }

  async function handleCheckSSH() {
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await axios.post('/pm2/master/api/settings/ssh/recheck', {}, { withCredentials: true });
      setCheckResult(res.data);
    } catch (err) {
      setCheckResult({ 
        connected: false, 
        error: err.response?.data?.error || err.message || 'Connection failed'
      });
    } finally {
      setChecking(false);
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDeleteSSHKey() {
    try {
      await axios.delete('/pm2/master/api/settings/ssh/delete-key', {
        data: { deleteFromSystem },
        withCredentials: true
      });
      setHasKey(false);
      setPublicKey('');
      setCheckResult(null);
      setShowDeleteModal(false);
      setDeleteFromSystem(false);
    } catch (err) {
      alert(err.response?.data?.error || 'SSH key silinemedi');
    }
  }

  if (!config) return (
    <div className="flex items-center justify-center h-64" style={{ color: 'var(--muted)' }}>
      Yukleniyor...
    </div>
  );

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <h1 className="text-xl font-bold">{t('settings')}</h1>

      {/* GitHub SSH Key Yönetimi */}
      <section className="rounded-xl border p-5"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">{t('ssh_key_section_title')}</h2>
          <Key size={16} style={{ color: 'var(--muted)' }} />
        </div>

        <div className="flex flex-col gap-3">
          {!hasKey ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {t('no_ssh_key_desc')}
              </p>
              <button
                onClick={handleGenerateKey}
                className="flex items-center justify-center gap-1.5 text-xs px-4 py-2.5 rounded-lg transition-colors"
                style={{ background: 'var(--accent)', color: '#fff' }}>
                <Key size={13} /> {t('generate_ssh_key_btn')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--success)' }}>
                  {t('ssh_key_exists')}
                </span>
                <button
                  onClick={() => setShowKeyModal(true)}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                  {t('view_key_btn')}
                </button>
              </div>

              {/* SSH Bağlantı Testi */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleCheckSSH}
                  disabled={checking}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted)', opacity: checking ? 0.6 : 1 }}>
                  <RefreshCw size={12} className={checking ? 'animate-spin' : ''} />
                  {t('recheck_account')}
                </button>
              </div>

              {/* Test sonucu */}
              {checkResult && (
                <div className="text-xs px-3 py-2 rounded-lg"
                  style={{
                    background: checkResult.connected ? 'var(--success)' + '15' : 'var(--danger)' + '15',
                    color: checkResult.connected ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${checkResult.connected ? 'var(--success)' : 'var(--danger)'}30`
                  }}>
                  {checkResult.connected
                    ? t('connection_success', { username: checkResult.username })
                    : t('connection_failed', { error: checkResult.error || 'Unknown error' })}
                </div>
              )}

              <p className="text-xs font-mono mt-2" style={{ color: 'var(--muted)' }}>
                {t('clone_cmd_example')}: git clone git@github.com:kullanici/repo.git
              </p>

              {/* SSH Key Sil */}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5 mt-2"
                style={{ borderColor: 'var(--border)', color: 'var(--danger)' }}
                title={t('delete_ssh_key_btn')}>
                <Trash2 size={13} className="mr-1" /> {t('delete_ssh_key_btn')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Genel Ayarlar */}
      <section className="rounded-xl border p-5"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h2 className="font-semibold mb-4 text-sm">Genel</h2>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span style={{ color: 'var(--muted)' }}>{t('repo_dir')}</span>
            <input value={config.repoDir || ''}
              onChange={(e) => setConfig({ ...config, repoDir: e.target.value })}
              className="px-3 py-2 rounded-lg border outline-none text-sm"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span style={{ color: 'var(--muted)' }}>{t('theme')}</span>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}
              className="px-3 py-2 rounded-lg border outline-none text-sm cursor-pointer"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}>
              <option value="dark">{t('dark')}</option>
              <option value="light">{t('light')}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span style={{ color: 'var(--muted)' }}>{t('language')}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value)}
              className="px-3 py-2 rounded-lg border outline-none text-sm cursor-pointer"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}>
              <option value="tr">Turkce</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
      </section>

      <button onClick={saveConfig} disabled={saving}
        className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors self-start"
        style={{ background: 'var(--accent)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
        {saving ? t('save') + '...' : t('save')}
      </button>

      {/* Sifre Yonetimi */}
      <section className="rounded-xl border p-5"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h2 className="font-semibold mb-4 text-sm">{t('password')}</h2>
        <form onSubmit={handlePassword} className="flex flex-col gap-3">
          <input type="password" placeholder={t('current_password')}
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            className="px-3 py-2 rounded-lg border outline-none text-sm"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }} />
          <input type="password" placeholder={t('new_password')}
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            className="px-3 py-2 rounded-lg border outline-none text-sm"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }} />
          {passwordMsg && (
            <p className="text-xs" style={{ color: 'var(--accent)' }}>{passwordMsg}</p>
          )}
          <div className="flex gap-2">
            <button type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              {t('change_password')}
            </button>
            <button type="button" onClick={removePassword}
              className="px-4 py-2 rounded-lg text-sm border transition-colors hover:bg-white/5"
              style={{ borderColor: 'var(--border)', color: 'var(--danger)' }}>
              {t('remove_password')}
            </button>
          </div>
        </form>
      </section>

      {/* Public Key Modal */}
      {showKeyModal && (
        <Modal title={t('add_key_modal_title')} onClose={() => setShowKeyModal(false)}>
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {t('add_key_modal_desc')}
            </p>

            <div className="rounded-lg p-3 text-xs font-mono break-all"
              style={{ background: 'var(--bg)', color: 'var(--fg)', border: '1px solid var(--border)' }}>
              {publicKey}
            </div>

            <div className="flex gap-2">
              <button onClick={copyKey}
                className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: copied ? 'var(--success)' : 'var(--accent)', color: '#fff' }}>
                {copied ? <><Check size={14} /> {t('copied_btn')}</> : <><Copy size={14} /> {t('copy_key_btn')}</>}
              </button>
              <a href="https://github.com/settings/ssh/new" target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm border transition-colors hover:bg-white/5"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                <ExternalLink size={13} /> {t('go_to_github')}
              </a>
            </div>

            <button onClick={() => setShowKeyModal(false)}
              className="w-full py-2 rounded-lg text-sm border transition-colors hover:bg-white/5"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
              {t('close')}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete SSH Key Modal */}
      {showDeleteModal && (
        <Modal title={t('delete_ssh_key_title')} onClose={() => setShowDeleteModal(false)}>
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {t('delete_ssh_key_confirm')}
            </p>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteFromSystem}
                onChange={(e) => setDeleteFromSystem(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border"
                style={{ accentColor: 'var(--accent)', borderColor: 'var(--border)' }}
              />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{t('delete_from_system')}</span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{t('delete_from_system_desc')}</span>
              </div>
            </label>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 rounded-lg text-sm border transition-colors hover:bg-white/5"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDeleteSSHKey}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--danger)', color: '#fff' }}
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
