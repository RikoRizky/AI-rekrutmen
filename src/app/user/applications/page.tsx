'use client';

import React, { useState, useEffect } from 'react';
import { Application, User } from '@/lib/types';
import { getCurrentUser, getAllApplications, initializeStorage, REFRESH_EVENT } from '@/lib/storage';
import AiScoreBadge from '@/components/AiScoreBadge';
import CandidateDetailModal from '@/components/CandidateDetailModal';
import Link from 'next/link';
import {
  FileCheck,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Briefcase,
  Search,
  MessageSquare
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
        const matched = apps.filter(
          (a) =>
            a.userId === user.id ||
            a.applicantEmail.toLowerCase() === user.email.toLowerCase()
        );
        setMyApplications(matched);
      }
    };

    loadData();
    window.addEventListener(REFRESH_EVENT, loadData);
    return () => window.removeEventListener(REFRESH_EVENT, loadData);
  }, []);

  const getStatusConfig = (status: Application['status']) => {
    switch (status) {
      case 'accepted':
        return {
          label: 'Selamat! Lamaran Diterima',
          bg: 'bg-emerald-600 text-white border-emerald-500',
          icon: CheckCircle2
        };
      case 'interview':
        return {
          label: 'Tahap Wawancara (Interview)',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: MessageSquare
        };
      case 'screening':
        return {
          label: 'Peninjauan Berkas AI & HRD',
          bg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          icon: Clock
        };
      case 'rejected':
        return {
          label: 'Ditolak',
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: AlertCircle
        };
      default:
        return {
          label: 'Lamaran Terkirim (Applied)',
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: Clock
        };
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>Portal Pelamar Kerja</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Status Lamaran Saya
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pantau progress seleksi dan hasil evaluasi radar Gemini AI untuk setiap lowongan yang Anda lamar.
          </p>
        </div>

        <Link
          href="/jobs"
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-sm"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Eksplorasi Loker Lainnya</span>
        </Link>
      </div>

      {/* Applications List */}
      {myApplications.length > 0 ? (
        <div className="space-y-4">
          {myApplications.map((app) => {
            const ev = app.aiEvaluation;
            const statusCfg = getStatusConfig(app.status);
            const StatusIcon = statusCfg.icon;

            return (
              <div
                key={app.id}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left Side: Job & Company */}
                <div className="space-y-2 max-w-lg">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-emerald-400">{app.companyName}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{app.jobDepartment}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{app.jobTitle}</h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Dilamar: {new Date(app.appliedDate).toLocaleDateString('id-ID')}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>{app.documents.length} Berkas Terlampir</span>
                    </span>
                  </div>

                  {app.hrNotes && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                      <strong className="text-emerald-400">Catatan HR:</strong> {app.hrNotes}
                    </div>
                  )}
                </div>

                {/* Right Side: AI Score & Status Action */}
                <div className="flex flex-row md:flex-col items-start md:items-end justify-between gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
                  
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusCfg.bg}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusCfg.label}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <AiScoreBadge
                      score={ev.overallScore}
                      fitLevel={ev.fitLevel}
                      recommendation={ev.recommendation}
                      size="sm"
                    />

                    <button
                      onClick={() => setSelectedApp(app)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Lihat Evaluasi AI</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Belum Ada Lamaran Kerja</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Anda belum mengirimkan lamaran untuk lowongan manapun. Temukan posisi yang cocok dan lamar sekarang.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
          >
            <span>Cari Lowongan Kerja</span>
          </Link>
        </div>
      )}

      {/* Candidate Modal for viewing application details */}
      {selectedApp && (
        <CandidateDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onStatusUpdated={() => {
            const apps = getAllApplications();
            const user = getCurrentUser();
            if (user) {
              setMyApplications(
                apps.filter(
                  (a) =>
                    a.userId === user.id ||
                    a.applicantEmail.toLowerCase() === user.email.toLowerCase()
                )
              );
            }
          }}
        />
      )}

    </div>
  );
}
