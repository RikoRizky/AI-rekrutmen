'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { getCurrentUser, switchDemoRole, resetDataToSeed, REFRESH_EVENT } from '@/lib/storage';
import { Sparkles, UserCheck, Briefcase, RefreshCw, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';

export default function DemoRoleSwitchBanner() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());

    const handleRefresh = () => {
      setCurrentUser(getCurrentUser());
    };

    window.addEventListener(REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(REFRESH_EVENT, handleRefresh);
  }, []);

  if (!currentUser) return null;

  const isHrd = currentUser.role === 'hrd';

  const handleToggle = () => {
    switchDemoRole(isHrd ? 'applicant' : 'hrd');
  };

  const handleReset = () => {
    if (confirm('Reset ulang data demo (lowongan & kandidat awal)?')) {
      resetDataToSeed();
    }
  };

  return (
    <div className="bg-slate-900 text-slate-200 border-b border-slate-800 text-xs py-2 px-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400">Mode Aktif:</span>
          <span className="font-bold text-white flex items-center gap-1.5">
            {isHrd ? (
              <>
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" /> HRD / Rekruter ({currentUser.name})
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Pelamar / Job Seeker ({currentUser.name})
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition active:scale-95 shadow-xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>
              {isHrd ? 'Ganti ke Mode Pelamar (Coba Lamar & Upload CV)' : 'Ganti ke Mode HRD (Lihat Dashboard & Ranking AI)'}
            </span>
          </button>

          {isHrd ? (
            <Link
              href="/admin"
              className="text-slate-300 hover:text-white underline text-[11px]"
            >
              Buka ATS Admin
            </Link>
          ) : (
            <Link
              href="/user/applications"
              className="text-slate-300 hover:text-white underline text-[11px]"
            >
              Lamaran Saya
            </Link>
          )}

          <button
            onClick={handleReset}
            title="Reset Data Demo"
            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
