'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, Application } from '@/lib/types';
import { getCurrentUser, logoutUser, getAllApplications, getAllCompanies, getDefaultCompanyLogo, REFRESH_EVENT, initializeStorage } from '@/lib/storage';
import {
  Briefcase,
  PlusCircle,
  FileCheck,
  Shield,
  Building2,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Search,
  CreditCard,
  UserCheck,
  Settings2
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    initializeStorage();
    const load = () => {
      setCurrentUserState(getCurrentUser());
      setApplications(getAllApplications());
    };
    load();

    window.addEventListener(REFRESH_EVENT, load);
    return () => window.removeEventListener(REFRESH_EVENT, load);
  }, []);

  const getUserAvatar = () => {
    if (!currentUser) return '';
    if (currentUser.role === 'company_admin' && currentUser.companyId) {
      const companies = getAllCompanies();
      const comp = companies.find((c) => c.id === currentUser.companyId);
      if (comp && comp.logo && !comp.logo.includes('photo-1599305445671-ac291c95aaa9')) {
        return comp.logo;
      }
      return getDefaultCompanyLogo(currentUser.companyName || currentUser.name);
    }
    if (currentUser.avatar && !currentUser.avatar.includes('avataaars')) {
      return currentUser.avatar;
    }
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}&backgroundColor=059669,047857,0f172a&textColor=ffffff`;
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUserState(null);
    setMenuOpen(false);
    router.push('/auth');
  };

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isCompanyAdmin = currentUser?.role === 'company_admin';
  const isApplicant = currentUser?.role === 'applicant';
  const isGuest = !currentUser;

  // Count active applications
  const userApplicationsCount = currentUser ? applications.filter(a => a.userId === currentUser.id).length : 0;
  const companyApplicationsCount = currentUser && currentUser.companyId ? applications.filter(a => a.companyId === currentUser.companyId).length : 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link
              href={isSuperAdmin ? '/super-admin' : isCompanyAdmin ? '/company' : '/'}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-950/40 group-hover:scale-105 transition-transform">
                SR
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-white">SmartRecruit</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ATS SAAS
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 -mt-0.5">Multi-Tenant AI Recruitment</span>
              </div>
            </Link>

            {/* Navigation Links based STRICTLY on Role */}
            <nav className="hidden md:flex items-center gap-1">
              
              {/* 1. GUEST / BELUM LOGIN */}
              {isGuest && (
                <>
                  <Link
                    href="/jobs"
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      pathname.startsWith('/jobs')
                        ? 'bg-slate-800 text-emerald-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Cari Loker</span>
                  </Link>

                  <Link
                    href="/pricing"
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      pathname.startsWith('/pricing')
                        ? 'bg-slate-800 text-emerald-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Paket Langganan PT</span>
                  </Link>
                </>
              )}

              {/* 2. PELAMAR (HANYA: Cari Loker, Biodata & Profil, Lamaran Saya) */}
              {isApplicant && (
                <>
                  <Link
                    href="/jobs"
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      pathname === '/jobs' || pathname.startsWith('/jobs/')
                        ? 'bg-slate-800 text-emerald-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Cari Loker</span>
                  </Link>

                  <Link
                    href="/user/profile"
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      pathname.startsWith('/user/profile')
                        ? 'bg-slate-800 text-emerald-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Biodata & Profil</span>
                  </Link>

                  <Link
                    href="/user/applications"
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      pathname.startsWith('/user/applications')
                        ? 'bg-slate-800 text-emerald-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Lamaran Saya</span>
                    {userApplicationsCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        {userApplicationsCount}
                      </span>
                    )}
                  </Link>
                </>
              )}

              {/* 3. ADMIN PT / PERUSAHAAN (HANYA: Portal PT & Buka Loker Baru) */}
              {isCompanyAdmin && (
                <>
                  <Link
                    href="/company"
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      pathname === '/company'
                        ? 'bg-slate-800 text-emerald-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Portal PT</span>
                    {companyApplicationsCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                        {companyApplicationsCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/company/jobs/new"
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      pathname.startsWith('/company/jobs/new')
                        ? 'bg-slate-800 text-emerald-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Buka Loker Baru</span>
                  </Link>
                </>
              )}

              {/* 4. SUPER ADMIN (HANYA: Super Admin Panel) */}
              {isSuperAdmin && (
                <Link
                  href="/super-admin"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    pathname.startsWith('/super-admin')
                      ? 'bg-slate-800 text-amber-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Super Admin Panel</span>
                </Link>
              )}

            </nav>
          </div>

          {/* Right Action: User Menu or Login Buttons */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800 text-left transition-colors border border-slate-800"
                >
                  <img
                    src={getUserAvatar()}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-emerald-500/40 bg-slate-800"
                  />
                  <div className="hidden sm:flex flex-col">
                    <span className="text-xs font-semibold text-white leading-tight max-w-[130px] truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-emerald-400 leading-tight truncate">
                      {currentUser.role === 'super_admin' ? 'Super Admin' : currentUser.role === 'company_admin' ? (currentUser.companyName || 'Admin PT') : 'Pelamar'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="font-semibold text-white truncate">{currentUser.name}</p>
                      <p className="text-slate-400 truncate text-[11px]">{currentUser.email}</p>
                    </div>

                    {isSuperAdmin && (
                      <Link
                        href="/super-admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-amber-300 hover:bg-slate-800"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Super Admin Dashboard</span>
                      </Link>
                    )}

                    {isCompanyAdmin && (
                      <>
                        <Link
                          href="/company"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-emerald-300 hover:bg-slate-800"
                        >
                          <Building2 className="w-4 h-4" />
                          <span>Dashboard Perusahaan</span>
                        </Link>
                        <Link
                          href="/company"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-800"
                        >
                          <Settings2 className="w-4 h-4 text-emerald-400" />
                          <span>Edit Profil & Logo PT</span>
                        </Link>
                        <Link
                          href="/company/jobs/new"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-800"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>Buka Loker Baru</span>
                        </Link>
                      </>
                    )}

                    {isApplicant && (
                      <>
                        <Link
                          href="/user/profile"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-800"
                        >
                          <UserIcon className="w-4 h-4" />
                          <span>Biodata & Profil Saya</span>
                        </Link>
                        <Link
                          href="/user/applications"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-800"
                        >
                          <FileCheck className="w-4 h-4" />
                          <span>Lamaran Saya</span>
                        </Link>
                      </>
                    )}

                    <div className="border-t border-slate-800 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-rose-400 hover:bg-slate-800 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Keluar (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth"
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                >
                  Masuk Akun
                </Link>
                <Link
                  href="/pricing"
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Langganan PT
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
