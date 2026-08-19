'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Job, DocumentAttachment, User } from '@/lib/types';
import { getJobById, getCurrentUser, submitApplication, getSettings, initializeStorage } from '@/lib/storage';
import { evaluateApplicantWithAi } from '@/lib/ai-evaluator';
import DocumentUploader from '@/components/DocumentUploader';
import AiScoreBadge from '@/components/AiScoreBadge';
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
  ShieldCheck
} from 'lucide-react';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
      setApplicantName(user.name);
      setApplicantEmail(user.email);
      setApplicantPhone(user.phone || '');
      setApplicantHeadline(user.headline || '');
    }
  }, [jobId]);

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Lowongan tidak ditemukan</h2>
        <p className="text-xs text-slate-500">Lowongan yang Anda cari mungkin telah ditutup atau tautan tidak valid.</p>
        <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Lowongan
        </Link>
      </div>
    );
  }

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!applicantName.trim() || !applicantEmail.trim()) {
      setErrorMsg('Harap lengkapi nama dan email pelamar.');
      return;
    }

    const hasCv = documents.some((d) => d.type === 'cv');
    if (!hasCv) {
      setErrorMsg('Harap unggah berkas CV / Resume Anda terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1
      setScreeningStep('Mengekstrak dan membaca seluruh isi dokumen berkas...');
      await new Promise((r) => setTimeout(r, 600));

      // Step 2
      setScreeningStep('Google Gemini AI sedang menelaah kompetensi teknis, pengalaman kerja, & kualifikasi berkas...');
      const settings = getSettings();
      const evaluation = await evaluateApplicantWithAi({
        job,
        documents,
        applicantName,
        applicantHeadline,
        geminiApiKey: settings.geminiApiKey,
        preferredModel: settings.aiModel || 'gemini-3.6-flash'
      });

      // Step 3
      setScreeningStep('Menyusun skor relevansi dan ringkasan eksekutif AI...');
      await new Promise((r) => setTimeout(r, 600));

      // Save application
      const newApp = submitApplication({
        jobId: job.id,
        jobTitle: job.title,
        jobDepartment: job.department,
        userId: currentUser?.id || `guest-${Date.now()}`,
        applicantName,
        applicantEmail,
        applicantPhone,
        documents,
        aiEvaluation: evaluation
      });

      setEvaluatedScore(evaluation.overallScore);
      setSubmissionSuccess(true);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses lamaran.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-indigo-600 transition flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Daftar Lowongan
        </Link>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{job.title}</span>
      </div>

      {/* SUCCESS BANNER MODAL IF SUBMITTED */}
      {submissionSuccess && (
        <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/40 text-white shadow-2xl space-y-6 animate-in zoom-in-95">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Lamaran Berhasil Terkirim & Dianalisis AI!
                </span>
                <h3 className="text-2xl font-extrabold mt-1">
                  Terima kasih, {applicantName}!
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Sistem AI telah selesai mengekstrak dokumen berkas Anda dan memasukkan profil Anda ke dalam daftar peringkat pelamar di dashboard HRD.
                </p>
              </div>
            </div>

            {evaluatedScore !== null && (
              <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-900/90 border border-slate-700 text-center min-w-[140px]">
                <span className="text-3xl font-black text-emerald-400">{evaluatedScore}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  AI Relevance Score
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Tim HRD akan mereview peringkat kecocokan Anda untuk tahapan wawancara selanjutnya.
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/user/applications"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg"
              >
                <FileCheck className="w-4 h-4" /> Lihat Status Lamaran Saya
              </Link>
              <Link
                href="/"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                Cari Lowongan Lain
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Job Specs (Left) & Application Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Job Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {job.department}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {job.type}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                {job.title}
              </h1>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Lokasi</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {job.location}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Pengalaman</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500" /> {job.experienceLevel}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Pendidikan</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5 truncate" title={job.minEducation}>
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-500" /> {job.minEducation.split('/')[0]}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Estimasi Gaji</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5 truncate">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> {job.salaryRange.split('/')[0]}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Deskripsi Pekerjaan
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {job.description}
              </p>
            </div>

            {/* Key Skills */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Keahlian Kunci yang Dicari AI (Key Skills)
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.keySkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Kualifikasi & Persyaratan
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Tanggung Jawab Utama
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  {job.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Interactive Application Form & Document Uploader */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-28">
            
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Formulir Pendaftaran Online
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Lamar Posisi Ini
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Unggah berkas CV dan dokumen pendukung. AI kami akan memproses berkas Anda secara instan.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitApplication} className="space-y-5">
              
              {/* Applicant Info Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap Pelamar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor WhatsApp / HP
                    </label>
                    <input
                      type="tel"
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      placeholder="08123456789"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Headline Profesional Singkat
                  </label>
                  <input
                    type="text"
                    value={applicantHeadline}
                    onChange={(e) => setApplicantHeadline(e.target.value)}
                    placeholder="Contoh: Frontend Developer dengan 3 tahun pengalaman di React"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Upload Documents Component */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Unggah Berkas Pendukung:
                </label>
                <DocumentUploader
                  documents={documents}
                  onDocumentsChange={setDocuments}
                />
              </div>

              {/* AI Processing status banner when submitting */}
              {isSubmitting && (
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 space-y-2 text-center">
                  <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sedang Memproses Berkas...</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {screeningStep}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menganalisis dengan AI...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Lamaran & Mulai Screening AI</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400 leading-tight">
                🔒 Berkas Anda dianalisis secara aman oleh AI Engine untuk evaluasi relevansi posisi.
              </p>
            </form>

          </div>
        </div>

      </div>

    </div>
  );
}
