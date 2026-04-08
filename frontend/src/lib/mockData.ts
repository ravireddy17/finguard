import { Transaction } from '@/types';

const merchants = ['Amazon', 'Walmart', 'Apple Store', 'Shell Gas', 'Starbucks', 'Target', 'Netflix', 'Uber', 'DoorDash', 'Best Buy', 'Crypto Exchange', 'FX Trading', 'Casino Online', 'Wire Transfer', 'ATM Withdrawal', 'Luxury Goods', 'Airline Tickets', 'Hotel', 'CVS Pharmacy', 'Home Depot'];
const categories = ['E-Commerce', 'Retail', 'Electronics', 'Fuel', 'Food & Bev', 'Streaming', 'Transport', 'Crypto', 'Finance', 'ATM', 'Luxury', 'Travel', 'Pharmacy', 'Home'];
const countries = ['US', 'UK', 'DE', 'CN', 'RU', 'NG', 'BR', 'MX', 'AU', 'CA', 'IN', 'JP'];
const cities: Record<string, string[]> = {
  US: ['New York', 'Los Angeles', 'Chicago', 'Houston'], UK: ['London', 'Manchester'],
  DE: ['Berlin', 'Frankfurt'], CN: ['Shanghai', 'Beijing'], RU: ['Moscow'],
  NG: ['Lagos'], BR: ['São Paulo'], MX: ['Mexico City'], AU: ['Sydney'], CA: ['Toronto'], IN: ['Mumbai'], JP: ['Tokyo'],
};
const riskFactors = [
  'Unusual location', 'High velocity', 'VPN detected', 'Night-time transaction',
  'Unusual merchant', 'High amount', 'New device', 'Foreign currency', 'Rapid repeat',
  'Blacklisted IP', 'Cross-border', 'Category mismatch',
];
const geoCoords: Record<string, [number, number]> = {
  US: [37.0, -95.7], UK: [51.5, -0.12], DE: [52.5, 13.4], CN: [35.86, 104.2],
  RU: [55.75, 37.6], NG: [6.45, 3.4], BR: [-15.8, -47.9], MX: [19.4, -99.1],
  AU: [-33.9, 151.2], CA: [43.7, -79.4], IN: [19.1, 72.9], JP: [35.7, 139.7],
};

let counter = 1000;

export function generateMockTransaction(): Transaction {
  const country = countries[Math.floor(Math.random() * countries.length)];
  const cityList = cities[country] || ['Unknown'];
  const city = cityList[Math.floor(Math.random() * cityList.length)];
  const merchantIdx = Math.floor(Math.random() * merchants.length);
  const merchant = merchants[merchantIdx];
  const isHighRiskMerchant = ['Crypto Exchange', 'FX Trading', 'Casino Online', 'Wire Transfer'].includes(merchant);
  const isForeignCountry = !['US', 'CA', 'UK', 'AU'].includes(country);
  const amount = isHighRiskMerchant
    ? Math.random() * 9000 + 1000
    : Math.random() * 800 + 5;
  const velocityCount = Math.floor(Math.random() * 12);
  const isVpn = Math.random() < 0.15;
  const isNight = new Date().getHours() < 6 || new Date().getHours() > 22;
  
  let baseScore = 10;
  const factors: string[] = [];

  if (isHighRiskMerchant) { baseScore += 35; factors.push('High-risk merchant'); }
  if (isForeignCountry) { baseScore += 20; factors.push('Cross-border transaction'); }
  if (amount > 2000) { baseScore += 15; factors.push('High amount'); }
  if (velocityCount > 7) { baseScore += 20; factors.push('High velocity'); }
  if (isVpn) { baseScore += 15; factors.push('VPN detected'); }
  if (isNight) { baseScore += 8; factors.push('Unusual hours'); }
  if (Math.random() < 0.1) { baseScore += 10; factors.push('New device fingerprint'); }
  if (Math.random() < 0.05) { baseScore += 15; factors.push('Blacklisted IP range'); }
  
  baseScore = Math.min(99, baseScore + Math.floor(Math.random() * 10));

  const [lat, lng] = geoCoords[country] || [0, 0];
  const coord_jitter = () => (Math.random() - 0.5) * 8;

  const status = baseScore > 85 ? 'blocked' : baseScore > 70 ? 'flagged' : 'approved';
  
  return {
    id: `TXN-${++counter}`,
    amount: parseFloat(amount.toFixed(2)),
    merchant,
    merchantCategory: categories[merchantIdx % categories.length],
    cardLast4: String(Math.floor(Math.random() * 9000) + 1000),
    country,
    city,
    timestamp: new Date().toISOString(),
    riskScore: baseScore,
    riskFactors: factors.length > 0 ? factors : ['No significant risk factors'],
    status,
    ipAddress: `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
    deviceFingerprint: Math.random().toString(36).substring(2, 12).toUpperCase(),
    isVpn,
    velocityCount,
    anomalyType: baseScore > 70 ? factors[0] : undefined,
    lat: lat + coord_jitter(),
    lng: lng + coord_jitter(),
  };
}
