'use client';
import { useState, useEffect, useRef } from 'react';
import TransactionFeed from '@/components/TransactionFeed';
import FraudScoreGauge from '@/components/FraudScoreGauge';
import RiskHeatmap from '@/components/RiskHeatmap';
import AlertPanel from '@/components/AlertPanel';
import MetricCard from '@/components/MetricCard';
import TransactionModal from '@/components/TransactionModal';
import { Transaction } from '@/types';
import { generateMockTransaction } from '@/lib/mockData';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<Transaction[]>([]);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState({ total: 0, flagged: 0, blocked: 0, saved: 0 });
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Seed with initial data
    const initial = Array.from({ length: 20 }, () => generateMockTransaction());
    setTransactions(initial);
    const flagged = initial.filter(t => t.riskScore > 70);
    const blocked = initial.filter(t => t.riskScore > 85);
    setAlerts(flagged.slice(0, 5));
    setStats({
      total: initial.length,
      flagged: flagged.length,
      blocked: blocked.length,
      saved: blocked.reduce((sum, t) => sum + t.amount, 0),
    });

    // Try WebSocket connection
    try {
      const ws = new WebSocket('ws://localhost:8080/ws/transactions');
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onmessage = (e) => {
        const tx: Transaction = JSON.parse(e.data);
        handleNewTransaction(tx);
      };
      ws.onclose = () => {
        setConnected(false);
        startMockFeed();
      };
      ws.onerror = () => {
        ws.close();
        startMockFeed();
      };
    } catch {
      startMockFeed();
    }

    return () => wsRef.current?.close();
  }, []);

  const startMockFeed = () => {
    setConnected(true); // mock mode
    const interval = setInterval(() => {
      const tx = generateMockTransaction();
      handleNewTransaction(tx);
    }, 1800);
    return () => clearInterval(interval);
  };

  const handleNewTransaction = (tx: Transaction) => {
    setTransactions(prev => [tx, ...prev].slice(0, 100));
    setStats(prev => ({
      total: prev.total + 1,
      flagged: tx.riskScore > 70 ? prev.flagged + 1 : prev.flagged,
      blocked: tx.riskScore > 85 ? prev.blocked + 1 : prev.blocked,
      saved: tx.riskScore > 85 ? prev.saved + tx.amount : prev.saved,
    }));
    if (tx.riskScore > 70) {
      setAlerts(prev => [tx, ...prev].slice(0, 20));
    }
  };

  return (
    <div className="dashboard">
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">⬡</span>
            <span className="logo-text">FIN<span className="accent">GUARD</span></span>
          </div>
          <div className="tagline">Real-Time Fraud Intelligence</div>
        </div>
        <div className="header-center">
          <div className="ticker-wrap">
            <div className="ticker">
              {transactions.slice(0, 8).map(t => (
                <span key={t.id} className={`tick ${t.riskScore > 70 ? 'tick--danger' : 'tick--safe'}`}>
                  {t.merchant} · ${t.amount.toFixed(0)} · {t.riskScore > 85 ? '🔴' : t.riskScore > 70 ? '🟡' : '🟢'}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className={`connection-badge ${connected ? 'connected' : 'disconnected'}`}>
            <span className="pulse-dot" />
            {connected ? 'LIVE FEED' : 'OFFLINE'}
          </div>
          <div className="time-display">
            {new Date().toLocaleTimeString('en-US', { hour12: false })}
          </div>
        </div>
      </header>

      <main className="main-grid">
        <div className="metrics-row">
          <MetricCard label="Transactions Analyzed" value={stats.total.toLocaleString()} icon="◈" trend="+12%" color="blue" />
          <MetricCard label="Flagged Suspicious" value={stats.flagged.toLocaleString()} icon="◉" trend="+3%" color="yellow" />
          <MetricCard label="Auto-Blocked" value={stats.blocked.toLocaleString()} icon="⊗" trend="-8%" color="red" />
          <MetricCard label="Assets Protected" value={`$${(stats.saved / 1000).toFixed(1)}K`} icon="◆" trend="+21%" color="green" />
        </div>

        <div className="panels-row">
          <div className="panel panel--feed">
            <div className="panel-header">
              <span className="panel-title">Transaction Stream</span>
              <span className="panel-badge">{transactions.length} records</span>
            </div>
            <TransactionFeed transactions={transactions} onSelect={setSelected} />
          </div>

          <div className="panel-stack">
            <div className="panel panel--gauge">
              <div className="panel-header">
                <span className="panel-title">System Risk Index</span>
              </div>
              <FraudScoreGauge
                score={transactions.length > 0
                  ? Math.round(transactions.slice(0, 10).reduce((s, t) => s + t.riskScore, 0) / 10)
                  : 0}
              />
            </div>
            <div className="panel panel--heatmap">
              <div className="panel-header">
                <span className="panel-title">Geo Risk Heatmap</span>
              </div>
              <RiskHeatmap transactions={transactions.slice(0, 50)} />
            </div>
          </div>

          <div className="panel panel--alerts">
            <div className="panel-header">
              <span className="panel-title">⚡ Live Alerts</span>
              <span className="panel-badge danger">{alerts.length}</span>
            </div>
            <AlertPanel alerts={alerts} onSelect={setSelected} />
          </div>
        </div>
      </main>

      {selected && <TransactionModal tx={selected} onClose={() => setSelected(null)} />}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #020509;
          --bg2: #070d14;
          --bg3: #0c1622;
          --border: rgba(0,180,255,0.12);
          --border-bright: rgba(0,180,255,0.35);
          --blue: #00b4ff;
          --blue-dim: rgba(0,180,255,0.15);
          --red: #ff2d55;
          --red-dim: rgba(255,45,85,0.15);
          --yellow: #ffcc00;
          --yellow-dim: rgba(255,204,0,0.12);
          --green: #00e676;
          --green-dim: rgba(0,230,118,0.12);
          --text: #c8dff0;
          --text-dim: #5a7a96;
          --mono: 'Share Tech Mono', monospace;
          --display: 'Bebas Neue', sans-serif;
          --body: 'DM Sans', sans-serif;
        }

        html, body { background: var(--bg); color: var(--text); font-family: var(--body); overflow-x: hidden; }

        body::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(0,100,200,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255,45,85,0.04) 0%, transparent 60%);
        }

        .dashboard { min-height: 100vh; display: flex; flex-direction: column; position: relative; z-index: 1; }

        /* HEADER */
        .header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 28px; height: 60px;
          border-bottom: 1px solid var(--border);
          background: rgba(7,13,20,0.9);
          backdrop-filter: blur(12px);
          position: sticky; top: 0; z-index: 100;
        }
        .header-left { display: flex; align-items: center; gap: 20px; }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-icon { font-size: 22px; color: var(--blue); filter: drop-shadow(0 0 8px var(--blue)); }
        .logo-text { font-family: var(--display); font-size: 26px; letter-spacing: 3px; color: #fff; }
        .accent { color: var(--blue); }
        .tagline { font-family: var(--mono); font-size: 10px; color: var(--text-dim); letter-spacing: 2px; text-transform: uppercase; }

        .header-center { flex: 1; overflow: hidden; padding: 0 40px; }
        .ticker-wrap { overflow: hidden; border: 1px solid var(--border); border-radius: 4px; background: rgba(0,0,0,0.3); }
        .ticker { display: flex; gap: 0; animation: ticker-scroll 30s linear infinite; white-space: nowrap; }
        @keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .tick { font-family: var(--mono); font-size: 11px; padding: 4px 20px; border-right: 1px solid var(--border); }
        .tick--safe { color: var(--green); }
        .tick--danger { color: var(--red); }

        .header-right { display: flex; align-items: center; gap: 20px; }
        .connection-badge {
          display: flex; align-items: center; gap: 8px;
          font-family: var(--mono); font-size: 11px; letter-spacing: 1px;
          padding: 5px 12px; border-radius: 3px;
        }
        .connection-badge.connected { color: var(--green); border: 1px solid rgba(0,230,118,0.3); background: rgba(0,230,118,0.06); }
        .connection-badge.disconnected { color: var(--red); border: 1px solid rgba(255,45,85,0.3); }
        .pulse-dot {
          width: 7px; height: 7px; border-radius: 50%; background: currentColor;
          animation: pulse 1.5s ease infinite;
        }
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.7); } }
        .time-display { font-family: var(--mono); font-size: 13px; color: var(--text-dim); }

        /* MAIN GRID */
        .main-grid { flex: 1; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }

        .metrics-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }

        .panels-row { display: grid; grid-template-columns: 1fr 340px 320px; gap: 14px; flex: 1; min-height: 0; }

        .panel {
          border: 1px solid var(--border);
          border-radius: 8px;
          background: rgba(7,13,20,0.8);
          backdrop-filter: blur(8px);
          display: flex; flex-direction: column;
          overflow: hidden;
          position: relative;
        }
        .panel::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(135deg, rgba(0,180,255,0.03) 0%, transparent 50%);
          border-radius: 8px;
        }
        .panel-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid var(--border);
          background: rgba(0,0,0,0.2);
        }
        .panel-title { font-family: var(--mono); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--blue); }
        .panel-badge {
          font-family: var(--mono); font-size: 10px;
          padding: 2px 8px; border-radius: 3px;
          background: var(--blue-dim); color: var(--blue);
          border: 1px solid rgba(0,180,255,0.2);
        }
        .panel-badge.danger { background: var(--red-dim); color: var(--red); border-color: rgba(255,45,85,0.2); }

        .panel--feed { grid-row: 1; }
        .panel-stack { display: flex; flex-direction: column; gap: 14px; }
        .panel--gauge { flex: 0 0 auto; }
        .panel--heatmap { flex: 1; }
        .panel--alerts { overflow: hidden; }
      `}</style>
    </div>
  );
}
