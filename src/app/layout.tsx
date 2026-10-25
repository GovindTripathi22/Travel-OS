import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sahyatri — AI Group Travel OS',
  description: 'Sahyatri: AI-native group travel operating system that eliminates planner burnout, synchronizes companions, and aligns groups under pressure.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
