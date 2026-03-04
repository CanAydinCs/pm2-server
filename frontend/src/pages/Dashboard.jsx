import { useEffect, useState } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import ProcessCard from '../components/ProcessCard';

export default function Dashboard() {
  const { t } = useApp();
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchProcesses() {
    try {
      const res = await axios.get('/pm2/master/api/processes', { withCredentials: true });
      setProcesses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{t('dashboard')}</h1>
        <button onClick={fetchProcesses}
          className="text-sm px-3 py-1.5 rounded-md border transition-colors hover:bg-white/5"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          {t('reload')}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48" style={{ color: 'var(--muted)' }}>
          Yukleniyor...
        </div>
      ) : processes.length === 0 ? (
        <div className="text-center py-16 rounded-xl border"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          {t('no_processes')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processes.map((p) => (
            <ProcessCard key={p.pm_id} process={p} onRefresh={fetchProcesses} />
          ))}
        </div>
      )}
    </div>
  );
}
