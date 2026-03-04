import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Play, Square, RotateCcw, RefreshCw, Trash2, ScrollText } from 'lucide-react';

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

  async function action(type) {
    try {
      if (type === 'delete') {
        if (!window.confirm(t('confirm_delete'))) return;
        await axios.delete(`/pm2/master/api/processes/${process.name}`, { withCredentials: true });
      } else {
        await axios.post(`/pm2/master/api/processes/${process.name}/${type}`, {}, { withCredentials: true });
      }
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  return (
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
  );
}
