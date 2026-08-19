'use client';

import React, { useState, useEffect } from 'react';
import { Application, User } from '@/lib/types';
import { getCurrentUser, getAllApplications, initializeStorage, REFRESH_EVENT } from '@/lib/storage';
import AiScoreBadge from '@/components/AiScoreBadge';
import CandidateDetailModal from '@/components/CandidateDetailModal';
import Link from 'next/link';
import {
  FileCheck,
  Building,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Briefcase
} from 'lucide-react';

export default function UserApplicationsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
    initializeStorage();
    const loadData = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
      if (user) {
        const apps = getAllApplications();
        // Match user's applications
        const matched = apps.filter((a) => a.userId === user.id || a.applicantEmail.toLowerCase() === user.email.toLowerCase());
        setMyApplications(matched);
      }
    };

    loadData();
    window.addEventListener(REFRESH_EVENT, loadData);
    return () => window.removeEventListener(REFRESH_EVENT, loadData);
  }, []);

  const getStatusText = (status: Application['status']) => {
    switch (status) {
      case 'accepted':
        return { label: 'Selamat! Diterima Bekerja', bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      case 'interview':
        return { label: 'Tahap Wawancara (Interview)', bg: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
      case 'screening':
        return { label: 'Lolos Seleksi Berkas AI', bg: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
      case 'rejected':
        return { label: 'Belum Sesuai Kriteria', bg: 'bg-rose-500/10 text-rose-600 border-rose-500/20' };
      default:
        return { label: 'Dalam Peninjauan AI & HRD', bg: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-2">
            <FileCheck className="w-3.5 h-3.5" /> Portal Pelamar
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            Riwayat Lamaran Saya
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pantau status seleksi berkas dan hasil evaluasi kecocokan AI untuk setiap posisi yang Anda lamar.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm self-start sm:self-auto"
        >
          <Briefcase className="w-4 h-4" /> Cari Lowongan Baru
        </Link>
      </div>

      {/* Applications List */}
      {myApplications.length > 0 ? (
        <div className="space-y-4">
          {myApplications.map((app) => {
            const statusInfo = getStatusText(app.status);
            return (
              <div
                key={app.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/40 transition-all duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  {/* Left Info */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {app.jobDepartment || 'Engineering'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.bg}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {app.jobTitle}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Tanggal Lamar: {new Date(app.appliedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5" /> {app.documents.length} Berkas Terlampir (CV, Sertifikat)
                      </span>
                    </div>

                    {/* AI Executive Summary Snippet */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 max-w-2xl text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Analisis Kesesuaian AI:
                      </span>
                      <p className="line-clamp-2 leading-relaxed">
                        {app.aiEvaluation.executiveSummary}
                      </p>
                    </div>
                  </div>

                  {/* Right Score & Action */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-right">
                      <AiScoreBadge
                        score={app.aiEvaluation.overallScore}
                        fitLevel={app.aiEvaluation.fitLevel}
                        size="md"
                        isRealAi={app.aiEvaluation.isRealAi}
                      />
                    </div>

                    <button
                      onClick={() => setSelectedApp(app)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> Lihat Detail & Analisis AI
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
            <FileCheck className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Belum Ada Lamaran yang Dikirim</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Anda belum melamar posisi apapun. Pilih lowongan pekerjaan yang tersedia di beranda dan unggah berkas Anda untuk memulai seleksi.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition"
          >
            <span>Jelajahi Lowongan Tersedia</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Candidate Dossier Detail Modal */}
      {selectedApp && (
        <CandidateDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}

    </div>
  );
}
