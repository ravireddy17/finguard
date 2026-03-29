'use client';
import { Transaction } from '@/types';

interface Props {
  tx: Transaction;
  onClose: () => void;
}

export default function TransactionModal({ tx, onClose }: Props) {
  const scoreColor = tx.riskScore > 85 ? '#ff2d55' : tx.riskScore > 70 ? '#ffcc00' : '#00e676';
  const statusLabel = tx.riskScore > 85 ? 'AUTO-BLOCKED' : tx.riskScore > 70 ? 'FLAGGED FOR REVIEW' : 'APPROVED';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(2,5,9,0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fade-in 0.2s ease',
    }} onClick={onClose}>
      <div style={{
        background: '#070d14',
        border: `1px solid ${scoreColor}44`,
        borderRadius: 12,
        width: 560,
        maxWidth: '95vw',
        overflow: 'hidden',
        boxShadow: `0 0 60px ${scoreColor}22`,
        animation: 'slide-up 0.25s ease',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: `linear-gradient(135deg, ${scoreColor}0f 0%, transparent 100%)`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: '#fff', letterSpacing: 2 }}>
              {tx.merchant}
            </div>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: '#5a7a96', marginTop: 2 }}>
              {tx.id} · {new Date(tx.timestamp).toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 36, color: scoreColor }}>
              {tx.riskScore}
            </div>
            <div style={{
              fontFamily: 'Share Tech Mono, monospace', fontSize: 10,
              color: scoreColor, letterSpacing: 1.5,
              background: `${scoreColor}18`, padding: '3px 10px', borderRadius: 3,
              border: `1px solid ${scoreColor}44`,
            }}>{statusLabel}</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Section title="Transaction">
            <Row label="Amount" value={`$${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} highlight />
            <Row label="Category" value={tx.merchantCategory} />
            <Row label="Card" value={`****  ****  ****  ${tx.cardLast4}`} />
          </Section>

          <Section title="Location">
            <Row label="Country" value={tx.country} />
            <Row label="City" value={tx.city} />
            <Row label="VPN" value={tx.isVpn ? '⚠ Detected' : '✓ None'} danger={tx.isVpn} />
          </Section>

          <Section title="Device & Network">
            <Row label="IP Address" value={tx.ipAddress} mono />
            <Row label="Device ID" value={tx.deviceFingerprint} mono />
            <Row label="Velocity (1hr)" value={`${tx.velocityCount} transactions`} danger={tx.velocityCount > 7} />
          </Section>

          <Section title="Risk Analysis">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tx.riskFactors.map(f => (
                <div key={f} style={{
                  fontFamily: 'Share Tech Mono, monospace', fontSize: 10,
                  padding: '4px 10px', borderRadius: 3,
                  background: 'rgba(255,45,85,0.08)',
                  color: '#ff6680',
                  border: '1px solid rgba(255,45,85,0.15)',
                }}>⚡ {f}</div>
              ))}
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: 10, justifyContent: 'flex-end',
        }}>
          <button onClick={onClose} style={{
            fontFamily: 'Share Tech Mono, monospace', fontSize: 11, letterSpacing: 1,
            padding: '8px 20px', borderRadius: 5,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#c8dff0', cursor: 'pointer',
          }}>CLOSE</button>
          {tx.status !== 'blocked' && (
            <button style={{
              fontFamily: 'Share Tech Mono, monospace', fontSize: 11, letterSpacing: 1,
              padding: '8px 20px', borderRadius: 5,
              background: 'rgba(255,45,85,0.15)',
              border: '1px solid rgba(255,45,85,0.4)',
              color: '#ff2d55', cursor: 'pointer',
            }}>BLOCK TRANSACTION</button>
          )}
          {tx.status === 'flagged' && (
            <button style={{
              fontFamily: 'Share Tech Mono, monospace', fontSize: 11, letterSpacing: 1,
              padding: '8px 20px', borderRadius: 5,
              background: 'rgba(0,230,118,0.1)',
              border: '1px solid rgba(0,230,118,0.3)',
              color: '#00e676', cursor: 'pointer',
            }}>APPROVE</button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontFamily: 'Share Tech Mono, monospace', fontSize: 10,
        color: '#00b4ff', letterSpacing: 2, textTransform: 'uppercase',
        marginBottom: 10, paddingBottom: 6,
        borderBottom: '1px solid rgba(0,180,255,0.15)',
      }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{children}</div>
    </div>
  );
}

function Row({ label, value, highlight, danger, mono }: { label: string; value: string; highlight?: boolean; danger?: boolean; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, color: '#5a7a96' }}>{label}</span>
      <span style={{
        fontFamily: mono ? 'Share Tech Mono, monospace' : 'DM Sans, sans-serif',
        fontSize: highlight ? 14 : 12,
        fontWeight: highlight ? 600 : 400,
        color: danger ? '#ff2d55' : highlight ? '#fff' : '#c8dff0',
      }}>{value}</span>
    </div>
  );
}
