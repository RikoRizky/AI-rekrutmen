import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SmartRecruit AI - Platform SaaS Rekrutmen & ATS Multi-Tenant Cerdas',
  description: 'Aplikasi rekrutmen SaaS multi-tenant dengan 3 role terintegrasi, pembayaran Midtrans, undangan email Resend, dan skrining berkas instan Gemini AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        
        {/* Modern Corporate Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-emerald-950/40">
                SR
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-white text-sm">SmartRecruit AI Enterprise ATS</span>
                <span className="text-[11px] text-slate-400">Platform Rekrutmen Cerdas Multi-Tenant (3 Roles)</span>
              </div>
            </div>

            <div className="text-slate-400 text-xs">
              Didukung oleh Next.js 15, Database MySQL (XAMPP / Prisma), Midtrans Snap, Resend, & Google Gemini AI.
            </div>

            <div className="text-[11px] text-slate-500">
              &copy; {new Date().getFullYear()} SmartRecruit. Hak Cipta Dilindungi.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
