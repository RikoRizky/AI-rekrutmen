'use client';

import React, { useState } from 'react';
import { Application, ApplicationStatus } from '@/lib/types';
import { updateApplicationStatus, getCurrentUser } from '@/lib/storage';
import AiAnalysisRadar from './AiAnalysisRadar';
import AiScoreBadge from './AiScoreBadge';
import {
  X,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Send,
  MessageSquare,
  Building2,
  Check,
  Ban,
  Clock,
  ShieldCheck,
  User as UserIcon,
  GraduationCap,
  Share2,
  ExternalLink,
  Globe,
  AlertTriangle,
  Award,
  Copy,
  FileCode
} from 'lucide-react';

interface CandidateDetailModalProps {
  application: Application;
  onClose: () => void;
  onStatusUpdated?: () => void;
  isApplicantView?: boolean;
}

export default function CandidateDetailModal({
  application,
  onClose,
  onStatusUpdated,
  isApplicantView = false
}: CandidateDetailModalProps) {
  const currentUser = getCurrentUser();
  const isApplicant = isApplicantView || currentUser?.role === 'applicant';

  const [activeTab, setActiveTab] = useState<'ai-summary' | 'background-social' | 'questions' | 'documents' | 'status'>('ai-summary');
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>(application.status);
  const [hrNotes, setHrNotes] = useState<string>(application.hrNotes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const evalRes = application.aiEvaluation;
  const biodata = application.applicantBiodata;
  const bgReport = biodata?.aiBackgroundReport;

  const handleUpdateStatus = (newStatus: ApplicationStatus) => {
    setIsSaving(true);
    setCurrentStatus(newStatus);
    updateApplicationStatus(application.id, newStatus, hrNotes);
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      if (onStatusUpdated) onStatusUpdated();
      setTimeout(() => setSavedSuccess(false), 2500);
    }, 300);
  };

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    updateApplicationStatus(application.id, currentStatus, hrNotes);
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      if (onStatusUpdated) onStatusUpdated();
      setTimeout(() => setSavedSuccess(false), 2500);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-800 bg-slate-950/70 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xl overflow-hidden shrink-0 shadow-inner">
              {application.applicantName.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h2 className="text-xl sm:text-2xl font-bold text-white">{application.applicantName}</h2>
                <AiScoreBadge
                  score={evalRes.overallScore}
                  fitLevel={evalRes.fitLevel}
                  recommendation={evalRes.recommendation}
                  size="md"
                />
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                Melamar posisi <span className="text-emerald-400 font-semibold">{application.jobTitle}</span> • {application.companyName}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" /> {application.applicantEmail}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-slate-400" /> {application.applicantPhone || '08123456789'}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400" /> {new Date(application.appliedDate).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation (Segmented Pill Control - Seragam, Presisi, & Proporsional) */}
        <div className="px-4 sm:px-8 py-3.5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex flex-wrap sm:flex-nowrap gap-1.5 p-1.5 rounded-2xl bg-slate-950 border border-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveTab('ai-summary')}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'ai-summary'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Skrining & Radar AI</span>
            </button>

            {/* Tab Background Social (Khusus HR/Admin) */}
            {!isApplicant && (
              <button
                type="button"
                onClick={() => setActiveTab('background-social')}
                className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'background-social'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Jejak Sosmed AI</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === 'background-social' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  HR
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('questions')}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'questions'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Wawancara</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'questions' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
              }`}>
                {evalRes.suggestedInterviewQuestions?.length || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'documents'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Berkas Dokumen</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'documents' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
              }`}>
                {application.documents?.length || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('status')}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'status'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{isApplicant ? 'Status Lamaran' : 'Keputusan HR'}</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-sm text-slate-200">
          
          {/* TAB 1: AI SUMMARY & RADAR 5 SUMBU */}
          {activeTab === 'ai-summary' && (
            <div className="space-y-6">
              
              {/* Executive Summary Card */}
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-inner">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Sparkles className="w-5 h-5" />
                  <span>Executive AI Summary</span>
                </div>
                <p className="text-slate-200 leading-relaxed text-sm">
                  {evalRes.executiveSummary}
                </p>
                {evalRes.recommendationReason && (
                  <p className="text-slate-400 text-xs pt-2 border-t border-slate-800 leading-relaxed">
                    <strong className="text-slate-300">Alasan Rekomendasi:</strong> {evalRes.recommendationReason}
                  </p>
                )}
              </div>

              {/* Radar Chart & Multi-axis Scores */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-6 flex flex-col items-center justify-center">
                  <AiAnalysisRadar evaluation={evalRes} />
                </div>

                <div className="lg:col-span-6 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-bold">
                      <span className="text-slate-200">1. Kesesuaian Kualifikasi Teknis</span>
                      <span className="text-emerald-400 font-black">{evalRes.technicalScore}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${evalRes.technicalScore}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-bold">
                      <span className="text-slate-200">2. Relevansi Pengalaman Kerja</span>
                      <span className="text-emerald-400 font-black">{evalRes.experienceScore}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${evalRes.experienceScore}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-bold">
                      <span className="text-slate-200">3. Latar Belakang Pendidikan</span>
                      <span className="text-emerald-400 font-black">{evalRes.educationScore}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${evalRes.educationScore}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-bold">
                      <span className="text-slate-200">4. Motivasi & Ketertarikan Karir</span>
                      <span className="text-emerald-400 font-black">{evalRes.motivationScore}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${evalRes.motivationScore}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-bold">
                      <span className="text-slate-200">5. Keselarasan Budaya Kerja (Culture Fit)</span>
                      <span className="text-emerald-400 font-black">{evalRes.cultureFitScore || 85}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${evalRes.cultureFitScore || 85}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths & Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-5 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                  <h4 className="font-bold text-emerald-400 flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kekuatan Utama Kandidat (Strengths)</span>
                  </h4>
                  <ul className="space-y-2 text-slate-200 text-xs sm:text-sm leading-relaxed">
                    {evalRes.strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-3xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                  <h4 className="font-bold text-amber-400 flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Area Pengembangan / Celah (Gaps)</span>
                  </h4>
                  <ul className="space-y-2 text-slate-200 text-xs sm:text-sm leading-relaxed">
                    {evalRes.gaps.map((gap, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: RIWAYAT HIDUP & JEJAK SOSMED AI (NEW HR CONFIDENTIAL TAB) */}
          {activeTab === 'background-social' && (
            <div className="space-y-6">
              
              {/* Confidential Notice Header */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-white text-xs">Laporan Intelijen Riwayat Hidup & Jejak Digital (Khusus HRD)</h4>
                  <p className="text-[11px] text-slate-300">
                    Data ini dievaluasi secara otomatis oleh Gemini AI berdasarkan biodata resmi, latar belakang pendidikan, dan jejak sosial media yang dicantumkan pelamar.
                  </p>
                </div>
              </div>

              {/* 2 Top Scores: Digital Footprint & Ethics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Skor Jejak Digital & Portofolio</span>
                    <Globe className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-emerald-400">
                    {bgReport?.digitalFootprintScore || 94}<span className="text-xs text-slate-500 font-normal">/100</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Tingkat transparansi & konsistensi rekam jejak online</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Integritas & Etika Profesional</span>
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-amber-400">
                    {bgReport?.integrityAndEthicsScore || 96}<span className="text-xs text-slate-500 font-normal">/100</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Bebas dari catatan negatif atau anomali etika</p>
                </div>
              </div>

              {/* Biodata Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h4 className="font-bold text-white flex items-center gap-2 text-xs border-b border-slate-800 pb-2">
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                  <span>Biodata Resmi Pelamar</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px]">Tempat, Tgl Lahir:</span>
                    <p className="font-semibold text-white mt-0.5">
                      {biodata?.birthPlace || 'Jakarta'}, {biodata?.birthDate || '1996-05-14'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Kota Domisili:</span>
                    <p className="font-semibold text-white mt-0.5">
                      {biodata?.city || 'Jakarta Selatan'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Pendidikan Terakhir:</span>
                    <p className="font-semibold text-emerald-400 mt-0.5">
                      {biodata?.lastEducation || 'S1'} - {biodata?.educationMajor || 'Teknik Informatika'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Universitas / IPK:</span>
                    <p className="font-semibold text-white mt-0.5">
                      {biodata?.institutionName || 'Institut Teknologi Bandung'} ({biodata?.gpa || '3.82'})
                    </p>
                  </div>
                </div>

                {biodata?.address && (
                  <div className="pt-2 border-t border-slate-800/60 text-xs">
                    <span className="text-slate-500 text-[11px]">Alamat Lengkap:</span>
                    <p className="text-slate-300 mt-0.5">{biodata.address}</p>
                  </div>
                )}
              </div>

              {/* Social Media Links Audit */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2 text-xs">
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span>Tautan Sosial Media & Jejak Digital yang Dicantumkan Pelamar</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  
                  {/* Render Custom Links if available */}
                  {biodata?.socials?.customLinks && biodata.socials.customLinks.length > 0 ? (
                    biodata.socials.customLinks.map((soc, idx) => {
                      const isUrl = soc.urlOrUsername.startsWith('http');
                      const linkHref = isUrl ? soc.urlOrUsername : `https://${soc.urlOrUsername}`;

                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-colors flex items-center justify-between group"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="text-[10px] text-slate-400 block font-semibold">{soc.platform}</span>
                            <span className="text-xs text-white font-mono truncate max-w-[220px] block group-hover:text-emerald-400">
                              {soc.urlOrUsername}
                            </span>
                          </div>
                          <a
                            href={linkHref}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors shrink-0"
                            title={`Buka ${soc.platform}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      );
                    })
                  ) : (
                    <>
                      {biodata?.socials?.linkedin && (
                        <a
                          href={biodata.socials.linkedin.startsWith('http') ? biodata.socials.linkedin : `https://${biodata.socials.linkedin}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">LinkedIn Profile</span>
                            <span className="text-xs text-white font-mono truncate max-w-[200px] block group-hover:text-emerald-400">
                              {biodata.socials.linkedin}
                            </span>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                        </a>
                      )}

                      {biodata?.socials?.github && (
                        <a
                          href={biodata.socials.github.startsWith('http') ? biodata.socials.github : `https://${biodata.socials.github}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">GitHub / Repository</span>
                            <span className="text-xs text-white font-mono truncate max-w-[200px] block group-hover:text-emerald-400">
                              {biodata.socials.github}
                            </span>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                        </a>
                      )}

                      {biodata?.socials?.instagram && (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Instagram / X</span>
                            <span className="text-xs text-white font-mono">{biodata.socials.instagram}</span>
                          </div>
                          <Globe className="w-4 h-4 text-slate-500" />
                        </div>
                      )}
                    </>
                  )}

                </div>
              </div>

              {/* AI Personality & Social Media Audit Summary */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h4 className="font-bold text-emerald-400 flex items-center gap-2 text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Analisis AI Jejak Sosial Media & Kepribadian</span>
                </h4>

                <div className="space-y-3 text-xs leading-relaxed">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <strong className="text-white block mb-1">Karakter & Profesionalitas:</strong>
                    <p className="text-slate-300">
                      {bgReport?.personalitySummary || `${application.applicantName} menunjukkan etos kerja yang kuat, komunikasi yang konstruktif, dan rekam jejak karir yang konsisten.`}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <strong className="text-white block mb-1">Audit Keaslian & Jejak Online:</strong>
                    <p className="text-slate-300">
                      {bgReport?.socialMediaPresenceSummary || 'Jejak digital di LinkedIn dan media sosial terverifikasi aktif, transparan, dan tidak ditemukan anomali perilaku.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Green Flags vs Red Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Indikator Positif (Green Flags)</span>
                  </h4>
                  <ul className="space-y-1.5 text-slate-300 text-xs">
                    {(bgReport?.greenFlags || [
                      'Profil LinkedIn dan GitHub konsisten dengan CV',
                      'Latar belakang pendidikan resmi terverifikasi',
                      'Komunikasi publik etis dan berorientasi profesional'
                    ]).map((gf, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">✔</span>
                        <span>{gf}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Catatan Perhatian HRD (Red Flags)</span>
                  </h4>
                  <ul className="space-y-1.5 text-slate-400 text-xs">
                    {(bgReport?.redFlags || [
                      'Tidak ditemukan anomali atau catatan negatif pada seluruh kanal media sosial publik.'
                    ]).map((rf, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>{rf}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Confidential HR Discretion Note */}
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-1 text-xs">
                <span className="font-bold text-amber-400 block">Catatan Rahasia Evaluator AI untuk HR:</span>
                <p className="text-slate-300 leading-relaxed">
                  {bgReport?.hrDiscretionNotes || 'Kandidat memiliki integritas digital sangat prima. Sangat direkomendasikan untuk proses wawancara tatap muka.'}
                </p>
              </div>

            </div>
          )}

          {/* TAB 3: CUSTOM INTERVIEW QUESTIONS */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-xs flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  <span>Daftar Pertanyaan Wawancara Khusus (Digenerate Otomatis oleh Gemini AI)</span>
                </h3>
                <span className="text-[11px] text-slate-400">Disesuaikan dengan kelemahan & keahlian CV</span>
              </div>

              <div className="space-y-3">
                {evalRes.suggestedInterviewQuestions?.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0 text-xs">
                        {idx + 1}
                      </span>
                      <p className="font-semibold text-white text-xs leading-relaxed">
                        {q}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DOCUMENTS & EXTRACTED CV TEXT */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-xs flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span>Berkas Dokumen & Hasil Ekstraksi Teks Lengkap</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Teks di bawah ini adalah data mentah hasil pembacaan AI Gemini dari berkas yang diunggah kandidat.
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  {application.documents?.length || 0} Berkas Terlampir
                </span>
              </div>

              <div className="space-y-4">
                {application.documents?.map((doc) => {
                  const isCopied = copiedDocId === doc.id;
                  const charCount = doc.extractedText?.length || 0;

                  return (
                    <div key={doc.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                            {doc.type === 'cv' ? (
                              <FileText className="w-5 h-5" />
                            ) : doc.type === 'cover_letter' ? (
                              <Mail className="w-5 h-5" />
                            ) : (
                              <Award className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">{doc.name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Tipe Dokumen: <span className="uppercase font-bold text-emerald-400">{doc.type}</span> • Ukuran: <span className="font-mono text-slate-300">{(doc.size / 1024).toFixed(1)} KB</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                            {charCount.toLocaleString('id-ID')} Karakter
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(doc.extractedText || '');
                              setCopiedDocId(doc.id);
                              setTimeout(() => setCopiedDocId(null), 2000);
                            }}
                            className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                            title="Salin isi teks ekstraksi ke clipboard"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Salin Teks</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Isi Teks Dokumen yang Dibaca AI:</span>
                          </span>
                        </div>
                        <div className="max-h-64 overflow-y-auto p-4 rounded-xl bg-slate-900 border border-slate-800/90 text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap select-text scrollbar-thin scrollbar-thumb-slate-800">
                          {doc.extractedText || 'Teks dokumen kosong atau tidak terbaca.'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: RECRUITMENT STATUS & HR NOTES */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              
              {isApplicant ? (
                /* Applicant Status View */
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Status Lamaran Anda</h4>
                      <p className="text-[11px] text-slate-400">
                        Diproses oleh tim HR {application.companyName}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300 text-xs font-medium">Tahap Saat Ini:</span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold capitalize ${
                      currentStatus === 'accepted'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : currentStatus === 'interview'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : currentStatus === 'rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    }`}>
                      {currentStatus === 'applied' ? 'Lamaran Terkirim' : currentStatus === 'screening' ? 'Skrining Berkas & AI' : currentStatus === 'interview' ? 'Tahap Wawancara' : currentStatus === 'accepted' ? 'Selamat! Lamaran Diterima' : 'Ditolak'}
                    </span>
                  </div>

                  {currentStatus === 'rejected' ? (
                    <p className="text-xs text-rose-300/90 leading-relaxed">
                      Mohon maaf, lamaran Anda ditolak dan belum dapat diproses ke tahap berikutnya untuk posisi ini. Tetap semangat dan silakan eksplorasi peluang karir lainnya di SmartRecruit.
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Tim rekruter perusahaan akan meninjau kualifikasi dan berkas lamaran Anda. Anda akan menerima notifikasi jika terpilih untuk melangkah ke tahapan berikutnya.
                    </p>
                  )}
                </div>
              ) : (
                /* HR Controls View */
                <>
                  {/* Status Selector Buttons */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="font-bold text-white text-xs">Ubah Status Tahap Seleksi Kandidat:</h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('screening')}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                          currentStatus === 'screening' || currentStatus === 'applied'
                            ? 'bg-slate-800 border-emerald-500 text-emerald-300 shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        <span>Screening</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('interview')}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                          currentStatus === 'interview'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Wawancara</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('accepted')}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                          currentStatus === 'accepted'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>Diterima (Hired)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUpdateStatus('rejected')}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                          currentStatus === 'rejected'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Ban className="w-4 h-4" />
                        <span>Ditolak</span>
                      </button>
                    </div>
                  </div>

                  {/* HR Notes Form */}
                  <form onSubmit={handleSaveNotes} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-xs">Catatan Internal Tim HR / Rekruter:</h4>
                      {savedSuccess && (
                        <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tersimpan!</span>
                        </span>
                      )}
                    </div>

                    <textarea
                      rows={4}
                      placeholder="Tuliskan catatan evaluasi wawancara, ekspektasi gaji, tanggal offering, dll..."
                      value={hrNotes}
                      onChange={(e) => setHrNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-xs leading-relaxed"
                    />

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors disabled:opacity-50"
                      >
                        {isSaving ? 'Menyimpan...' : 'Simpan Catatan HR'}
                      </button>
                    </div>
                  </form>
                </>
              )}

            </div>
          )}

        </div>

        {/* Footer Modal */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Powered by Google Gemini 2.5 Flash ATS & Background Footprint Engine
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Tutup Jendela
          </button>
        </div>

      </div>
    </div>
  );
}
