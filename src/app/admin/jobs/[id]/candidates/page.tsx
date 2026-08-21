'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CandidatesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/company');
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      <p>Mengarahkan ke Dashboard Pelamar Perusahaan...</p>
    </div>
  );
}
