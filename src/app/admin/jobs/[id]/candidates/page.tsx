'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Job, Application, FitLevel, ApplicationStatus } from '@/lib/types';
import { getJobById, getApplicationsForJob, updateApplicationStatus, updateApplicationAiEvaluation, getSettings, initializeStorage, REFRESH_EVENT } from '@/lib/storage';
import { evaluateApplicantWithAi } from '@/lib/ai-evaluator';
import AiScoreBadge from '@/components/AiScoreBadge';
import CandidateDetailModal from '@/components/CandidateDetailModal';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Mail,
  Phone,
  Calendar,
  Eye,
  Award,
  Crown,
  ChevronDown,
  Building,
  Check,
  Loader2,
  RefreshCw,
  Zap
} from 'lucide-react';

export default function CandidatesRankingPage() {
  const params = useParams();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Application[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [fitFilter, setFitFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Batch AI Re-analysis
  const [isBatchReanalyzing, setIsBatchReanalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<string | null>(null);

  const loadData = () => {
    if (jobId) {
      setJob(getJobById(jobId));
      // getApplicationsForJob automatically sorts descending by aiEvaluation.overallScore
      const rankedCandidates = getApplicationsForJob(jobId);
      setCandidates(rankedCandidates);
    }
  };

  useEffect(() => {
    initializeStorage();
    loadData();
    window.addEventListener(REFRESH_EVENT, loadData);
    return () => window.removeEventListener(REFRESH_EVENT, loadData);
  }, [jobId]);

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Lowongan tidak ditemukan</h2>
        <Link href="/admin" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard HRD
        </Link>
      </div>
    );
  }

  // Filter candidates
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.applicantEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.aiEvaluation?.matchedSkills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFit =
      fitFilter === 'all' || c.aiEvaluation?.fitLevel === fitFilter;

    const matchesStatus =
      statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesFit && matchesStatus;
  });

  const handleQuickStatusChange = (appId: string, status: ApplicationStatus) => {
    updateApplicationStatus(appId, status);
  };

  const handleBatchReanalyze = async () => {
    if (candidates.length === 0) return;
    setIsBatchReanalyzing(true);
    const settings = getSettings();

    try {
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        setBatchProgress(`Menganalisis pelamar (${i + 1}/${candidates.length}): ${candidate.applicantName}...`);

        try {
          const newEval = await evaluateApplicantWithAi({
            job,
            documents: candidate.documents,
            applicantName: candidate.applicantName,
            applicantHeadline: candidate.applicantEmail,
            geminiApiKey: settings.geminiApiKey,
            preferredModel: settings.aiModel || 'gemini-3.6-flash'
          });

          updateApplicationAiEvaluation(candidate.id, newEval);
        } catch (e) {
          console.error(`Error analyzing candidate ${candidate.applicantName}:`, e);
        }
      }

      setBatchProgress('Seluruh pelamar berhasil dianalisis ulang dengan Google Gemini AI!');
      loadData();
      setTimeout(() => setBatchProgress(null), 4000);
    } catch (err: unknown) {
      console.error('Batch evaluation error:', err);
      setBatchProgress('Terjadi kendala saat analisis batch.');
      setTimeout(() => setBatchProgress(null), 3000);
    } finally {
      setIsBatchReanalyzing(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Peringkat', 'Nama Pelamar', 'Email', 'No HP', 'Skor AI (%)', 'Tingkat Relevansi', 'Rekomendasi AI', 'Model AI', 'Status', 'Tanggal Lamar'];
    const rows = filteredCandidates.map((c, idx) => [
      idx + 1,
      `"${c.applicantName}"`,
      `"${c.applicantEmail}"`,
      `"${c.applicantPhone || '-'}"`,
      c.aiEvaluation?.overallScore || 0,
      `"${c.aiEvaluation?.fitLevel || '-'}"`,
      `"${c.aiEvaluation?.recommendation || '-'}"`,
      `"${c.aiEvaluation?.modelUsed || 'Gemini AI'}"`,
      `"${c.status}"`,
      `"${new Date(c.appliedDate).toLocaleDateString('id-ID')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ranking-gemini-ai-${job.title.toLowerCase().replace(/\s+/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/admin" className="hover:text-indigo-600 transition flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard ATS
        </Link>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 font-medium">{job.title}</span>
        <span>/</span>
        <span className="text-indigo-600 font-bold">Perangkingan AI Pelamar</span>
      </div>

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {job.department}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {candidates.length} Total Pelamar Terdaftar
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" /> Google Gemini AI Engine
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black">
            Perangkingan AI: {job.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Sistem menganalisis berkas CV pelamar secara menyeluruh menggunakan <strong>Google Gemini AI</strong> untuk mengurutkan kandidat secara objektif dan akurat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleBatchReanalyze}
            disabled={isBatchReanalyzing || candidates.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            {isBatchReanalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Batch AI...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>⚡ Analisis Ulang Semua dengan Gemini AI</span>
              </>
            )}
          </button>

          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition active:scale-95"
          >
            <Download className="w-4 h-4" /> Unduh Laporan CSV
          </button>
        </div>
      </div>

      {/* Batch progress banner */}
      {batchProgress && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          {isBatchReanalyzing && <Loader2 className="w-4 h-4 animate-spin shrink-0 text-indigo-600" />}
          <span>{batchProgress}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pelamar atau kata kunci skill..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>

          <select
            value={fitFilter}
            onChange={(e) => setFitFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-hidden"
          >
            <option value="all">Semua Skor AI</option>
            <option value="Top Match">Top Match (&ge; 85%)</option>
            <option value="High Match">High Match (70 - 84%)</option>
            <option value="Moderate Match">Moderate Match (50 - 69%)</option>
            <option value="Low Match">Low Match (&lt; 50%)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-hidden"
          >
            <option value="all">Semua Status</option>
            <option value="applied">Applied (Baru)</option>
            <option value="screening">Lolos Screening</option>
            <option value="interview">Wawancara</option>
            <option value="accepted">Diterima (Hired)</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Ranked Candidates List */}
      <div className="space-y-4">
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map((candidate, index) => {
            const isFirst = index === 0 && candidate.aiEvaluation?.overallScore >= 80;
            const rankNumber = index + 1;
            const { aiEvaluation } = candidate;

            return (
              <div
                key={candidate.id}
                className={`group relative p-6 rounded-3xl border transition-all duration-300 overflow-hidden ${
                  isFirst
                    ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-500/5 via-white to-indigo-500/5 dark:from-emerald-950/20 dark:via-slate-900 dark:to-indigo-950/20 shadow-lg'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/40 shadow-xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  {/* Left: Rank # & Candidate Info */}
                  <div className="flex items-start gap-4">
                    
                    {/* Rank Badge */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-sm ${
                          rankNumber === 1
                            ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 ring-2 ring-amber-400/40'
                            : rankNumber === 2
                            ? 'bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-900 border border-slate-300'
                            : rankNumber === 3
                            ? 'bg-gradient-to-tr from-amber-700 to-amber-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {rankNumber === 1 ? <Crown className="w-6 h-6 text-slate-950" /> : `#${rankNumber}`}
                      </div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 mt-1">
                        Peringkat {rankNumber}
                      </span>
                    </div>

                    {/* Candidate Identity */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                          {candidate.applicantName}
                        </h3>

                        <AiScoreBadge
                          score={aiEvaluation.overallScore}
                          fitLevel={aiEvaluation.fitLevel}
                          size="sm"
                          isRealAi={aiEvaluation.isRealAi}
                        />

                        {/* Recommendation pill */}
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                          {aiEvaluation.recommendation.replace('_', ' ')}
                        </span>

                        {aiEvaluation.modelUsed && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {aiEvaluation.modelUsed}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> {candidate.applicantEmail}
                        </span>
                        {candidate.applicantPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" /> {candidate.applicantPhone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Dilamar: {new Date(candidate.appliedDate).toLocaleDateString('id-ID')}
                        </span>
                        <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium">
                          <FileText className="w-3.5 h-3.5" /> {candidate.documents.length} Dokumen
                        </span>
                      </div>

                      {/* AI Executive Summary Snippet */}
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl pt-1">
                        {aiEvaluation.executiveSummary}
                      </p>

                      {/* Strengths & Missing Skills Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {aiEvaluation.matchedSkills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                          >
                            <Check className="w-3 h-3 text-emerald-600" /> {skill}
                          </span>
                        ))}

                        {aiEvaluation.missingSkills.slice(0, 2).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                          >
                            × {skill} (Kurang)
                          </span>
                        ))}

                        {aiEvaluation.additionalSkills && aiEvaluation.additionalSkills.slice(0, 2).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20"
                          >
                            + {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Score Breakdown & CTA */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-slate-800">
                    
                    {/* 4 Pillars Quick Mini Pills */}
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-right font-medium text-slate-600 dark:text-slate-300 w-full sm:w-auto">
                      <div className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-between gap-2">
                        <span className="text-slate-400">Teknis:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{aiEvaluation.technicalScore}%</span>
                      </div>
                      <div className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-between gap-2">
                        <span className="text-slate-400">Pengalaman:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{aiEvaluation.experienceScore}%</span>
                      </div>
                      <div className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-between gap-2">
                        <span className="text-slate-400">Pendidikan:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{aiEvaluation.educationScore}%</span>
                      </div>
                      <div className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-between gap-2">
                        <span className="text-slate-400">Motivasi:</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">{aiEvaluation.motivationScore}%</span>
                      </div>
                    </div>

                    {/* Quick Status Selector & Detail Modal Button */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={candidate.status}
                        onChange={(e) => handleQuickStatusChange(candidate.id, e.target.value as ApplicationStatus)}
                        className="px-2.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-hidden"
                      >
                        <option value="applied">Status: Applied</option>
                        <option value="screening">Lolos Screening</option>
                        <option value="interview">Wawancara</option>
                        <option value="accepted">Diterima</option>
                        <option value="rejected">Tolak</option>
                      </select>

                      <button
                        onClick={() => setSelectedCandidate(candidate)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition active:scale-95 shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Analisis AI & Berkas</span>
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Tidak ada pelamar yang cocok dengan filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Coba ubah filter skor atau status untuk melihat kandidat lainnya.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFitFilter('all');
                setStatusFilter('all');
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Candidate Dossier Detail Modal */}
      {selectedCandidate && (
        <CandidateDetailModal
          application={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          onStatusUpdated={loadData}
        />
      )}

    </div>
  );
}
