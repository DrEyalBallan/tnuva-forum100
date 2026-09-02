import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'פורום 100 – מודל מנהיגות | תנובה',
  description: 'אפליקציית שיתוף תמונות ומשפטים לאירוע פורום 100 – מודל מנהיגות תנובה',
  icons: {
    icon: '/tnuva-logo.svg',
  },
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
