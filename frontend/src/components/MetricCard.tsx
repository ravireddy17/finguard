'use client';
interface Props {
  label: string;
  value: string;
  icon: string;
  trend: string;
  color: 'blue' | 'yellow' | 'red' | 'green';
}

const colorMap = {
  blue: { accent: '#00b4ff', dim: 'rgba(0,180,255,0.1)', border: 'rgba(0,180,255,0.2)' },
  yellow: { accent: '#ffcc00', dim: 'rgba(255,204,0,0.1)', border: 'rgba(255,204,0,0.2)' },
  red: { accent: '#ff2d55', dim: 'rgba(255,45,85,0.1)', border: 'rgba(255,45,85,0.2)' },
  green: { accent: '#00e676', dim: 'rgba(0,230,118,0.1)', border: 'rgba(0,230,118,0.2)' },
};

export default function MetricCard({ label, value, icon, trend, color }: Props) {
  const c = colorMap[color];
  const isPositiveTrend = trend.startsWith('+');

  return (
    <div style={{
      border: `1px solid ${c.border}`,
      borderRadius: 8,
      background: `linear-gradient(135deg, ${c.dim} 0%, rgba(7,13,20,0.9) 100%)`,
      padding: '18px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 80, height: 80,
        background: `radial-gradient(circle at top right, ${c.dim} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 22, color: c.accent, filter: `drop-shadow(0 0 6px ${c.accent})` }}>{icon}</span>
        <span style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: 11,
          color: isPositiveTrend ? '#00e676' : '#ff2d55',
          background: isPositiveTrend ? 'rgba(0,230,118,0.1)' : 'rgba(255,45,85,0.1)',
          padding: '2px 8px', borderRadius: 3,
        }}>{trend}</span>
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: 36,
          color: '#fff',
          letterSpacing: 1,
          lineHeight: 1,
        }}>{value}</div>
        <div style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: 10,
          color: '#5a7a96',
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginTop: 6,
        }}>{label}</div>
      </div>
    </div>
  );
}
