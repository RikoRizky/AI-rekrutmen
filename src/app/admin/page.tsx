'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, initializeStorage } from '@/lib/storage';
import { Loader2 } from 'lucide-react';

export default function AdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    initializeStorage();
    const user = getCurrentUser();
    if (user?.role === 'super_admin') {
      router.replace('/super-admin');
    } else if (user?.role === 'company_admin') {
      router.replace('/company');
    } else {
      router.replace('/jobs');
    }
  }, [router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3 text-slate-400 text-xs">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      <p>Mengarahkan ke Dashboard Role Anda...</p>
    </div>
  );
}
