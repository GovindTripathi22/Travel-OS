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
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
