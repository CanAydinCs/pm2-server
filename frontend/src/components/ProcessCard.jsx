import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Play, Square, RotateCcw, RefreshCw, Trash2, ScrollText } from 'lucide-react';
import { useState, Fragment } from 'react';

function Modal({ title, onClose, onConfirm, confirmText = 'Delete', children }) {
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
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm border transition-colors hover:bg-white/5"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'var(--danger)', color: '#fff' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function statusColor(status) {
  if (status === 'online') return 'var(--success)';
  if (status === 'stopped') return 'var(--muted)';
  return 'var(--danger)';
}

function formatMemory(bytes) {
  if (!bytes) return '0 MB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function formatUptime(ms) {
  if (!ms) return '-';
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return s + 's';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  return Math.floor(s / 3600) + 'h';
}

export default function ProcessCard({ process, onRefresh }) {
  const { t } = useApp();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  async function action(type) {
    try {
      if (type === 'delete') {
        setShowDeleteModal(true);
        return;
      }
      await axios.post(`/pm2/master/api/processes/${process.name}/${type}`, {}, { withCredentials: true });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  async function confirmDelete() {
    try {
      await axios.delete(`/pm2/master/api/processes/${process.name}`, { withCredentials: true });
      setShowDeleteModal(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Fragment>
      <div className="rounded-xl border p-4 flex flex-col gap-3 transition-all hover:shadow-md"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>

        {/* Baslik + durum */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: statusColor(process.status) }} />
            <span className="font-semibold text-sm">{process.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: statusColor(process.status) + '20', color: statusColor(process.status) }}>
              {t(process.status) || process.status}
            </span>
          </div>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>#{process.pm_id}</span>
        </div>

        {/* Metrikler */}
        <div className="grid grid-cols-4 gap-2 text-xs" style={{ color: 'var(--muted)' }}>
          <div>
            <div className="font-medium mb-0.5">{t('cpu')}</div>
            <div style={{ color: 'var(--fg)' }}>{process.cpu ?? 0}%</div>
          </div>
          <div>
            <div className="font-medium mb-0.5">{t('memory')}</div>
            <div style={{ color: 'var(--fg)' }}>{formatMemory(process.memory)}</div>
          </div>
          <div>
            <div className="font-medium mb-0.5">{t('uptime')}</div>
            <div style={{ color: 'var(--fg)' }}>{formatUptime(process.uptime)}</div>
          </div>
          <div>
            <div className="font-medium mb-0.5">{t('restarts')}</div>
            <div style={{ color: 'var(--fg)' }}>{process.restarts ?? 0}</div>
          </div>
        </div>

        {/* Aksiyonlar */}
        <div className="flex items-center gap-1 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => action('restart')} title={t('restart')}
            className="p-1.5 rounded-md hover:bg-white/5 transition-colors" style={{ color: 'var(--muted)' }}>
            <RotateCcw size={14} />
          </button>
          <button onClick={() => action('reload')} title={t('reload')}
            className="p-1.5 rounded-md hover:bg-white/5 transition-colors" style={{ color: 'var(--muted)' }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={() => action('stop')} title={t('stop')}
            className="p-1.5 rounded-md hover:bg-white/5 transition-colors" style={{ color: 'var(--warning)' }}>
            <Square size={14} />
          </button>
          <button onClick={() => action('delete')} title={t('delete')}
            className="p-1.5 rounded-md hover:bg-white/5 transition-colors" style={{ color: 'var(--danger)' }}>
            <Trash2 size={14} />
          </button>
          <button onClick={() => navigate(`/logs/${process.name}`)} title={t('logs')}
            className="p-1.5 rounded-md hover:bg-white/5 transition-colors ml-auto" style={{ color: 'var(--accent)' }}>
            <ScrollText size={14} />
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <Modal title={t('confirm_delete')} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDelete}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {t('confirm_delete')}
          </p>
        </Modal>
      )}
    </Fragment>
  );
}