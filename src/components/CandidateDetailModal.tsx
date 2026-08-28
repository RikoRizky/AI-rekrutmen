'use client';

import React, { useState } from 'react';
import { Application, ApplicationStatus } from '@/lib/types';
import { updateApplicationStatus, getCurrentUser, getAllUsers, getDefaultUserAvatar, repairApplicationEvaluation } from '@/lib/storage';
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
  FileCode,
  GitBranch,
  Star,
  Users,
  Code2,
  Activity,
  BadgeCheck,
  XCircle
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

  const evalRes = application.aiEvaluation || repairApplicationEvaluation(application).aiEvaluation;
  const biodata = application.applicantBiodata;
  const bgReport = biodata?.aiBackgroundReport;

  // Resolve candidate documents across application, biodata, and user profile
  const candidateDocs = (application.documents && Array.isArray(application.documents) && application.documents.length > 0)
    ? application.documents
    : (biodata?.documents && Array.isArray(biodata.documents) && biodata.documents.length > 0)
    ? biodata.documents
    : (currentUser?.biodata?.documents && (application.userId === currentUser.id || application.applicantEmail?.toLowerCase() === currentUser.email?.toLowerCase()))
    ? currentUser.biodata.documents
    : [];

  // Resolve candidate avatar from user profile/biodata or fallback to default
  const allUsers = getAllUsers();
  const matchedUser = allUsers.find(
    (u) =>
      u.id === application.userId ||
      (application.applicantEmail && u.email.toLowerCase() === application.applicantEmail.toLowerCase())
  );
  const applicantAvatar =
    matchedUser?.avatar ||
    (currentUser && (currentUser.id === application.userId || currentUser.email.toLowerCase() === application.applicantEmail?.toLowerCase()) ? currentUser.avatar : null) ||
    getDefaultUserAvatar(application.applicantName || 'Pelamar');

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
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              <img
                src={applicantAvatar}
                alt={application.applicantName}
                className="w-full h-full object-cover"
              />
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
                <span>Audit Rekam Jejak AI</span>
              </button>
            )}
            {!isApplicant && (
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
                  activeTab === 'questions' ? 'bg-white/20 text-white' : 'bg-slate-800 text-emerald-400'
                }`}>
                  {evalRes.suggestedInterviewQuestions?.length || 0}
                </span>
              </button>
            )}
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
              <span>Berkas CV ({candidateDocs.length})</span>
            </button>
            {!isApplicant && (
              <button
                type="button"
                onClick={() => setActiveTab('status')}
                className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'status'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <ChevronRight className="w-4 h-4 shrink-0" />
                <span>Keputusan</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-sm text-slate-200">
          
          {/* TAB 1: HASIL ANALISIS AI (RADAR & SUMMARY) */}
          {activeTab === 'ai-summary' && (
            <div className="space-y-6">

              {/* Radar Component */}
              <AiAnalysisRadar evaluation={evalRes} />

              {/* Executive Summary */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Ringkasan Eksekutif AI</span>
                </h4>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {evalRes.executiveSummary}
                </p>
                {evalRes.recommendationReason && (
                  <p className="text-slate-400 text-xs pt-2 border-t border-slate-800 leading-relaxed">
                    <strong className="text-slate-300">Alasan Rekomendasi:</strong> {evalRes.recommendationReason}
                  </p>
                )}
              </div>

              {/* Score Breakdown Bar */}
              <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <h4 className="font-bold text-white text-sm">Rincian 5 Parameter Skor Evaluasi</h4>
                
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-bold">
                      <span className="text-slate-200">1. Kualifikasi Teknis & Keterampilan Utama</span>
                      <span className="text-emerald-400 font-black">{evalRes.technicalScore}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${evalRes.technicalScore}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-bold">
                      <span className="text-slate-200">2. Relevansi Pengalaman & Riwayat Karir</span>
                      <span className="text-emerald-400 font-black">{evalRes.experienceScore}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${evalRes.experienceScore}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm font-bold">
                      <span className="text-slate-200">3. Kesesuaian Pendidikan & Latar Akademik</span>
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
                    {(evalRes.strengths || []).map((str, i) => (
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
                    {(evalRes.gaps || []).map((gap, i) => (
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

          {/* TAB 2: AUDIT REKAM JEJAK & BIODATA AI (CONFIDENTIAL HR TAB) */}
          {activeTab === 'background-social' && (
            <div className="space-y-6">
              
              {/* Confidential Notice Header */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-white text-xs">Laporan Audit Rekam Jejak & Kredibilitas Biodata (Khusus HRD)</h4>
                  <p className="text-[11px] text-slate-300">
                    Sistem AI menganalisis rekam jejak, kredibilitas kronologis, dan integritas kandidat murni dari informasi biodata resmi dan berkas dokumen pelamar.
                  </p>
                </div>
              </div>

              {/* 2 Top Scores: Biodata Credibility & Integrity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Skor Kredibilitas & Konsistensi Biodata</span>
                    <Award className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-emerald-400">
                    {bgReport?.credibilityScore || bgReport?.digitalFootprintScore || 92}<span className="text-xs text-slate-500 font-normal">/100</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Validitas kronologi kelulusan, institusi, dan kelengkapan profil</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Integritas & Verifikasi Identitas Resmi</span>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-amber-400">
                    {bgReport?.integrityAndEthicsScore || 95}<span className="text-xs text-slate-500 font-normal">/100</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Kesesuaian identitas KTP resmi dengan dokumen pendukung CV</p>
                </div>
              </div>

              {/* Biodata & Identitas Resmi Card */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h4 className="font-bold text-white flex items-center gap-2 text-xs border-b border-slate-800 pb-2">
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                  <span>Identitas Resmi &amp; Biodata Pelamar (KTP)</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px]">Nama Lengkap (KTP):</span>
                    <p className="font-bold text-white mt-0.5">
                      {biodata?.fullName || application.applicantName}
                    </p>
                  </div>

                  {biodata?.gender && (
                    <div>
                      <span className="text-slate-500 text-[11px]">Jenis Kelamin:</span>
                      <p className={`font-bold mt-0.5 ${
                        biodata.gender === 'Laki-laki' ? 'text-blue-400' : 'text-pink-400'
                      }`}>
                        {biodata.gender === 'Laki-laki' ? '♂ Laki-laki' : '♀ Perempuan'}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-500 text-[11px]">Tempat &amp; Tgl Lahir:</span>
                    <p className="font-semibold text-white mt-0.5">
                      {biodata?.birthPlace || '-'}, {biodata?.birthDate || '-'}
                      {bgReport?.calculatedAge !== undefined && (
                        <span className="text-emerald-400 font-bold text-[11px] block mt-0.5">
                          Usia: {bgReport.calculatedAge} Tahun
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[11px]">No. Telepon / WhatsApp:</span>
                    <p className="font-semibold text-emerald-400 mt-0.5">
                      {biodata?.phone || application.applicantPhone || '-'}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <span className="text-slate-500 text-[11px]">Kota Domisili &amp; Alamat:</span>
                    <p className="font-semibold text-white mt-0.5">
                      {biodata?.city ? `${biodata.city}` : ''} {biodata?.address ? `(${biodata.address})` : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Name Verification Result Card */}
              {bgReport?.nameVerificationResult && (
                <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
                  bgReport.nameVerificationResult.nameFoundInCv
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-amber-950/20 border-amber-500/30'
                }`}>
                  <h4 className={`font-bold flex items-center gap-2 text-xs ${
                    bgReport.nameVerificationResult.nameFoundInCv ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {bgReport.nameVerificationResult.nameFoundInCv
                      ? <BadgeCheck className="w-4 h-4" />
                      : <AlertTriangle className="w-4 h-4" />
                    }
                    <span>Cross-Check Nama KTP ↔ Dokumen CV</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Nama di Biodata/KTP:</span>
                      <span className="font-bold text-white">{bgReport.nameVerificationResult.nameInBiodata}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Status Verifikasi CV:</span>
                      <span className={`font-bold ${bgReport.nameVerificationResult.nameFoundInCv ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {bgReport.nameVerificationResult.nameFoundInCv ? '✅ Terverifikasi di CV' : '⚠️ Perlu Konfirmasi Manual'}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-300 leading-relaxed border-t border-slate-800/60 pt-2 text-[11px]">
                    {bgReport.nameVerificationResult.verificationNote}
                  </p>
                </div>
              )}

              {/* Riwayat Pendidikan & Audit Akademik Card */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2 text-xs border-b border-slate-800 pb-2">
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  <span>Audit Riwayat Pendidikan &amp; Akademik</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px]">Jenjang Pendidikan:</span>
                    <p className="font-semibold text-emerald-400 mt-0.5">{biodata?.lastEducation || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Institusi / Universitas:</span>
                    <p className="font-semibold text-white mt-0.5">{biodata?.institutionName || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Jurusan / Prodi:</span>
                    <p className="font-semibold text-white mt-0.5">{biodata?.educationMajor || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Tahun Lulus / IPK:</span>
                    <p className="font-semibold text-white mt-0.5">
                      {biodata?.graduationYear || '-'} {biodata?.gpa ? `(IPK: ${biodata.gpa})` : ''}
                    </p>
                  </div>
                </div>

                {bgReport?.academicAuditSummary && (
                  <div className="pt-2 border-t border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-500 font-semibold block mb-1">EVALUASI AKADEMIK AI:</span>
                    <p className="text-slate-300 leading-relaxed">{bgReport.academicAuditSummary}</p>
                  </div>
                )}
              </div>

              {/* Ringkasan Profil & Rekam Jejak Karir */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h4 className="font-bold text-emerald-400 flex items-center gap-2 text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Sintesis AI — Analisis Rekam Jejak &amp; Karakter Profesional</span>
                </h4>

                <div className="space-y-3 text-xs leading-relaxed">
                  {(biodata?.bioSummary || biodata?.socials?.additionalBio) && (
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
                      <strong className="text-white block mb-1 text-[11px]">Ringkasan Profil yang Ditulis Pelamar:</strong>
                      <p className="text-slate-300 italic">&ldquo;{biodata.bioSummary || biodata.socials?.additionalBio}&rdquo;</p>
                    </div>
                  )}

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <strong className="text-emerald-400 block mb-1 text-[11px]">Analisis Rekam Jejak &amp; Kontinuitas Karir:</strong>
                    <p className="text-slate-300">
                      {bgReport?.careerTrajectorySummary || bgReport?.socialMediaPresenceSummary || 'Rekam jejak karir dan latar belakang akademik menunjukkan profil pelamar yang terstruktur.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
                    <strong className="text-white block mb-1 text-[11px]">Karakter &amp; Profil Profesional:</strong>
                    <p className="text-slate-300">
                      {bgReport?.personalitySummary || `${application.applicantName} memiliki profil biodata resmi yang terverifikasi.`}
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
                      'Data biodata resmi terisi lengkap'
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
                      'Tidak ditemukan catatan negatif berdasarkan data yang tersedia.'
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
                  {bgReport?.hrDiscretionNotes || 'Data biodata resmi konsisten. Lakukan verifikasi berkas fisik pada tahap wawancara.'}
                </p>
              </div>

            </div>
          )}

          {activeTab === 'questions' && !isApplicant && (
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
                  {candidateDocs.length} Berkas Terlampir
                </span>
              </div>

              <div className="space-y-4">
                {candidateDocs.length > 0 ? (
                  candidateDocs.map((doc) => {
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
                })
              ) : (
                <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-semibold">Belum Ada Dokumen Terlampir</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Kandidat belum melampirkan berkas dokumen digital pada saat mengirimkan lamaran ini.
                  </p>
                </div>
              )}
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
