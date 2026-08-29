'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { User, DocumentAttachment, Job } from '@/lib/types';
import {
  getCurrentUser,
  initializeStorage,
  getAllJobs,
  getAllApplications,
  submitApplication,
  updateUserBiodata,
  getCompanyScaleCategory,
  REFRESH_EVENT
} from '@/lib/storage';
import { calculateJobRecommendations, JobMatchRecommendation, mapScoreToMatchLevel } from '@/lib/ai-job-matcher';
import { evaluateApplicantWithAi } from '@/lib/ai-evaluator';
import { Application } from '@/lib/types';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import {
  Sparkles,
  Flame,
  Building2,
  Store,
  Factory,
  MapPin,
  Banknote,
  GraduationCap,
  ExternalLink,
  CheckCircle2,
  CheckCircle,
  Send,
  Loader2,
  FileText,
  ArrowLeft,
  ArrowRight,
  Filter,
  RefreshCw,
  Search,
  Eye
} from 'lucide-react';

function RecommendationsContent() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<DocumentAttachment[]>([]);
  const [recommendations, setRecommendations] = useState<JobMatchRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter state
  const [scaleFilter, setScaleFilter] = useState<'all' | 'UMK' | 'Perusahaan' | 'Industri'>('all');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);

  const loadData = () => {
    initializeStorage();
    const user = getCurrentUser();
    if (!user) {
      router.push('/auth?callbackUrl=/user/recommendations');
      return;
    }
    setCurrentUser(user);

    // Existing applied jobs
    const existingApps = getAllApplications().filter(
      (a) => a.userId === user.id || a.applicantEmail.toLowerCase() === user.email.toLowerCase()
    );
    const appliedIds = existingApps.map((a) => a.jobId);
    setAppliedJobIds(appliedIds);

    // Resolve candidate documents: from user biodata OR past applications
    let userDocs = user.biodata?.documents && user.biodata.documents.length > 0 ? user.biodata.documents : [];
    if (userDocs.length === 0) {
      const prevAppWithDocs = existingApps.find((a) => a.documents && a.documents.length > 0);
      if (prevAppWithDocs?.documents) {
        userDocs = prevAppWithDocs.documents;
        if (user.biodata) {
          updateUserBiodata(user.id, { ...user.biodata, documents: userDocs });
        }
      }
    }
    setDocuments(userDocs);

    // Run AI Match calculation
    runMatch(user, userDocs, appliedIds, existingApps);
  };

  const runMatch = async (user: User, docs: DocumentAttachment[], appliedIds: string[], existingApps: Application[]) => {
    setIsAnalyzing(true);
    try {
      const allActiveJobs = getAllJobs().filter((j) => j.status === 'active' || !j.status);
      const recs = await calculateJobRecommendations({
        jobs: allActiveJobs,
        documents: docs,
        biodata: user.biodata,
        user,
        existingApplications: existingApps,
        existingAppliedJobIds: appliedIds
      });
      setRecommendations(recs);
    } catch (err) {
      console.error('Error running AI job recommendations:', err);
    } finally {
      setIsAnalyzing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    window.addEventListener(REFRESH_EVENT, loadData);
    return () => window.removeEventListener(REFRESH_EVENT, loadData);
  }, []);

  const handleOneClickApply = async (rec: JobMatchRecommendation) => {
    if (!currentUser) return;
    const targetJob = rec.job;

    // Resolve effective documents for application
    let effectiveDocs = documents && documents.length > 0 ? documents : (currentUser.biodata?.documents || []);
    if (effectiveDocs.length === 0) {
      const allApps = getAllApplications();
      const prevApp = allApps.find(
        (a) => (a.userId === currentUser.id || a.applicantEmail.toLowerCase() === currentUser.email.toLowerCase()) &&
          a.documents && a.documents.length > 0
      );
      if (prevApp?.documents) {
        effectiveDocs = prevApp.documents;
        setDocuments(effectiveDocs);
      }
    }

    const cvDoc = effectiveDocs.find((d) => d.type === 'cv') || effectiveDocs[0];
    if (!cvDoc) {
      alert('Harap unggah berkas CV / Resume Anda di halaman Profil terlebih dahulu sebelum mengirim lamaran.');
      router.push('/user/profile');
      return;
    }

    setApplyingJobId(targetJob.id);
    setSuccessMsg(null);

    try {
      // 1. Run AI Applicant Screening
      const aiEvaluation = await evaluateApplicantWithAi({
        job: targetJob,
        documents: effectiveDocs,
        applicantName: currentUser.biodata?.fullName || currentUser.name,
        applicantHeadline: currentUser.headline || `${currentUser.biodata?.lastEducation || 'S1'} ${currentUser.biodata?.educationMajor || ''}`
      });

      // 2. Submit Application
      submitApplication({
        jobId: targetJob.id,
        jobTitle: targetJob.title,
        jobDepartment: targetJob.department,
        companyId: targetJob.companyId,
        companyName: targetJob.companyName,
        userId: currentUser.id,
        applicantName: currentUser.biodata?.fullName || currentUser.name,
        applicantEmail: currentUser.email,
        applicantPhone: currentUser.biodata?.phone || currentUser.phone || '',
        applicantHeadline: currentUser.headline || `${currentUser.biodata?.lastEducation || 'S1'} ${currentUser.biodata?.educationMajor || ''}`,
        applicantBiodata: currentUser.biodata ? { ...currentUser.biodata, documents: effectiveDocs } : currentUser.biodata,
        documents: effectiveDocs,
        aiEvaluation,
        status: 'applied'
      });

      const updatedApplied = [...appliedJobIds, targetJob.id];
      setAppliedJobIds(updatedApplied);

      const score = aiEvaluation.overallScore;
      const level = mapScoreToMatchLevel(score);
      const reason = aiEvaluation.recommendationReason || aiEvaluation.executiveSummary || rec.recommendationReason;

      setRecommendations((prev) =>
        prev.map((r) =>
          r.job.id === targetJob.id
            ? {
                ...r,
                isApplied: true,
                matchScore: score,
                matchLevel: level,
                recommendationReason: reason,
                matchedSkills: aiEvaluation.matchedSkills && aiEvaluation.matchedSkills.length > 0 ? aiEvaluation.matchedSkills : r.matchedSkills,
                missingSkills: aiEvaluation.missingSkills && aiEvaluation.missingSkills.length > 0 ? aiEvaluation.missingSkills : r.missingSkills
              }
            : r
        )
      );

      // Trigger Confetti Celebration
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}

      setSuccessMsg(`🎉 Berhasil! Berkas lamaran Anda telah dikirim langsung ke ${targetJob.companyName} (${targetJob.title}).`);
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err) {
      console.error('One click apply error:', err);
      alert('Gagal mengirim lamaran ke perusahaan. Silakan coba kembali.');
    } finally {
      setApplyingJobId(null);
    }
  };

  const hasCv = documents.some((d) => d.type === 'cv');

  // Filter recommendations based on user selections
  const filteredRecs = recommendations.filter((rec) => {
    const scale = getCompanyScaleCategory(undefined, rec.job.companyName, rec.job.companyIndustry);
    const matchScale = scaleFilter === 'all' || scale === scaleFilter;
    const matchScore = rec.matchScore >= minScoreFilter;
    return matchScale && matchScore;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Smart Recommendation Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Rekomendasi Perusahaan & Lowongan Cocok
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Sistem AI mencocokkan dokumen CV, surat lamaran, dan sertifikat yang Anda unggah di profil dengan seluruh lowongan aktif dan mengurutkannya dari persentase skor kecocokan tertinggi.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadData}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs border border-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>Pindai Ulang AI</span>
          </button>

          <Link
            href="/user/profile"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all hover:scale-105"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Kelola Berkas CV</span>
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in shadow-lg">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Filter Bar */}
      {hasCv && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-300">Filter Rekomendasi:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Scale Filter */}
            <select
              value={scaleFilter}
              onChange={(e) => setScaleFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Skala Perusahaan</option>
              <option value="UMK">🏪 Khusus UMK</option>
              <option value="Perusahaan">🏢 Khusus Perusahaan (PT)</option>
              <option value="Industri">🏭 Khusus Industri & Manufaktur</option>
            </select>

            {/* Match Score Filter */}
            <select
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value={0}>Semua Persentase Skor</option>
              <option value={80}>🔥 Sangat Cocok (&ge; 80%)</option>
              <option value={60}>✓ Cocok (&ge; 60%)</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Content */}
      {isLoading || isAnalyzing ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mx-auto" />
          <h3 className="font-bold text-white text-base">Sedang Menganalisis Dokumen CV & Menghitung Skor Kecocokan...</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            AI Gemini ATS sedang membaca kualifikasi berkas Anda dan membandingkannya secara multi-dimensi dengan seluruh lowongan mitra.
          </p>
        </div>
      ) : !hasCv ? (
        /* Empty State: CV Not Uploaded */
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4 max-w-2xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Belum Ada Dokumen CV yang Diunggah</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Untuk mendapatkan saran perusahaan dan lowongan yang akurat dengan persentase kecocokan AI, silakan unggah berkas CV / Resume Anda di halaman profil.
          </p>
          <Link
            href="/user/profile"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all hover:scale-105"
          >
            <span>Unggah CV di Halaman Profil</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : filteredRecs.length > 0 ? (
        /* Recommendation Cards Grid */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Menemukan <strong>{filteredRecs.length}</strong> lowongan kerja yang relevan dengan profil berkas Anda
            </span>
          </div>

          <div className="space-y-4">
            {filteredRecs.map((rec, idx) => {
              const targetJob = rec.job;
              const scale = getCompanyScaleCategory(undefined, targetJob.companyName, targetJob.companyIndustry);
              const isApplyingThis = applyingJobId === targetJob.id;
              const isTopMatch = idx === 0 && scaleFilter === 'all';

              return (
                <div
                  key={targetJob.id}
                  className={`p-6 sm:p-7 rounded-3xl transition-all relative ${
                    isTopMatch
                      ? 'bg-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-950/40'
                      : 'bg-slate-900 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Tag for Highest Match */}
                  {isTopMatch && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] uppercase tracking-wider mb-4 shadow-md">
                      <Flame className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Rekomendasi Tertinggi (#1 Top Match)</span>
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    
                    {/* Left: Job & Company Info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <img
                        src={targetJob.companyLogo || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=120&auto=format&fit=crop&q=60'}
                        alt={targetJob.companyName}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-2xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                      />
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-300 text-xs sm:text-sm truncate">
                            {targetJob.companyName}
                          </span>

                          {/* Scale Badge */}
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${
                            scale === 'UMK'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : scale === 'Industri'
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {scale === 'UMK' ? <Store className="w-3 h-3" /> : scale === 'Industri' ? <Factory className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                            <span>{scale}</span>
                          </span>

                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                            {targetJob.type}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-black text-white hover:text-emerald-400 transition-colors truncate">
                          {targetJob.title}
                        </h3>

                        {/* Quick Pills */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{targetJob.location}</span>
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{targetJob.salaryRange || 'Gaji Kompetitif'}</span>
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                            <span>Min. {targetJob.minEducation || 'SMA/SMK/S1'}</span>
                          </span>
                        </div>

                        {/* Matched Skills */}
                        {rec.matchedSkills.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-2">
                            <span className="text-[11px] text-slate-400 font-semibold">Keahlian Cocok:</span>
                            {rec.matchedSkills.map((s, i) => (
                              <span key={i} className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-[11px] font-semibold border border-emerald-500/20">
                                ✓ {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* AI Recommendation Reason */}
                        <p className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 mt-2 leading-relaxed">
                          💡 <strong className="text-emerald-400 font-semibold">Analisis Kecocokan AI:</strong> {rec.recommendationReason}
                        </p>
                      </div>
                    </div>

                    {/* Right: Match Score & Action Button */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3.5 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                      
                      {/* Match Score Badge */}
                      <div className="text-left lg:text-right">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-950/20">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          <span className="text-base font-black">{rec.matchScore}%</span>
                          <span className="text-[11px] font-bold uppercase tracking-wider">
                            {rec.matchLevel}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/jobs/${targetJob.id}`}
                          className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                          title="Lihat detail lengkap lowongan"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {rec.isApplied ? (
                          <div className="px-5 py-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Lamaran Terkirim</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOneClickApply(rec)}
                            disabled={isApplyingThis}
                            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-xl shadow-emerald-950/50 flex items-center gap-2 disabled:opacity-50 hover:scale-105"
                          >
                            {isApplyingThis ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Mengirim...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                <span>Kirim ke Perusahaan</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty Filter State */
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <p className="font-semibold text-white text-sm">Tidak ada lowongan yang sesuai dengan filter.</p>
          <p className="text-xs text-slate-400">Coba ubah filter skala perusahaan atau turunkan batas minimal skor.</p>
          <button
            type="button"
            onClick={() => {
              setScaleFilter('all');
              setMinScoreFilter(0);
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs transition-colors"
          >
            Reset Filter
          </button>
        </div>
      )}

    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center text-xs text-slate-400">Memuat rekomendasi lowongan...</div>}>
      <RecommendationsContent />
    </Suspense>
  );
}
