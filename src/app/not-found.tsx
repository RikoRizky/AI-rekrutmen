'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  ArrowLeft,
  Home,
  Briefcase,
  CreditCard,
  LogIn,
  Search,
  Sparkles
} from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl text-center space-y-8 relative z-10">
        
        {/* Glowing Badge & Big 404 Visual */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <Compass className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>404 — Halaman Tidak Ditemukan</span>
          </div>

          <div className="relative flex items-center justify-center py-4">
            <span className="text-8xl sm:text-9xl font-black tracking-tighter bg-gradient-to-b from-slate-200 via-slate-500 to-slate-800 bg-clip-text text-transparent select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md flex items-center justify-center shadow-2xl shadow-emerald-950/60 rotate-12">
                <Search className="w-10 h-10 text-emerald-400 -rotate-12" />
              </div>
            </div>
          </div>
        </div>

        {/* Heading & Explanation */}
        <div className="space-y-2.5 max-w-md mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Ups! Anda Tersesat di Halaman yang Salah
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Halaman yang Anda cari tidak dapat ditemukan, tautan mungkin sudah kedaluwarsa, atau URL yang Anda masukkan salah.
          </p>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left">
          
          <Link
            href="/"
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all hover:-translate-y-0.5 group shadow-lg"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Home className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-xs group-hover:text-emerald-300 transition-colors">
              Beranda Utama
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Kembali ke beranda SmartRecruit
            </p>
          </Link>

          <Link
            href="/jobs"
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all hover:-translate-y-0.5 group shadow-lg"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Briefcase className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-xs group-hover:text-emerald-300 transition-colors">
              Cari Lowongan
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Eksplorasi loker perusahaan mitra
            </p>
          </Link>

          <Link
            href="/pricing"
            className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all hover:-translate-y-0.5 group shadow-lg"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-xs group-hover:text-emerald-300 transition-colors">
              Paket Langganan
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Paket rekrutmen khusus PT
            </p>
          </Link>

        </div>

        {/* Bottom CTA Button */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center gap-2 border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Sebelumnya</span>
          </button>

          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Menuju Beranda</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
