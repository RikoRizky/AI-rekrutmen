import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import DemoRoleSwitchBanner from '@/components/DemoRoleSwitchBanner';
import Navbar from '@/components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SmartRecruit AI - Platform Rekrutmen Cerdas Berbasis Analisis AI',
  description: 'Aplikasi rekrutmen generasi baru dengan analisis berkas cerdas, ekstraksi CV otomatis, dan perangkingan kandidat paling relevan secara instan.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
        <DemoRoleSwitchBanner />
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-8 px-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                SR
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-300">SmartRecruit AI</span>
              <span>— Platform Seleksi & ATS Berbasis Artificial Intelligence</span>
            </div>
            <div>
              Dibangun dengan Next.js App Router, Tailwind CSS, & Google Gemini AI Screening Engine.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
