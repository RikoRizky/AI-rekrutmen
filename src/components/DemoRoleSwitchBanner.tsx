'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole } from '@/lib/types';
import { getCurrentUser, setCurrentUser, getAllUsers, initializeStorage, REFRESH_EVENT } from '@/lib/storage';
import { Shield, Building2, User as UserIcon, Check } from 'lucide-react';

export default function DemoRoleSwitchBanner() {
  const router = useRouter();
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    initializeStorage();
    const load = () => {
      setCurrentUserState(getCurrentUser());
      setAllUsers(getAllUsers());
    };
    load();

    window.addEventListener(REFRESH_EVENT, load);
    return () => window.removeEventListener(REFRESH_EVENT, load);
  }, []);

  const handleSwitch = (user: User) => {
    setCurrentUser(user);
    
    // Auto redirect to relevant home based on role
    if (user.role === 'super_admin') {
      router.push('/super-admin');
    } else if (user.role === 'company_admin') {
      router.push('/company');
    } else {
      router.push('/jobs');
    }
  };

  if (!currentUser) return null;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return {
          label: 'Super Admin (Pengelola)',
          icon: Shield,
          badgeStyle: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
          dot: 'bg-amber-400'
        };
      case 'company_admin':
        return {
          label: 'Admin PT / Perusahaan',
          icon: Building2,
          badgeStyle: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
          dot: 'bg-emerald-400'
        };
      case 'applicant':
      default:
        return {
          label: 'User / Pelamar Kerja',
          icon: UserIcon,
          badgeStyle: 'bg-slate-800 border-slate-700 text-slate-200',
          dot: 'bg-emerald-500'
        };
    }
  };

  const currentRoleCfg = getRoleBadge(currentUser.role);
  const Icon = currentRoleCfg.icon;

  const getUserShortLabel = (u: User) => {
    if (u.role === 'super_admin') return '👑 Super Admin';
    if (u.role === 'company_admin') {
      if (u.companyName?.includes('Astra')) return '🏢 PT Astra (HRD)';
      if (u.companyName?.includes('Mandiri')) return '🏢 PT Mandiri (HRD)';
      return `🏢 ${u.companyName?.split(' ')[1] || 'PT'} (HRD)`;
    }
    if (u.name.includes('Budi')) return '👤 Budi (Pelamar)';
    if (u.name.includes('Siti')) return '👤 Siti (Pelamar)';
    return `👤 ${u.name.split(' ')[0]} (Pelamar)`;
  };

  return (
    <div className="bg-slate-950 border-b border-slate-800 text-slate-300 text-xs py-2 px-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Active Role Indicator */}
        <div className="flex items-center gap-2.5">
          <span className="text-slate-400 hidden sm:inline font-medium text-[11px]">Mode Aktif:</span>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${currentRoleCfg.badgeStyle}`}>
            <span className={`w-2 h-2 rounded-full ${currentRoleCfg.dot} animate-pulse`} />
            <Icon className="w-3.5 h-3.5" />
            <span>{currentRoleCfg.label}</span>
          </div>
          <span className="text-slate-400 hidden md:inline text-[11px]">
            ({currentUser.name} {currentUser.companyName ? `• ${currentUser.companyName}` : ''})
          </span>
        </div>

        {/* 3 Role Quick Switcher Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 mr-1 hidden lg:inline font-medium">Ganti Role Demo:</span>

          {allUsers.map((u) => {
            const isCurrent = u.id === currentUser.id;

            return (
              <button
                key={u.id}
                onClick={() => handleSwitch(u)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  isCurrent
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400/40'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
                title={`Login cepat sebagai ${u.name} (${u.role})`}
              >
                <span>{getUserShortLabel(u)}</span>
                {isCurrent && <Check className="w-3 h-3 text-emerald-200" />}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
