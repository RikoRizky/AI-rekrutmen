'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, User } from '@/lib/types';
import { registerOrLoginUser, setCurrentUser, getAllUsers, initializeStorage, getCurrentUser } from '@/lib/storage';
import Link from 'next/link';
import {
  Sparkles,
  UserCheck,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  User as UserIcon,
  Mail,
  Phone,
  CheckCircle2
} from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('applicant');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [headline, setHeadline] = useState('');

  const [demoUsers, setDemoUsers] = useState<User[]>([]);

  useEffect(() => {
    initializeStorage();
    setDemoUsers(getAllUsers());
  }, []);

  const handleDemoLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'hrd') {
      router.push('/admin');
    } else {
      router.push('/user/applications');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && mode === 'register') {
      alert('Harap isi nama Anda.');
      return;
    }
    if (!email.trim()) {
      alert('Harap isi email Anda.');
      return;
    }

    const userName = name.trim() || email.split('@')[0];
    const user = registerOrLoginUser(userName, email.trim(), role, phone.trim(), headline.trim());

    if (user.role === 'hrd') {
      router.push('/admin');
    } else {
      router.push('/user/applications');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            Masuk ke SmartRecruit AI
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pilih akun demo cepat atau daftar akun baru Anda.
          </p>
        </div>

        {/* Quick 1-Click Demo Accounts */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50/50 via-slate-50 to-purple-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Masuk Cepat Akun Demo (1-Klik):
            </span>
          </div>

          <div className="space-y-2">
            {demoUsers.slice(0, 3).map((u) => (
              <button
                key={u.id}
                onClick={() => handleDemoLogin(u)}
                className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-500 hover:shadow-xs transition text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                    alt={u.name}
                    className="w-8 h-8 rounded-xl object-cover bg-indigo-100"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition">
                      {u.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {u.role === 'hrd' ? '💼 Lead HRD Recruiter' : '👤 Pelamar Kerja'}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition" />
              </button>
            ))}
          </div>
        </div>

        {/* Custom Auth Form Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          
          {/* Tab Switcher */}
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-xl transition ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-xl transition ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Daftar Baru
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Role Radio */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Peran Pengguna
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('applicant')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    role === 'applicant'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Pelamar Kerja</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('hrd')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                    role === 'hrd'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Tim HRD / Admin</span>
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Riko Rizky"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  No HP / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>{mode === 'login' ? 'Masuk ke Aplikasi' : 'Daftar & Mulai'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

        </div>

      </div>
    </div>
  );
}
