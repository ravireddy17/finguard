'use client';
import { Transaction } from '@/types';

interface Props {
  alerts: Transaction[];
  onSelect: (tx: Transaction) => void;
}

export default function AlertPanel({ alerts, onSelect }: Props) {
  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      {alerts.map((tx, i) => (
        <div
          key={tx.id}
          onClick={() => onSelect(tx)}
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,45,85,0.08)',
            cursor: 'pointer',
            transition: 'background 0.15s',
            animation: i === 0 ? 'alert-in 0.4s ease' : undefined,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,45,85,0.07)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: tx.riskScore > 85 ? '#ff2d55' : '#ffcc00',
                boxShadow: `0 0 6px ${tx.riskScore > 85 ? '#ff2d55' : '#ffcc00'}`,
                flexShrink: 0,
                animation: 'pulse 1.5s ease infinite',
              }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: '#c8dff0' }}>{tx.merchant}</span>
            </div>
            <span style={{
              fontFamily: 'Share Tech Mono, monospace', fontSize: 12, fontWeight: 600,
              color: tx.riskScore > 85 ? '#ff2d55' : '#ffcc00',
            }}>RISK: {tx.riskScore}</span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            {tx.riskFactors.slice(0, 2).map(f => (
              <span key={f} style={{
                fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
                padding: '2px 7px', borderRadius: 3,
                background: 'rgba(255,45,85,0.1)',
                color: '#ff6680',
                border: '1px solid rgba(255,45,85,0.2)',
                letterSpacing: 0.5,
              }}>{f}</span>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, color: '#5a7a96' }}>
              {tx.id} · {tx.country} · ****{tx.cardLast4}
            </span>
            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#fff' }}>
              ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes alert-in {
          from { opacity: 0; transform: translateX(10px); background: rgba(255,45,85,0.12); }
          to { opacity: 1; transform: translateX(0); background: transparent; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}
