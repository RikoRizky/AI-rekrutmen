'use client';

import React, { useState } from 'react';
import { Application, ApplicationStatus, AiEvaluationResult } from '@/lib/types';
import { updateApplicationStatus, updateApplicationAiEvaluation, getSettings, getJobById } from '@/lib/storage';
import { evaluateApplicantWithAi } from '@/lib/ai-evaluator';
import AiScoreBadge from './AiScoreBadge';
import AiAnalysisRadar from './AiAnalysisRadar';
import {
  X,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  FileText,
  Mail,
  Phone,
  Calendar,
  Save,
  MessageSquareQuote,
  ShieldCheck,
  Building,
  RefreshCw,
  Loader2,
  Check,
  Award,
  HelpCircle,
  Target,
  FileSearch
} from 'lucide-react';

interface CandidateDetailModalProps {
  application: Application | null;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export default function CandidateDetailModal({
  application,
  onClose,
  onStatusUpdated
}: CandidateDetailModalProps) {
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>(
    application?.status || 'applied'
  );
  const [hrNotes, setHrNotes] = useState(application?.hrNotes || '');
  const [activeTab, setActiveTab] = useState<'ai_analysis' | 'documents' | 'interview_guide'>('ai_analysis');
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Live AI Re-analyze state
  const [currentEvaluation, setCurrentEvaluation] = useState<AiEvaluationResult | null>(
    application?.aiEvaluation || null
  );
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [reanalyzeMsg, setReanalyzeMsg] = useState<string | null>(null);

  if (!application) return null;

  const aiEvaluation = currentEvaluation || application.aiEvaluation;

  const handleSave = () => {
    setIsSaving(true);
    updateApplicationStatus(application.id, currentStatus, hrNotes);
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      if (onStatusUpdated) onStatusUpdated();
      setTimeout(() => setSavedSuccess(false), 2000);
    }, 300);
  };

  const handleReanalyzeWithGemini = async () => {
    setIsReanalyzing(true);
    setReanalyzeMsg('Menghubungkan ke Google Gemini AI Engine...');

    try {
      const settings = getSettings();
      const job = getJobById(application.jobId);
      if (!job) throw new Error('Informasi lowongan tidak ditemukan');

      setReanalyzeMsg('Google Gemini sedang menelaah CV & kualifikasi kandidat...');

      const newEval = await evaluateApplicantWithAi({
        job,
        documents: application.documents,
        applicantName: application.applicantName,
        applicantHeadline: application.applicantEmail,
        geminiApiKey: settings.geminiApiKey,
        preferredModel: settings.aiModel || 'gemini-3.6-flash'
      });

      setCurrentEvaluation(newEval);
      updateApplicationAiEvaluation(application.id, newEval);
      setReanalyzeMsg('Analisis Google Gemini AI Selesai!');

      if (onStatusUpdated) {
        onStatusUpdated();
      }

      setTimeout(() => setReanalyzeMsg(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menjalankan analisis AI';
      setReanalyzeMsg(`Error: ${msg}`);
      setTimeout(() => setReanalyzeMsg(null), 4000);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'accepted':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Diterima / Hired</span>;
      case 'interview':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Jadwal Interview</span>;
      case 'screening':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">Lolos Screening Berkas</span>;
      case 'rejected':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">Ditolak / Not Fit</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">Menunggu Review</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
              {application.applicantName.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {application.applicantName}
                </h3>
                {getStatusBadge(application.status)}
              </div>
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">
                Melamar posisi: {application.jobTitle}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {application.applicantEmail}
                </span>
                {application.applicantPhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {application.applicantPhone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Lamar: {new Date(application.appliedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top AI Score Hero Card with Live Re-analyze Button */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-teal-900/10 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-600 text-white min-w-[76px] shadow-md">
                <span className="text-2xl font-black">{aiEvaluation.overallScore}%</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">AI Score</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <AiScoreBadge
                    score={aiEvaluation.overallScore}
                    fitLevel={aiEvaluation.fitLevel}
                    size="sm"
                    isRealAi={aiEvaluation.isRealAi}
                  />
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                    Rekomendasi: {aiEvaluation.recommendation.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 max-w-xl">
                  {aiEvaluation.recommendationReason}
                </p>
              </div>
            </div>

            {/* Re-analyze Button */}
            <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto shrink-0">
              <button
                onClick={handleReanalyzeWithGemini}
                disabled={isReanalyzing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md transition active:scale-95 disabled:opacity-50"
              >
                {isReanalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menganalisis Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ Analisis Ulang dengan Gemini AI</span>
                  </>
                )}
              </button>

              {reanalyzeMsg && (
                <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 animate-in fade-in">
                  {reanalyzeMsg}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-6 bg-white dark:bg-slate-900 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('ai_analysis')}
            className={`py-3 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'ai_analysis'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Hasil Analisis AI
          </button>
          <button
            onClick={() => setActiveTab('interview_guide')}
            className={`py-3 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'interview_guide'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquareQuote className="w-4 h-4" /> Panduan Wawancara Khusus ({aiEvaluation.suggestedInterviewQuestions?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'documents'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Berkas Dokumen ({application.documents.length})
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: AI ANALYSIS */}
          {activeTab === 'ai_analysis' && (
            <div className="space-y-6">
              
              {/* Executive Summary */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-xs uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" /> Ringkasan Eksekutif AI
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {aiEvaluation.executiveSummary}
                </p>
              </div>

              {/* Radar Breakdown Component */}
              <AiAnalysisRadar evaluation={aiEvaluation} />

              {/* Strengths & Gaps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Strengths */}
                <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/30 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider mb-3">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Kekuatan Utama (Strengths)
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {aiEvaluation.strengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Gaps */}
                <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-950/60 bg-amber-50/30 dark:bg-amber-950/20">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Celah Kompetensi / Gaps
                  </div>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {aiEvaluation.gaps.map((g, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERVIEW GUIDE */}
          {activeTab === 'interview_guide' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
                <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200 flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-purple-600" /> Panduan Wawancara Khusus Berdasarkan CV Kandidat
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Pertanyaan-pertanyaan berikut disusun secara dinamis oleh Google Gemini AI untuk menguji keabsahan riwayat proyek pada CV dan memverifikasi celah keahlian:
                </p>
              </div>

              {aiEvaluation.detailedQuestions && aiEvaluation.detailedQuestions.length > 0 ? (
                <div className="space-y-4">
                  {aiEvaluation.detailedQuestions.map((dq, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                          {idx + 1}
                        </div>
                        <div className="space-y-1 flex-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                            &quot;{dq.question}&quot;
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-0.5 flex items-center gap-1">
                            <Target className="w-3.5 h-3.5" /> Alasan Penggalian CV:
                          </span>
                          <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {dq.context}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Kriteria Jawaban Ideal:
                          </span>
                          <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {dq.targetCriteria}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {aiEvaluation.suggestedInterviewQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">
                            {q}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1.5">
                            Tujuan: Menggali kedalaman pemecahan masalah dan kecocokan budaya kerja.
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                {application.documents.map((doc, idx) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      selectedDocIndex === idx
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                    <span>{doc.type.toUpperCase()}: {doc.name}</span>
                  </button>
                ))}
              </div>

              {application.documents[selectedDocIndex] ? (
                <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono border border-slate-800 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pb-2 mb-2 border-b border-slate-800">
                    <span>{application.documents[selectedDocIndex].name}</span>
                    <span>{(application.documents[selectedDocIndex].size / 1024).toFixed(1)} KB</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                    {application.documents[selectedDocIndex].extractedText || '(Tidak ada teks terbaca)'}
                  </pre>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Tidak ada dokumen.</p>
              )}
            </div>
          )}

          {/* HR Decision & Notes Section */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" /> Keputusan & Catatan Internal HRD
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Status Lamaran
                </label>
                <select
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value as ApplicationStatus)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                >
                  <option value="applied">Menunggu Review (Applied)</option>
                  <option value="screening">Lolos Screening Berkas</option>
                  <option value="interview">Panggil Wawancara (Interview)</option>
                  <option value="accepted">Diterima Bekerja (Hired)</option>
                  <option value="rejected">Tolak Lamaran (Rejected)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Catatan Internal Rekruter
                </label>
                <input
                  type="text"
                  value={hrNotes}
                  onChange={(e) => setHrNotes(e.target.value)}
                  placeholder="Contoh: Sangat menjanjikan di Next.js, jadwal interview Kamis..."
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500">
            {savedSuccess && (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Status & Catatan berhasil diperbarui!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              Tutup
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
