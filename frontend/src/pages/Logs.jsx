import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Download, Trash2 } from 'lucide-react';

export default function Logs() {
  const { name } = useParams();
  const { t } = useApp();
  const navigate = useNavigate();
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const bottomRef = useRef(null);

  // Fetch initial logs
  useEffect(() => {
    const fetchInitialLogs = async () => {
      try {
        const res = await fetch(`/pm2/master/api/logs/${name}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const text = await res.text();
        
        // Check if response is empty or only whitespace
        if (!text || !text.trim()) {
          console.warn('Empty response from logs endpoint');
          setLines([]);
          setError(null);
          setLoading(false);
          return;
        }
        
        // Try to parse JSON
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          console.error('Failed to parse logs response:', text);
          throw new Error('Invalid JSON response from server');
        }
        
        // Process initial logs
        const initialLines = [];
        
        // Add output logs
        if (data.outLogs && data.outLogs.length > 0) {
          data.outLogs.forEach(line => {
            initialLines.push({
              text: line,
              stream: 'out',
              time: new Date().toLocaleTimeString(),
            });
          });
        }
        
        // Add error logs
        if (data.errLogs && data.errLogs.length > 0) {
          data.errLogs.forEach(line => {
            initialLines.push({
              text: line,
              stream: 'err',
              time: new Date().toLocaleTimeString(),
            });
          });
        }
        
        setLines(initialLines);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching initial logs:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchInitialLogs();
  }, [name]);

  // WebSocket connection for real-time logs
  useEffect(() => {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${location.host}/pm2/master/ws`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe_logs', name }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'log' && msg.name === name) {
          setLoading(false);
          setError(null);
          setLines((prev) => [...prev.slice(-500), {
            text: msg.data,
            stream: msg.stream,
            time: new Date().toLocaleTimeString(),
          }]);
        }
      } catch (parseErr) {
        console.error('Failed to parse WebSocket message:', e.data, parseErr);
        // Ignore non-JSON messages
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection failed');
      setLoading(false);
    };

    return () => ws.close();
  }, [name]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  // Start log stream
  useEffect(() => {
    fetch(`/pm2/master/api/logs/${name}/stream/start`, {
      method: 'POST',
      credentials: 'include',
    }).catch(console.error);
  }, [name]);

  function handleClearLogs() {
    setLines([]);
    setShowClearModal(false);
  }

  function handleDownloadLogs() {
    // Format logs as text
    const logText = lines.map(line => {
      const streamIndicator = line.stream === 'err' ? '[ERROR]' : '[OUT]';
      return `${line.time} ${streamIndicator} ${line.text}`;
    }).join('\n');

    // Create blob and download
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]"
        style={{ color: 'var(--danger)' }}>
        <p className="text-lg mb-4">{error}</p>
        <button onClick={() => navigate('/')}
          className="text-sm px-4 py-2 rounded-lg border transition-colors hover:bg-white/5"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          {t('back_to_dashboard')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
            style={{ color: 'var(--muted)' }}
            title={t('back_to_dashboard')}>
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-bold">{name} — {t('logs')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadLogs}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
            style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}
            title={t('download_logs')}>
            <Download size={13} /> {t('download_logs')}
          </button>
          <button onClick={() => setShowClearModal(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            title={t('clear_logs')}>
            <Trash2 size={13} /> {t('clear_logs')}
          </button>
        </div>
      </div>

      <div className="flex-1 rounded-xl border overflow-y-auto p-4 font-mono text-xs leading-relaxed"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        {loading && lines.length === 0 ? (
          <div style={{ color: 'var(--muted)' }}>{t('logs_loading')}</div>
        ) : lines.length === 0 ? (
          <div style={{ color: 'var(--muted)' }}>{t('logs_empty')}</div>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="flex gap-3">
              <span style={{ color: 'var(--muted)', minWidth: '70px' }}>{line.time}</span>
              <span style={{ color: line.stream === 'err' ? 'var(--danger)' : 'var(--fg)' }}>
                {line.text}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Clear Logs Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold">{t('confirm_clear_logs')}</h3>
            </div>
            <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
              {t('confirm_clear_logs_desc')}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowClearModal(false)}
                className="flex-1 py-2 rounded-lg text-sm border transition-colors hover:bg-white/5"
                style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                {t('cancel')}
              </button>
              <button onClick={handleClearLogs}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--danger)', color: '#fff' }}>
                {t('clear_logs')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}