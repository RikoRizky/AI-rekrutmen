'use client';

import React, { useState, useEffect } from 'react';
import { AppSettings } from '@/lib/types';
import { getSettings, updateSettings, resetDataToSeed, initializeStorage } from '@/lib/storage';
import Link from 'next/link';
import {
  Settings,
  Sparkles,
  Key,
  Cpu,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Loader2,
  Check
} from 'lucide-react';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-3.6-flash');
  const [minPassingScore, setMinPassingScore] = useState(70);
  const [autoScreening, setAutoScreening] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Connection Test State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    model?: string;
  } | null>(null);

  useEffect(() => {
    initializeStorage();
    const s = getSettings();
    setApiKey(s.geminiApiKey || '');
    setModel(s.aiModel || 'gemini-3.6-flash');
    setMinPassingScore(s.minPassingScore || 70);
    setAutoScreening(s.autoScreening !== false);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      geminiApiKey: apiKey.trim(),
      aiModel: model,
      minPassingScore: Number(minPassingScore),
      autoScreening
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: 'Masukkan Gemini API Key terlebih dahulu untuk melakukan pengujian.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/ai-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model: model
        })
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Koneksi ke Google Gemini AI Berhasil!',
          latencyMs: data.latencyMs,
          model: data.model
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Gagal terhubung ke API Google Gemini.'
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kesalahan jaringan';
      setTestResult({
        success: false,
        message: `Koneksi gagal: ${msg}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetData = () => {
    if (confirm('Kembalikan semua data lowongan dan pelamar ke data demo awal?')) {
      resetDataToSeed();
      alert('Data berhasil di-reset ke kondisi awal.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/admin" className="hover:text-indigo-600 transition flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard ATS
        </Link>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 font-medium">Pengaturan AI & Model Screening</span>
      </div>

      <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
        
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-2">
            <Settings className="w-3.5 h-3.5" /> Konfigurasi Engine AI
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            Pengaturan Google Gemini AI & ATS Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Konfigurasi kunci API Google Gemini untuk analisis berkas pelamar secara real-time, mendalam, dan terpersonalisasi.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" /> Pengaturan berhasil disimpan dan aktif!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Gemini API Key */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600" /> Google Gemini API Key
              </label>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                ✓ Google Gemini 3.6 Flash Siap Digunakan
              </span>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kunci API ini digunakan oleh server untuk memproses teks CV, resume, portofolio, dan surat lamaran kandidat secara otomatis.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AQ.Ab8RN6..."
                className="flex-1 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menguji...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Uji Koneksi Gemini AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Result Indicator */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in ${
                  testResult.success
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>

                {testResult.latencyMs && (
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/60 dark:bg-slate-900/60 shrink-0">
                    ⚡ {(testResult.latencyMs / 1000).toFixed(2)}s
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Model Selection & Passing Score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-600" /> Pilihan Model Google Gemini
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                <option value="gemini-3.6-flash">Google Gemini 3.6 Flash (Direkomendasikan - Sangat Cepat & Akurat)</option>
                <option value="gemini-flash-latest">Google Gemini Flash Latest (Model Terbaru)</option>
                <option value="gemini-3.5-flash">Google Gemini 3.5 Flash</option>
                <option value="gemini-3.7-flash">Google Gemini 3.7 Flash</option>
                <option value="gemini-2.5-flash">Google Gemini 2.5 Flash</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Sistem memiliki fitur auto-fallback jika model yang dipilih mengalami lonjakan trafik.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-indigo-600" /> Standar Passing Score (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={minPassingScore}
                onChange={(e) => setMinPassingScore(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Kandidat dengan skor di atas ambang ini otomatis direkomendasikan untuk sesi wawancara.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleResetData}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition"
            >
              <RefreshCw className="w-4 h-4" /> Reset Data Demo Awal
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition active:scale-95"
            >
              <Save className="w-4 h-4" /> Simpan Pengaturan
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
