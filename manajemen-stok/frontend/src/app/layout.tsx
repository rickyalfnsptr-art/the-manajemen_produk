import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sistem Manajemen & Monitoring Stok WHFG - PT Menara Terus Makmur',
  description:
    'Sistem monitoring stok finished goods realtime per PT Customer, scanner kanban non-blocking, tracking aging, dan ambang batas Min/Max.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className="bg-slate-50 text-slate-900 min-h-screen antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
