import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Trash2 } from 'lucide-react';

export default function Logs() {
  const { name } = useParams();
  const { t } = useApp();
  const navigate = useNavigate();
  const [lines, setLines] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${location.host}/pm2/master/ws`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe_logs', name }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if ((msg.type === 'log') && msg.name === name) {
        setLines((prev) => [...prev.slice(-500), {
          text: msg.data,
          stream: msg.stream,
          time: new Date().toLocaleTimeString(),
        }]);
      }
    };

    return () => ws.close();
  }, [name]);

  // Yeni log gelince en alta scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  // Log stream'i baslat
  useEffect(() => {
    fetch(`/pm2/master/logs/${name}/stream/start`, {
      method: 'POST',
      credentials: 'include',
    }).catch(console.error);
  }, [name]);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
            style={{ color: 'var(--muted)' }}>
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-bold">{name} — {t('logs')}</h1>
        </div>
        <button onClick={() => setLines([])}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          <Trash2 size={13} /> Temizle
        </button>
      </div>

      <div className="flex-1 rounded-xl border overflow-y-auto p-4 font-mono text-xs leading-relaxed"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        {lines.length === 0 ? (
          <div style={{ color: 'var(--muted)' }}>Log bekleniyor...</div>
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
    </div>
  );
}
