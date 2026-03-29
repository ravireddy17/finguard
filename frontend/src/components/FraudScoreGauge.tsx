'use client';
import { useEffect, useState } from 'react';

interface Props { score: number; }

export default function FraudScoreGauge({ score }: Props) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const diff = score - displayScore;
    if (Math.abs(diff) < 1) return;
    const step = diff > 0 ? 1 : -1;
    const t = setTimeout(() => setDisplayScore(s => s + step), 20);
    return () => clearTimeout(t);
  }, [score, displayScore]);

  const radius = 80;
  const cx = 110;
  const cy = 110;
  const startAngle = -215;
  const endAngle = 35;
  const totalDeg = endAngle - startAngle;
  const pct = displayScore / 100;
  const sweepDeg = totalDeg * pct;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcX = (deg: number) => cx + radius * Math.cos(toRad(deg));
  const arcY = (deg: number) => cy + radius * Math.sin(toRad(deg));

  const describeArc = (start: number, sweep: number, r: number) => {
    const end = start + sweep;
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(end));
    const y2 = cy + r * Math.sin(toRad(end));
    const large = Math.abs(sweep) > 180 ? 1 : 0;
    const sweep_flag = sweep > 0 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} ${sweep_flag} ${x2} ${y2}`;
  };

  const scoreColor = displayScore > 85 ? '#ff2d55' : displayScore > 70 ? '#ffcc00' : displayScore > 40 ? '#00b4ff' : '#00e676';
  const label = displayScore > 85 ? 'CRITICAL' : displayScore > 70 ? 'HIGH RISK' : displayScore > 40 ? 'MODERATE' : 'NOMINAL';

  // Needle
  const needleAngle = startAngle + sweepDeg;
  const needleLen = 65;
  const nx = cx + needleLen * Math.cos(toRad(needleAngle));
  const ny = cy + needleLen * Math.sin(toRad(needleAngle));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0 8px' }}>
      <svg width={220} height={150} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00e676" />
            <stop offset="40%" stopColor="#00b4ff" />
            <stop offset="70%" stopColor="#ffcc00" />
            <stop offset="100%" stopColor="#ff2d55" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Track */}
        <path
          d={describeArc(startAngle, totalDeg, radius)}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} strokeLinecap="round"
        />

        {/* Colored arc */}
        {sweepDeg > 0 && (
          <path
            d={describeArc(startAngle, sweepDeg, radius)}
            fill="none" stroke="url(#arc-grad)" strokeWidth={14} strokeLinecap="round"
            filter="url(#glow)"
          />
        )}

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map(v => {
          const deg = startAngle + (v / 100) * totalDeg;
          const inner = 92, outer = 102;
          return (
            <line key={v}
              x1={cx + inner * Math.cos(toRad(deg))} y1={cy + inner * Math.sin(toRad(deg))}
              x2={cx + outer * Math.cos(toRad(deg))} y2={cy + outer * Math.sin(toRad(deg))}
              stroke="rgba(255,255,255,0.3)" strokeWidth={v % 50 === 0 ? 2 : 1}
            />
          );
        })}

        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny}
          stroke={scoreColor} strokeWidth={2.5} strokeLinecap="round"
          filter="url(#glow)"
        />
        <circle cx={cx} cy={cy} r={8} fill="#0c1622" stroke={scoreColor} strokeWidth={2} />

        {/* Score text */}
        <text x={cx} y={cy + 32} textAnchor="middle"
          fontFamily="Bebas Neue, sans-serif" fontSize={48} fill="#fff" letterSpacing={2}
        >{displayScore}</text>
        <text x={cx} y={cy + 52} textAnchor="middle"
          fontFamily="Share Tech Mono, monospace" fontSize={10} fill={scoreColor} letterSpacing={3}
        >{label}</text>

        {/* Labels */}
        <text x={arcX(startAngle) - 4} y={arcY(startAngle) + 4}
          fontFamily="Share Tech Mono, monospace" fontSize={9} fill="#5a7a96" textAnchor="middle">0</text>
        <text x={arcX(endAngle) + 4} y={arcY(endAngle) + 4}
          fontFamily="Share Tech Mono, monospace" fontSize={9} fill="#5a7a96" textAnchor="middle">100</text>
      </svg>

      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, color: '#5a7a96', letterSpacing: 2, marginTop: -4 }}>
        COMPOSITE RISK INDEX
      </div>
    </div>
  );
}
