'use client';
import { Transaction } from '@/types';
import { useRef, useEffect } from 'react';

interface Props {
  transactions: Transaction[];
  onSelect: (tx: Transaction) => void;
}

const statusColor = {
  approved: '#00e676',
  flagged: '#ffcc00',
  blocked: '#ff2d55',
};
const statusBg = {
  approved: 'rgba(0,230,118,0.08)',
  flagged: 'rgba(255,204,0,0.08)',
  blocked: 'rgba(255,45,85,0.08)',
};

export default function TransactionFeed({ transactions, onSelect }: Props) {
  const newTxId = useRef<string | null>(null);

  useEffect(() => {
    if (transactions[0]) newTxId.current = transactions[0].id;
  }, [transactions]);

  return (
    <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr 90px 80px 70px 90px',
        padding: '6px 16px',
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: 10,
        color: '#5a7a96',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        borderBottom: '1px solid rgba(0,180,255,0.08)',
        marginBottom: 4,
      }}>
        <span>TXN ID</span>
        <span>MERCHANT</span>
        <span>AMOUNT</span>
        <span>COUNTRY</span>
        <span>RISK</span>
        <span>STATUS</span>
      </div>

      {transactions.map((tx, i) => (
        <div
          key={tx.id}
          onClick={() => onSelect(tx)}
          style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr 90px 80px 70px 90px',
            padding: '9px 16px',
            cursor: 'pointer',
            borderBottom: '1px solid rgba(0,180,255,0.05)',
            transition: 'background 0.15s',
            background: i === 0 ? 'rgba(0,180,255,0.04)' : 'transparent',
            animation: i === 0 ? 'row-flash 0.6s ease' : undefined,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,180,255,0.07)')}
          onMouseLeave={e => (e.currentTarget.style.background = i === 0 ? 'rgba(0,180,255,0.04)' : 'transparent')}
        >
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#00b4ff' }}>{tx.id}</span>
          <div>
            <span style={{ fontSize: 13, color: '#c8dff0', fontWeight: 500 }}>{tx.merchant}</span>
            <span style={{ fontSize: 10, color: '#5a7a96', marginLeft: 8 }}>{tx.merchantCategory}</span>
          </div>
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 12, color: '#fff', fontWeight: 500 }}>
            ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#5a7a96' }}>
            {tx.country} · {tx.cardLast4}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 36, height: 6, borderRadius: 3,
              background: `linear-gradient(to right, ${
                tx.riskScore > 85 ? '#ff2d55' : tx.riskScore > 70 ? '#ffcc00' : '#00e676'
              } ${tx.riskScore}%, rgba(255,255,255,0.06) ${tx.riskScore}%)`,
            }} />
            <span style={{
              fontFamily: 'Share Tech Mono, monospace', fontSize: 11,
              color: tx.riskScore > 85 ? '#ff2d55' : tx.riskScore > 70 ? '#ffcc00' : '#00e676',
            }}>{tx.riskScore}</span>
          </div>
          <span style={{
            fontFamily: 'Share Tech Mono, monospace', fontSize: 10,
            letterSpacing: 1, textTransform: 'uppercase',
            color: statusColor[tx.status],
            background: statusBg[tx.status],
            padding: '2px 8px', borderRadius: 3,
            border: `1px solid ${statusColor[tx.status]}33`,
            display: 'inline-block',
          }}>{tx.status}</span>
        </div>
      ))}

      <style>{`
        @keyframes row-flash {
          0% { background: rgba(0,180,255,0.15); }
          100% { background: rgba(0,180,255,0.04); }
        }
      `}</style>
    </div>
  );
}
