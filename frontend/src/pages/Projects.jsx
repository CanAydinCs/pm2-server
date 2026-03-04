import { useEffect, useState } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { FolderGit2, Plus, RefreshCw, Trash2, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Projects() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [folderName, setFolderName] = useState('');
  const [cloning, setCloning] = useState(false);
  const [cloneError, setCloneError] = useState('');
  const [deployLog, setDeployLog] = useState({});

  async function fetchRepos() {
    try {
      const res = await axios.get('/pm2/master/api/repos', { withCredentials: true });
      setRepos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRepos();
  }, []);

  // WebSocket deploy logu dinle
  useEffect(() => {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${location.host}/pm2/master/ws`);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'deploy') {
        setDeployLog((prev) => ({
          ...prev,
          [msg.data.repo]: [...(prev[msg.data.repo] || []), msg.data.message],
        }));
      }
    };
    return () => ws.close();
  }, []);

  async function handleClone(e) {
    e.preventDefault();
    setCloning(true);
    setCloneError('');
    try {
      await axios.post('/pm2/master/api/repos/clone',
        { repoUrl, name: folderName || undefined },
        { withCredentials: true }
      );
      setRepoUrl('');
      setFolderName('');
      setShowAdd(false);
      fetchRepos();
    } catch (err) {
      setCloneError(err.response?.data?.error || 'Hata olustu');
    } finally {
      setCloning(false);
    }
  }

  async function handleDeploy(name) {
    setDeployLog((prev) => ({ ...prev, [name]: [] }));
    try {
      await axios.post(`/pm2/master/api/repos/${name}/deploy`, {}, { withCredentials: true });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(name) {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await axios.delete(`/pm2/master/api/repos/${name}`, { withCredentials: true });
      fetchRepos();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64" style={{ color: 'var(--muted)' }}>
      Yukleniyor...
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{t('projects')}</h1>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition-colors"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          <Plus size={15} /> {t('add_project')}
        </button>
      </div>

      {/* Yeni repo ekleme formu */}
      {showAdd && (
        <form onSubmit={handleClone}
          className="mb-6 p-5 rounded-xl border"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <h2 className="font-semibold mb-4 text-sm">{t('add_project')}</h2>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder={`${t('repo_url')} — git@github.com:kullanici/proje.git`}
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              required
              className="px-4 py-2.5 rounded-lg border outline-none text-sm"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
            />
            <input
              type="text"
              placeholder={`${t('folder_name')} (${t('optional')})`}
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="px-4 py-2.5 rounded-lg border outline-none text-sm"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--fg)' }}
            />
            {cloneError && (
              <p className="text-xs" style={{ color: 'var(--danger)' }}>{cloneError}</p>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={cloning}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--accent)', color: '#fff', opacity: cloning ? 0.6 : 1 }}>
                {cloning ? t('clone') + '...' : t('clone')}
              </button>
              <button type="button" onClick={() => setShowAdd(false)}
                className="px-4 py-2 rounded-lg text-sm border transition-colors hover:bg-white/5"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                {t('cancel')}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Repo listesi */}
      {repos.length === 0 ? (
        <div className="text-center py-16 rounded-xl border"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          {t('no_projects')}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {repos.map((repo) => (
            <div key={repo.name}
              className="rounded-xl border p-5"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderGit2 size={16} style={{ color: 'var(--accent)' }} />
                  <span className="font-semibold text-sm">{repo.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: repo.hasEcosystem ? 'var(--success)' + '20' : 'var(--muted)' + '20',
                      color: repo.hasEcosystem ? 'var(--success)' : 'var(--muted)'
                    }}>
                    {repo.hasEcosystem ? t('ecosystem_found') : t('ecosystem_not_found')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleDeploy(repo.name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: 'var(--accent)', color: '#fff' }}>
                    <Rocket size={12} /> {t('deploy')}
                  </button>
                  <button onClick={() => handleDelete(repo.name)}
                    className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
                    style={{ color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>{repo.path}</p>

              {/* Deploy log */}
              {deployLog[repo.name] && deployLog[repo.name].length > 0 && (
                <div className="rounded-lg p-3 text-xs font-mono space-y-1 max-h-48 overflow-y-auto"
                  style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
                  {deployLog[repo.name].map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
