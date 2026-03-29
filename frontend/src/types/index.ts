export interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  merchantCategory: string;
  cardLast4: string;
  country: string;
  city: string;
  timestamp: string;
  riskScore: number;
  riskFactors: string[];
  status: 'approved' | 'flagged' | 'blocked';
  ipAddress: string;
  deviceFingerprint: string;
  isVpn: boolean;
  velocityCount: number; // transactions in last 1hr from same card
  anomalyType?: string;
  lat: number;
  lng: number;
}
