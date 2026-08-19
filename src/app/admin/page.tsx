'use client';

import React, { useState, useEffect } from 'react';
import { Job, Application, User } from '@/lib/types';
import { getAllJobs, getAllApplications, getCurrentUser, toggleJobStatus, initializeStorage, REFRESH_EVENT } from '@/lib/storage';
import Link from 'next/link';
import {
  Layers,
  Users,
  Sparkles,
  PlusCircle,
  Briefcase,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  Search,
  Building,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    initializeStorage();
    const loadData = () => {
      setJobs(getAllJobs());
      setApplications(getAllApplications());
      setCurrentUser(getCurrentUser());
    };

    loadData();
    window.addEventListener(REFRESH_EVENT, loadData);
    return () => window.removeEventListener(REFRESH_EVENT, loadData);
  }, []);

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status === 'active').length;
  const totalApplicants = applications.length;
  const topMatchApplicants = applications.filter((a) => (a.aiEvaluation?.overallScore || 0) >= 85).length;
  const needReview = applications.filter((a) => a.status === 'applied' || a.status === 'screening').length;

  const handleToggleStatus = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    toggleJobStatus(id);
  };

  const filteredJobs = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-2">
            <Layers className="w-3.5 h-3.5" /> Dashboard ATS & Seleksi AI
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            Panel Rekrutmen HRD
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola lowongan aktif dan tinjau daftar pelamar yang otomatis diurutkan berdasarkan skor kecocokan AI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/jobs/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-500/20 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" /> Buka Lowongan Baru
          </Link>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Lowongan</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-3">{totalJobs}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            {activeJobs} Lowongan Sedang Aktif
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pelamar Masuk</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-3">{totalApplicants}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Seluruh berkas teranalisis otomatis
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Kandidat Top Match</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-3">{topMatchApplicants}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Skor AI Relevansi &ge; 85%
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Perlu Review / Action</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-3">{needReview}</div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Tahap screening & evaluasi
          </div>
        </div>

      </div>

      {/* Jobs Management Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Daftar Lowongan & Pipeline Pelamar
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Klik lowongan untuk melihat pelamar yang sudah terurut dari skor paling relevan ke paling rendah.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari lowongan / divisi..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>
        </div>

        {/* Table / Cards */}
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const jobApps = applications.filter((a) => a.jobId === job.id);
            const highestScore = jobApps.length > 0
              ? Math.max(...jobApps.map((a) => a.aiEvaluation?.overallScore || 0))
              : null;
            const topCandidate = jobApps.find((a) => a.aiEvaluation?.overallScore === highestScore);

            return (
              <div
                key={job.id}
                className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800/60 hover:border-indigo-500/40 transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left Job Info */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      {job.department}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {job.type}
                    </span>
                    <button
                      onClick={(e) => handleToggleStatus(job.id, e)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition ${
                        job.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20'
                      }`}
                    >
                      {job.status === 'active' ? '● Aktif' : '○ Ditutup'} (Klik toggle)
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {job.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>Pengalaman: {job.experienceLevel}</span>
                    <span>•</span>
                    <span>Gaji: {job.salaryRange.split('/')[0]}</span>
                    <span>•</span>
                    <span>Dibuat: {new Date(job.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>

                {/* Right Candidates Stats & CTA */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-200 dark:border-slate-800">
                  
                  {/* Applicants Counter Badge */}
                  <div className="flex items-center gap-3">
                    <div className="text-left sm:text-right">
                      <div className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                        {jobApps.length} Pelamar
                      </div>
                      {highestScore !== null ? (
                        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Top AI: {highestScore}% ({topCandidate?.applicantName.split(' ')[0]})
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">Belum ada pelamar</div>
                      )}
                    </div>
                  </div>

                  {/* Open Candidates Ranking Page */}
                  <Link
                    href={`/admin/jobs/${job.id}/candidates`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition active:scale-95"
                  >
                    <span>Lihat Ranking AI Pelamar</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
