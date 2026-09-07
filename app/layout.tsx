import type { Metadata, Viewport } from 'next';
import './globals.css';
import { EVENT_CONFIG } from '@/lib/eventConfig';

export const metadata: Metadata = {
  title: `${EVENT_CONFIG.eventTitle} | ${EVENT_CONFIG.companyName}`,
  description: EVENT_CONFIG.eventSubtitle,
  icons: EVENT_CONFIG.logoUrl ? { icon: EVENT_CONFIG.logoUrl } : undefined,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
