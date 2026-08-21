'use client';

import React, { useState, useEffect } from 'react';
import { Job, Application, Company, User } from '@/lib/types';
import {
  getAllJobs,
  getAllApplications,
  getAllCompanies,
  getCurrentUser,
  initializeStorage,
  REFRESH_EVENT
} from '@/lib/storage';
import { SUBSCRIPTION_PACKAGES } from '@/lib/seed-data';
import JobCard from '@/components/JobCard';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  Briefcase,
  MapPin,
  FileCheck2,
  TrendingUp,
  ShieldCheck,
  Building2,
  Users,
  ArrowRight,
  CheckCircle2,
  Zap,
  CreditCard,
  ChevronRight
} from 'lucide-react';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  useEffect(() => {
    initializeStorage();
    const load = () => {
      setJobs(getAllJobs());
      setCompanies(getAllCompanies());
      setApplications(getAllApplications());
      setCurrentUser(getCurrentUser());
    };
    load();

    window.addEventListener(REFRESH_EVENT, load);
    return () => window.removeEventListener(REFRESH_EVENT, load);
  }, []);

  const filteredJobs = jobs.filter((j) => {
    const matchQ =
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.keySkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchDept = selectedDept === 'all' || j.department === selectedDept;
    return matchQ && matchDept;
  });

  return (
    <div className="space-y-16 pb-20">
      
      {/* HERO SECTION - Emerald & Slate (NO BLUE/PURPLE) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        
        {/* Subtle emerald glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Platform ATS Rekrutmen Cerdas Multi-Tenant & Evaluator AI</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Rekrutmen Modern Berbasis <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
              Analisis Dokumen & Skoring AI
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
            Menghubungkan perusahaan terkemuka dengan talenta terbaik di Indonesia. Dilengkapi skrining otomatis Gemini AI, radar kompetensi 5 dimensi, dan alur pendaftaran berbayar terintegrasi Midtrans & Resend.
          </p>

          {/* Search Box in Hero */}
          <div className="max-w-3xl mx-auto pt-4">
            <div className="p-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-2xl flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center gap-3 px-3 py-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                <Search className="w-5 h-5 text-emerald-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari posisi kerja, skill (misal: Next.js, Python), atau nama PT..."
                  className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <button
                onClick={() => {}}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
              >
                <span>Temukan Loker</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-8 border-t border-slate-800/80 text-left">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xl sm:text-2xl font-black text-emerald-400">{companies.length}+</div>
              <div className="text-xs text-slate-400">Perusahaan Terverifikasi</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xl sm:text-2xl font-black text-white">{jobs.length}</div>
              <div className="text-xs text-slate-400">Lowongan Terbuka</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xl sm:text-2xl font-black text-emerald-400">{applications.length}</div>
              <div className="text-xs text-slate-400">Kandidat Tersaring AI</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xl sm:text-2xl font-black text-amber-400">99.2%</div>
              <div className="text-xs text-slate-400">Akurasi Skrining CV</div>
            </div>
          </div>

        </div>
      </section>



      {/* FEATURED JOBS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Lowongan Kerja Unggulan</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Posisi aktif dari perusahaan-perusahaan terdaftar di platform SmartRecruit.
            </p>
          </div>

          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 self-start sm:self-auto"
          >
            <span>Lihat Semua ({jobs.length} Loker)</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.slice(0, 6).map((job) => {
            const hasApplied = currentUser
              ? applications.some(
                  (a) =>
                    a.jobId === job.id &&
                    (a.userId === currentUser.id ||
                      a.applicantEmail.toLowerCase() === currentUser.email.toLowerCase())
                )
              : false;

            return (
              <JobCard
                key={job.id}
                job={job}
                applicantCount={applications.filter((a) => a.jobId === job.id).length}
                hasApplied={hasApplied}
              />
            );
          })}
        </div>
      </section>

      {/* PRICING PLANS BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/50 border border-slate-800 relative overflow-hidden">
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl text-center lg:text-left">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                Untuk Perusahaan & Tim HRD
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Siap Merekrut Talenta Terbaik dengan Bantuan AI?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Pilih paket langganan, bayar mudah via Midtrans (QRIS, VA Bank, CC), dan dapatkan link pendaftaran eksklusif yang dikirimkan langsung ke email Anda.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/pricing"
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Lihat Paket & Berlangganan</span>
              </Link>
              
              <Link
                href="/jobs"
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all border border-slate-700 flex items-center justify-center gap-2"
              >
                <span>Cari Loker Saja</span>
              </Link>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
