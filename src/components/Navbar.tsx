'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Application } from '@/lib/types';
import { getCurrentUser, getAllApplications, REFRESH_EVENT } from '@/lib/storage';
import {
  Sparkles,
  Briefcase,
  PlusCircle,
  FileCheck,
  Settings,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Layers,
  Search
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myAppsCount, setMyAppsCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const updateUser = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
      if (user) {
        const apps = getAllApplications();
        const count = apps.filter((a) => a.userId === user.id).length;
        setMyAppsCount(count);
      }
    };

    updateUser();
    window.addEventListener(REFRESH_EVENT, updateUser);
    return () => window.removeEventListener(REFRESH_EVENT, updateUser);
  }, []);

  const isHrd = currentUser?.role === 'hrd';

  return (
    <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-[37px] z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  SmartRecruit <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">AI</span>
                </div>
                <div className="text-[10px] font-semibold text-slate-400 -mt-1 tracking-wider uppercase">
                  AI Screening & ATS
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/"
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
                  pathname === '/'
                    ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                Cari Lowongan
              </Link>

              {isHrd ? (
                <>
                  <Link
                    href="/admin"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 ${
                      pathname === '/admin' || pathname.startsWith('/admin/jobs/')
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Dashboard ATS HRD</span>
                  </Link>

                  <Link
                    href="/admin/jobs/create"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 ${
                      pathname === '/admin/jobs/create'
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Buka Lowongan Baru</span>
                  </Link>
                </>
              ) : (
                <Link
                  href="/user/applications"
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5 ${
                    pathname === '/user/applications'
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Lamaran Saya</span>
                  {myAppsCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                      {myAppsCount}
                    </span>
                  )}
                </Link>
              )}
            </nav>
          </div>

          {/* Right Action & User Profile */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/settings"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Pengaturan AI & Model"
            >
              <Settings className="w-5 h-5" />
            </Link>

            {/* User Profile Capsule */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                >
                  <img
                    src={currentUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-xl object-cover bg-indigo-100"
                  />
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {isHrd ? 'HRD / Recruiter' : 'Pelamar'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {isHrd ? '💼 Akun HRD / Rekruter' : '👤 Akun Pelamar'}
                      </span>
                    </div>

                    <div className="py-1 text-xs">
                      {isHrd ? (
                        <>
                          <Link
                            href="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <Layers className="w-4 h-4 text-indigo-500" />
                            <span>Dashboard ATS HRD</span>
                          </Link>
                          <Link
                            href="/admin/jobs/create"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <PlusCircle className="w-4 h-4 text-emerald-500" />
                            <span>Buka Lowongan Baru</span>
                          </Link>
                        </>
                      ) : (
                        <Link
                          href="/user/applications"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <FileCheck className="w-4 h-4 text-indigo-500" />
                          <span>Status Lamaran Saya</span>
                        </Link>
                      )}

                      <Link
                        href="/auth"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Ganti / Masuk Akun Lain</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
              >
                Masuk / Daftar
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
