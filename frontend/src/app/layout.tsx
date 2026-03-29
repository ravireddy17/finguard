import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FinGuard — Real-Time Fraud Intelligence',
  description: 'ML-powered fraud detection platform with live transaction monitoring',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
