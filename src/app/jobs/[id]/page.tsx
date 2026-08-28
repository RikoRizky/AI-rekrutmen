'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Job, DocumentAttachment, User, Application } from '@/lib/types';
import { getJobById, getCurrentUser, submitApplication, getAllApplications, initializeStorage, getJobDeadlineCountdown, repairApplicationEvaluation } from '@/lib/storage';
import { evaluateApplicantWithAi } from '@/lib/ai-evaluator';
import DocumentUploader from '@/components/DocumentUploader';
import AiScoreBadge from '@/components/AiScoreBadge';
import CandidateDetailModal from '@/components/CandidateDetailModal';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Send,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  User as UserIcon,
  Eye
} from 'lucide-react';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Existing application if candidate already applied
  const [existingApplication, setExistingApplication] = useState<Application | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const deadlineInfo = getJobDeadlineCountdown(job?.deadline);

  // Form State
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantHeadline, setApplicantHeadline] = useState('');
  const [documents, setDocuments] = useState<DocumentAttachment[]>([]);

  // Submission / AI Screening State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screeningStep, setScreeningStep] = useState<string>('');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [evaluatedScore, setEvaluatedScore] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    initializeStorage();
    if (jobId) {
      const foundJob = getJobById(jobId);
      setJob(foundJob);
    }
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setApplicantName(user.biodata?.fullName || user.name);
      setApplicantEmail(user.email);
      setApplicantPhone(user.biodata?.phone || user.phone || '');
      setApplicantHeadline(user.headline || '');

      // Check if candidate already applied to this specific job
      const apps = getAllApplications();
      const userMatches = apps.filter(
        (a) =>
          a.jobId === jobId &&
          (a.userId === user.id || a.applicantEmail?.toLowerCase() === user.email.toLowerCase())
      );
      // Urutkan tanggal melamar paling baru (descending) agar selalu konsisten
      userMatches.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
      const match = userMatches[0];

      if (match) {
        setExistingApplication(repairApplicationEvaluation(match));
      } else {
        // Pre-fill documents from user profile or past applications if available
        if (user.biodata?.documents && user.biodata.documents.length > 0) {
          setDocuments(user.biodata.documents);
        } else {
          const prevApp = apps.find(
            (a) => (a.userId === user.id || a.applicantEmail.toLowerCase() === user.email.toLowerCase()) &&
              a.documents && a.documents.length > 0
          );
          if (prevApp?.documents) {
            setDocuments(prevApp.documents);
          }
        }
      }
    }
  }, [jobId]);

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Lowongan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-400">Lowongan yang Anda cari mungkin sudah ditutup atau tidak aktif.</p>
        <Link href="/jobs" className="inline-flex items-center gap-2 text-xs text-emerald-400 font-semibold">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog Lowongan</span>
        </Link>
      </div>
    );
  }

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentUser) {
      router.push(`/auth?callbackUrl=/jobs/${job.id}`);
      return;
    }

    if (existingApplication) {
      setErrorMsg('Anda sudah pernah mengirimkan lamaran untuk lowongan ini.');
      return;
    }

    if (!applicantName.trim() || !applicantEmail.trim()) {
      setErrorMsg('Nama dan email wajib diisi.');
      return;
    }

    const cvDoc = documents.find((d) => d.type === 'cv');
    if (!cvDoc) {
      setErrorMsg('Dokumen CV / Resume wajib diunggah untuk dapat dievaluasi oleh AI.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Document extraction verification
      setScreeningStep('1. Membaca teks dokumen CV, surat lamaran, & sertifikat...');
      await new Promise((r) => setTimeout(r, 600));

      // Step 2: Running Gemini AI ATS Engine
      setScreeningStep('2. Menghubungi Google Gemini AI untuk analisis 5 dimensi kompetensi...');
      
      const aiEvaluation = await evaluateApplicantWithAi({
        job,
        documents,
        applicantName,
        applicantHeadline
      });

      // Step 3: Ranking & Storing Application
      setScreeningStep('3. Menyimpan hasil skrining ke sistem ATS...');
      await new Promise((r) => setTimeout(r, 400));

      const applicationRecord = submitApplication({
        jobId: job.id,
        jobTitle: job.title,
        jobDepartment: job.department,
        companyId: job.companyId,
        companyName: job.companyName,
        userId: currentUser?.id || `guest-${Date.now()}`,
        applicantName,
        applicantEmail,
        applicantPhone,
        applicantHeadline,
        documents,
        aiEvaluation,
        status: 'applied'
      });

      setExistingApplication(applicationRecord);
      setEvaluatedScore(aiEvaluation.overallScore);
      setSubmissionSuccess(true);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}
    } catch (err) {
      console.error('Submission & AI Screening error:', err);
      setErrorMsg('Terjadi kendala saat melakukan evaluasi AI. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Back Button */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Daftar Loker</span>
      </Link>

      {/* JOB HEADER CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
              {job.companyLogo ? (
                <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 text-emerald-400" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-400">{job.companyName}</span>
                {job.companyIndustry && <span className="text-slate-500 text-xs">• {job.companyIndustry}</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{job.title}</h1>
              <p className="text-xs text-slate-400">
                {job.department} • {job.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              {job.type}
            </span>
          </div>

        </div>

        {/* Highlight Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 text-[11px] block">Pengalaman:</span>
            <span className="font-bold text-white block">{job.experienceLevel}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 text-[11px] block">Kisaran Gaji:</span>
            <span className="font-bold text-emerald-400 block">{job.salaryRange || 'Kompetitif'}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 text-[11px] block">Pendidikan Min:</span>
            <span className="font-bold text-white block">{job.minEducation || 'S1 / Sederajat'}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 text-[11px] block">Batas Akhir:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-white block">
                {job.deadline ? new Date(job.deadline).toLocaleDateString('id-ID') : 'Terbuka'}
              </span>
              {job.deadline && (
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${deadlineInfo.badgeClass}`}>
                  {deadlineInfo.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS: JOB DETAILS & APPLICATION FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: JOB DETAILS (7 cols) */}
        <div className="lg:col-span-7 space-y-6 text-xs">
          
          {/* Key Skills */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Keahlian Kunci Wajib (Dinilai oleh AI)
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {job.keySkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-semibold text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Deskripsi Pekerjaan
            </h3>
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Requirements */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Kualifikasi & Persyaratan
            </h3>
            <ul className="space-y-2 text-slate-300 leading-relaxed">
              {job.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Tanggung Jawab Utama
              </h3>
              <ul className="space-y-2 text-slate-300 leading-relaxed">
                {job.responsibilities.map((resp, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* RIGHT: APPLICATION FORM & STATUS (5 cols) */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            
            {/* 1. JIKA SUDAH PERNAH MELAMAR LOKER INI: TAMPILKAN HASIL RIWAYAT */}
            {existingApplication ? (
              <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-emerald-500/40 space-y-5 text-xs shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                      Sudah Dilamar
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">Anda Sudah Melamar Lowongan Ini</h3>
                    <p className="text-slate-400 text-[11px]">
                      Dikirim pada {new Date(existingApplication.appliedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Status Lamaran:</span>
                    <span className={`font-bold capitalize px-2.5 py-1 rounded-lg ${
                      existingApplication.status === 'accepted'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : existingApplication.status === 'rejected'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : existingApplication.status === 'interview'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {existingApplication.status === 'applied'
                        ? 'Terkirim & Menunggu Review'
                        : existingApplication.status === 'screening'
                          ? 'Skrining Berkas AI'
                          : existingApplication.status === 'interview'
                            ? 'Tahap Wawancara'
                            : existingApplication.status === 'accepted'
                              ? 'Selamat! Diterima'
                              : 'Ditolak'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Skor Kesesuaian AI:</span>
                    <span className="font-black text-emerald-400 text-sm">
                      {existingApplication.aiEvaluation?.overallScore || 0}% ({
                        existingApplication.aiEvaluation?.fitLevel === 'Top Match'
                          ? 'Kandidat Unggul'
                          : existingApplication.aiEvaluation?.fitLevel === 'High Match'
                            ? 'Sangat Sesuai'
                            : existingApplication.aiEvaluation?.fitLevel === 'Moderate Match'
                              ? 'Cukup Sesuai'
                              : existingApplication.aiEvaluation?.fitLevel === 'Low Match'
                                ? 'Belum Sesuai'
                                : (existingApplication.aiEvaluation?.overallScore ?? 0) >= 85
                                  ? 'Kandidat Unggul'
                                  : (existingApplication.aiEvaluation?.overallScore ?? 0) >= 70
                                    ? 'Sangat Sesuai'
                                    : (existingApplication.aiEvaluation?.overallScore ?? 0) >= 50
                                      ? 'Cukup Sesuai'
                                      : 'Belum Sesuai'
                      })
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-slate-400">
                    <span>Dokumen Terunggah:</span>
                    <span className="font-semibold text-white">{existingApplication.documents?.length || 1} Berkas PDF/DOC</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02]"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Lihat Hasil Skrining & Riwayat Lamaran</span>
                  </button>

                  <Link
                    href="/user/applications"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs block text-center transition-colors border border-slate-700"
                  >
                    Buka Portal Status Lamaran Saya
                  </Link>
                </div>
              </div>
            ) : deadlineInfo.isExpired ? (
              /* 2. JIKA BATAS WAKTU SUDAH LEWAT & BELUM PERNAH LAMAR */
              <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-rose-500/40 space-y-5 text-xs text-center shadow-2xl relative overflow-hidden">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-md">
                  <Clock className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase tracking-wider">
                    <span>Pendaftaran Ditutup</span>
                  </div>
                  <h3 className="text-base font-bold text-white">Batas Waktu Lamaran Berakhir</h3>
                  <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
                    Mohon maaf, pendaftaran untuk posisi ini di <strong>{job.companyName}</strong> telah ditutup karena telah melewati batas waktu pendaftaran ({job.deadline ? new Date(job.deadline).toLocaleDateString('id-ID') : ''}).
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/jobs"
                    className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                  >
                    <span>Eksplorasi Loker Aktif Lainnya</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : !currentUser ? (
              /* 3. JIKA BELUM LOGIN */
              <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 text-xs text-center shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                  <Lock className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white">Masuk Akun untuk Melamar</h3>
                  <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
                    Anda harus masuk sebagai pelamar terlebih dahulu untuk mengunggah CV dan mendapatkan analisis skor AI di <strong>{job.companyName}</strong>.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <Link
                    href={`/auth?callbackUrl=/jobs/${job.id}`}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02]"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Masuk Akun / Login Pelamar</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/auth?callbackUrl=/jobs/${job.id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs block transition-colors border border-slate-700"
                  >
                    Daftar Akun Baru (Gratis)
                  </Link>
                </div>

                <p className="text-[11px] text-slate-500">
                  Dapat masuk langsung menggunakan Akun Google dalam 1 klik.
                </p>
              </div>
            ) : (!currentUser.profileCompleted && !(currentUser.biodata?.institutionName && (currentUser.biodata?.lastEducation?.includes('SMA') || currentUser.biodata?.lastEducation?.includes('SMK') || currentUser.biodata?.educationMajor))) ? (
              /* 4. JIKA BIODATA BELUM LENGKAP: WAJIBKAN ISI BIODATA DULU */
              <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-amber-500/40 space-y-5 text-xs text-center shadow-2xl relative overflow-hidden">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-md">
                  <UserIcon className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                    <span>Langkah Wajib</span>
                  </div>
                  <h3 className="text-base font-bold text-white">Lengkapi Biodata & Profil Anda</h3>
                  <p className="text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
                    Sebelum dapat mengunggah berkas lamaran dan mengirimkan CV untuk posisi ini di <strong>{job.companyName}</strong>, Anda wajib melengkapi data pribadi dan riwayat pendidikan terlebih dahulu.
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <Link
                    href={`/user/profile?callbackUrl=/jobs/${job.id}`}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02]"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Lengkapi Biodata & Profil Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <p className="text-[11px] text-slate-500">
                  Data biodata akan otomatis tersimpan dan langsung siap digunakan untuk melamar lowongan ini.
                </p>
              </div>
            ) : !submissionSuccess ? (
              /* 4. FORMULIR PENGISIAN LAMARAN & UPLOAD CV */
              <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 text-xs shadow-2xl">
                <form onSubmit={handleApplySubmit} className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Formulir Lamaran Cerdas</h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Unggah CV Anda dan sistem AI Gemini akan langsung mengevaluasi profil Anda untuk tim HR {job.companyName}.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Nama Lengkap: *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Anda"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Email: *</label>
                    <input
                      type="email"
                      required
                      placeholder="email@domain.com"
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">No. WhatsApp/HP:</label>
                    <input
                      type="tel"
                      placeholder="0812xxxxxxxx"
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Multi-Document Uploader */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="font-semibold text-slate-300">Unggah Berkas Dokumen:</label>
                    <DocumentUploader
                      documents={documents}
                      onDocumentsChange={setDocuments}
                    />
                  </div>

                  {/* Submitting Progress Indicator */}
                  {isSubmitting && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 space-y-2 text-[11px]">
                      <div className="flex items-center gap-2 font-bold">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                        <span>Proses Evaluasi AI Sedang Berjalan...</span>
                      </div>
                      <p className="text-slate-300 font-mono text-[10px]">{screeningStep}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Mengevaluasi Berkas...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Lamaran & Skrining AI</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* SUBMISSION SUCCESS CARD */
              <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 text-center shadow-2xl">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Lamaran Berhasil Dikirim!</h4>
                  <p className="text-xs text-slate-300">
                    Berkas Anda telah selesai dianalisis secara instan oleh Gemini AI.
                  </p>
                </div>

                {evaluatedScore !== null && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <span className="text-slate-400">Skor Kecocokan AI Anda:</span>
                    <div className="text-3xl font-black text-emerald-400">{evaluatedScore}%</div>
                    <p className="text-[11px] text-slate-400">
                      Tim HR <strong className="text-white">{job.companyName}</strong> telah menerima evaluasi radar kompetensi Anda.
                    </p>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02]"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Lihat Hasil Skrining & Evaluasi AI</span>
                  </button>

                  <Link
                    href="/user/applications"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs block text-center transition-colors border border-slate-700"
                  >
                    Pantau di Portal Lamaran Saya
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Modal for viewing submitted application */}
      {isModalOpen && existingApplication && (
        <CandidateDetailModal
          application={existingApplication}
          onClose={() => setIsModalOpen(false)}
          isApplicantView={true}
        />
      )}

    </div>
  );
}
