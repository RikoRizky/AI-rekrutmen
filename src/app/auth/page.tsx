'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserRole } from '@/lib/types';
import { registerOrLoginUser, getAllUsers, initializeStorage, loginUserAsync, registerUserAsync, loginWithGoogleAsync } from '@/lib/storage';
import Link from 'next/link';
import {
  Building2,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
  CheckCircle2,
  Globe,
  Loader2,
  ArrowLeft,
  Home
} from 'lucide-react';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl');

  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [headline, setHeadline] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google OAuth custom modal state (when client ID not configured)
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleName, setGoogleName] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  const redirectAfterAuth = (user: any) => {
    if (user.role === 'applicant' && !user.profileCompleted) {
      router.push('/user/profile');
    } else if (callbackUrl && callbackUrl.startsWith('/')) {
      router.push(callbackUrl);
    } else if (user.role === 'super_admin') {
      router.push('/super-admin');
    } else if (user.role === 'company_admin') {
      router.push('/company');
    } else {
      router.push('/jobs');
    }
  };

  useEffect(() => {
    initializeStorage();

    // Check if redirected from Google OAuth 2.0 with access token in URL hash
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=')) {
        setIsLoadingGoogle(true);
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        
        if (accessToken) {
          fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
            .then((res) => res.json())
            .then(async (googleUser) => {
              if (googleUser && googleUser.email) {
                const res = await loginWithGoogleAsync(
                  googleUser.name || googleUser.email.split('@')[0],
                  googleUser.email,
                  googleUser.picture
                );
                if (res.success && res.user) {
                  redirectAfterAuth(res.user);
                } else {
                  setErrorMsg(res.error || 'Gagal memproses akun Google.');
                }
              }
            })
            .catch((err) => {
              console.error('Error fetching Google profile:', err);
              setErrorMsg('Gagal memverifikasi akun Google. Silakan coba kembali.');
            })
            .finally(() => {
              setIsLoadingGoogle(false);
            });
        }
      }
    }
  }, []);

  const handleGoogleLogin = () => {
    const googleClientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '756480995898-g90q9qmhgctfiaakkl5j09p3ucrgdsl5.apps.googleusercontent.com';
    
    // Launch Google OAuth 2.0 with prompt=select_account
    if (googleClientId && googleClientId.includes('.apps.googleusercontent.com')) {
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth`);
      const scope = encodeURIComponent('openid email profile');
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&prompt=select_account`;
      window.location.href = authUrl;
    } else {
      setShowGoogleModal(true);
    }
  };

  const handleConfirmGoogleModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) return;

    const chosenName = googleName.trim() || googleEmail.split('@')[0];
    setIsLoadingGoogle(true);
    const res = await loginWithGoogleAsync(chosenName, googleEmail.trim());
    setIsLoadingGoogle(false);

    if (res.success && res.user) {
      setShowGoogleModal(false);
      redirectAfterAuth(res.user);
    } else {
      setErrorMsg(res.error || 'Gagal memproses akun Google.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Alamat email wajib diisi.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Kata sandi (password) wajib diisi.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await loginUserAsync(email.trim(), password.trim());
        if (!res.success) {
          setErrorMsg(res.error || 'Email atau kata sandi tidak sesuai.');
          return;
        }
        if (res.user) {
          redirectAfterAuth(res.user);
        }
      } else {
        // Mode: Register
        let role: UserRole = 'applicant';
        if (email.includes('admin@smartrecruit') || email.includes('superadmin')) {
          role = 'super_admin';
        }

        const res = await registerUserAsync(
          name.trim(),
          email.trim(),
          password.trim(),
          role,
          phone.trim(),
          headline.trim() || 'Pencari Kerja / Talenta'
        );

        if (!res.success) {
          setErrorMsg(res.error || 'Gagal mendaftar akun.');
          return;
        }
        if (res.user) {
          redirectAfterAuth(res.user);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kendala saat memproses permintaan.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickAccount = (sampleEmail: string) => {
    setEmail(sampleEmail);
    setPassword('password123');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      
      {/* Ambient Backdrop Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Header Brand */}
        <div className="text-center space-y-2">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-xl mx-auto shadow-xl shadow-emerald-950/50 ring-4 ring-emerald-500/20">
            SR
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {mode === 'login' ? 'Masuk ke Akun Anda' : 'Daftar Akun Pelamar Baru'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Platform Rekrutmen Cerdas dengan Analisis Berkas & Skoring AI
          </p>
        </div>

        {/* Auth Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl space-y-5 text-xs">
          
          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoadingGoogle}
            className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-3 transition-all shadow-sm disabled:opacity-50 hover:scale-[1.01]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoadingGoogle ? 'Menghubungkan Akun Google...' : 'Lanjutkan dengan Akun Google'}</span>
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 border-t border-slate-800" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              ATAU LOGIN MANUAL
            </span>
            <div className="flex-1 border-t border-slate-800" />
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Nama Lengkap (Khusus Mode Register) */}
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Nama Lengkap: *</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Anda"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Alamat Email Akun: *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Kata Sandi (Password): *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Ingat Saya & Lupa Kata Sandi (Khusus Mode Login di atas tombol masuk) */}
            {mode === 'login' && (
              <div className="flex items-center justify-between pt-0.5 text-xs">
                <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                  />
                  <span className="text-slate-300 font-medium">Ingat saya</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Fitur lupa kata sandi: Silakan gunakan opsi Lanjutkan dengan Akun Google atau hubungi administrator.')}
                  className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors hover:underline"
                >
                  Lupa kata sandi?
                </button>
              </div>
            )}

            {/* Extra Register Fields */}
            {mode === 'register' && (
              <>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">No. WhatsApp/HP (Opsional):</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="0812xxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Headline Keahlian (Opsional):</label>
                  <input
                    type="text"
                    placeholder="Contoh: Frontend Developer (3 thn exp)"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </>
            )}

            <div className="space-y-2.5 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950/60 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>{mode === 'login' ? 'Masuk ke Aplikasi' : 'Daftar Sebagai Pelamar'}</span>
                )}
              </button>

              {/* Tombol Kembali ke Beranda */}
              <Link
                href="/"
                className="w-full py-3 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-slate-800/90 hover:border-slate-700 transition-all group"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
                <span>Kembali ke Beranda</span>
              </Link>
            </div>
          </form>

          {/* Toggle Login / Register */}
          <div className="text-center pt-2">
            {mode === 'login' ? (
              <p className="text-slate-400">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg(null);
                  }}
                  className="text-emerald-400 font-bold hover:underline"
                >
                  Daftar Pelamar
                </button>
              </p>
            ) : (
              <p className="text-slate-400">
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className="text-emerald-400 font-bold hover:underline"
                >
                  Masuk Saja
                </button>
              </p>
            )}
          </div>

          {/* Quick Account Fill Reference */}
          <div className="pt-4 border-t border-slate-800/90 space-y-2.5">
            <span className="text-[11px] text-slate-400 font-semibold block">
              Isi Cepat Akun Uji Coba:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fillQuickAccount('admin@smartrecruit.id')}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-[11px] text-amber-300 font-semibold border border-amber-500/30 hover:border-amber-500/60 transition-colors shadow-sm"
              >
                👑 Super Admin
              </button>
              <button
                type="button"
                onClick={() => fillQuickAccount('sarah.wijaya@astradigital.co.id')}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-[11px] text-emerald-300 font-semibold border border-emerald-500/30 hover:border-emerald-500/60 transition-colors shadow-sm"
              >
                🏢 PT Astra (HRD)
              </button>
            </div>
          </div>

        </div>

        {/* Company Callout Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-xs flex items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs sm:text-sm">Ingin Membuka Loker Perusahaan?</p>
              <p className="text-slate-400 text-[11px]">Bergabung dengan paket langganan untuk buat akun PT.</p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02]"
          >
            Paket PT
          </Link>
        </div>

      </div>

      {/* GOOGLE ACCOUNT SELECTOR MODAL (INTERACTIVE ACCOUNT CHOOSER) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-md">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Pilih Akun Google Anda</h3>
                <p className="text-[11px] text-slate-400">Masuk sebagai Pelamar Kerja</p>
              </div>
            </div>

            <form onSubmit={handleConfirmGoogleModal} className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Nama Akun Google:</label>
                <input
                  type="text"
                  placeholder="Contoh: Riko Rizky"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Alamat Email Google (Gmail): *</label>
                <input
                  type="email"
                  required
                  placeholder="akunanda@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-md"
                >
                  Lanjutkan Masuk dengan Email Ini
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center text-xs text-slate-400">Memuat formulir autentikasi...</div>}>
      <AuthContent />
    </Suspense>
  );
}
