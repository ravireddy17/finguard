'use client';
import { Transaction } from '@/types';
import { useMemo } from 'react';

interface Props { transactions: Transaction[]; }

// Simplified world regions mapped to grid cells
const REGIONS: { name: string; col: number; row: number; key: string }[] = [
  { name: 'USA', col: 1, row: 2, key: 'US' },
  { name: 'Canada', col: 1, row: 1, key: 'CA' },
  { name: 'Brazil', col: 2, row: 4, key: 'BR' },
  { name: 'Mexico', col: 1, row: 3, key: 'MX' },
  { name: 'UK', col: 3, row: 1, key: 'UK' },
  { name: 'Germany', col: 4, row: 1, key: 'DE' },
  { name: 'Russia', col: 5, row: 1, key: 'RU' },
  { name: 'Nigeria', col: 4, row: 4, key: 'NG' },
  { name: 'India', col: 6, row: 3, key: 'IN' },
  { name: 'China', col: 7, row: 2, key: 'CN' },
  { name: 'Japan', col: 8, row: 2, key: 'JP' },
  { name: 'Australia', col: 8, row: 4, key: 'AU' },
];

const COLS = 10, ROWS = 6;

export default function RiskHeatmap({ transactions }: Props) {
  const riskByCountry = useMemo(() => {
    const map: Record<string, { score: number; count: number }> = {};
    transactions.forEach(tx => {
      if (!map[tx.country]) map[tx.country] = { score: 0, count: 0 };
      map[tx.country].score += tx.riskScore;
      map[tx.country].count += 1;
    });
    return Object.fromEntries(
      Object.entries(map).map(([k, v]) => [k, v.score / v.count])
    );
  }, [transactions]);

  const cellW = 26, cellH = 22, gap = 3;

  const riskColor = (score: number) => {
    if (score > 75) return `rgba(255,45,85,${0.3 + (score - 75) / 100})`;
    if (score > 55) return `rgba(255,204,0,${0.2 + (score - 55) / 100})`;
    if (score > 0) return `rgba(0,180,255,${0.15 + score / 200})`;
    return 'rgba(255,255,255,0.03)';
  };

  const svgW = COLS * (cellW + gap);
  const svgH = ROWS * (cellH + gap);

  return (
    <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ flex: 1 }}>
        {/* Background grid */}
        {Array.from({ length: ROWS }).map((_, r) =>
          Array.from({ length: COLS }).map((_, c) => (
            <rect key={`${r}-${c}`}
              x={c * (cellW + gap)} y={r * (cellH + gap)}
              width={cellW} height={cellH}
              rx={3}
              fill="rgba(255,255,255,0.03)"
              stroke="rgba(0,180,255,0.05)" strokeWidth={1}
            />
          ))
        )}

        {/* Region cells */}
        {REGIONS.map(region => {
          const avgScore = riskByCountry[region.key] || 0;
          const x = (region.col - 1) * (cellW + gap);
          const y = (region.row - 1) * (cellH + gap);
          const color = riskColor(avgScore);
          return (
            <g key={region.key}>
              <rect x={x} y={y} width={cellW} height={cellH} rx={3} fill={color}
                stroke={avgScore > 55 ? 'rgba(255,204,0,0.3)' : 'rgba(0,180,255,0.15)'}
                strokeWidth={avgScore > 75 ? 1.5 : 1}
              />
              <text x={x + cellW / 2} y={y + cellH / 2 + 1}
                textAnchor="middle" dominantBaseline="middle"
                fontFamily="Share Tech Mono, monospace" fontSize={6}
                fill={avgScore > 55 ? '#fff' : 'rgba(200,223,240,0.7)'}
              >{region.key}</text>
              {avgScore > 0 && (
                <text x={x + cellW / 2} y={y + cellH - 4}
                  textAnchor="middle"
                  fontFamily="Share Tech Mono, monospace" fontSize={5}
                  fill={avgScore > 75 ? '#ff2d55' : avgScore > 55 ? '#ffcc00' : '#00b4ff'}
                >{Math.round(avgScore)}</text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {[
          { label: 'Low', color: 'rgba(0,180,255,0.4)' },
          { label: 'Med', color: 'rgba(255,204,0,0.5)' },
          { label: 'High', color: 'rgba(255,45,85,0.7)' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color }} />
            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: '#5a7a96' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
