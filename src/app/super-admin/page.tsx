'use client';

import React, { useState, useEffect } from 'react';
import { Company, Transaction, Job, Application, AppSettings } from '@/lib/types';
import {
  getAllCompanies,
  getAllTransactions,
  getAllJobs,
  getAllApplications,
  getSettings,
  saveSettings,
  initializeStorage,
  REFRESH_EVENT
} from '@/lib/storage';
import AiScoreBadge from '@/components/AiScoreBadge';
import {
  Shield,
  Building2,
  CreditCard,
  Sparkles,
  Users,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Save,
  Search,
  ExternalLink,
  DollarSign,
  X,
  MapPin,
  Calendar,
  Eye,
  Clock
} from 'lucide-react';

export default function SuperAdminPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>(getSettings());

  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'companies' | 'transactions' | 'ai-settings'>('overview');
  const [savedSettings, setSavedSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected Job for Detail Modal
  const [selectedJobModal, setSelectedJobModal] = useState<Job | null>(null);

  useEffect(() => {
    initializeStorage();
    const load = () => {
      setCompanies(getAllCompanies());
      setTransactions(getAllTransactions());
      setJobs(getAllJobs());
      setApplications(getAllApplications());
      setSettingsState(getSettings());
    };
    load();

    window.addEventListener(REFRESH_EVENT, load);
    return () => window.removeEventListener(REFRESH_EVENT, load);
  }, []);

  // Financial Stats
  const totalRevenue = transactions.reduce((acc, t) => acc + (t.status === 'settlement' ? t.amount : 0), 0);
  const formattedRevenue = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalRevenue);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2500);
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const jobApplications = selectedJobModal
    ? applications.filter(a => a.jobId === selectedJobModal.id)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Master Console Super Administrator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Pengelolaan & Kontrol Platform
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitoring seluruh transaksi Midtrans, perusahaan mitra, seluruh lowongan kerja, pelamar, dan penggunaan Gemini AI.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-medium self-start sm:self-auto gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'overview' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'jobs' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua Loker ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'companies' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Daftar PT ({companies.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'transactions' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Transaksi Midtrans ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('ai-settings')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'ai-settings' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pengaturan AI
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Pendapatan (Midtrans)</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{formattedRevenue}</div>
              <div className="text-[11px] text-slate-400">Dari {transactions.length} transaksi langganan</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Perusahaan Mitra (PT)</span>
                <Building2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">{companies.length} PT</div>
              <div className="text-[11px] text-emerald-400 font-medium">100% Terverifikasi Aktif</div>
            </div>

            {/* Clickable Total Loker KPI to jump to all jobs */}
            <button
              onClick={() => setActiveTab('jobs')}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all text-left space-y-2 group"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Lowongan Terbuka</span>
                <Briefcase className="w-4 h-4 text-teal-400 group-hover:text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white group-hover:text-amber-300">{jobs.length} Loker</div>
              <div className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                <span>Klik untuk lihat detail semua loker &rarr;</span>
              </div>
            </button>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Analisis Berkas AI</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">{applications.length} Kandidat</div>
              <div className="text-[11px] text-slate-400">Evaluasi Google Gemini ATS</div>
            </div>

          </div>

          {/* Quick Preview Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Companies */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Perusahaan Berlangganan Terbaru</span>
                </h3>
                <button
                  onClick={() => setActiveTab('companies')}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Lihat Semua
                </button>
              </div>

              <div className="space-y-3">
                {companies.slice(0, 3).map((comp) => (
                  <div key={comp.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img src={comp.logo} alt={comp.name} className="w-9 h-9 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold text-white">{comp.name}</p>
                        <p className="text-[11px] text-slate-400">{comp.industry}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold text-[10px] border border-emerald-500/30">
                      {comp.activeSubscription}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Midtrans Transactions */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>Transaksi Pembayaran Terakhir</span>
                </h3>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Lihat Semua
                </button>
              </div>

              <div className="space-y-3">
                {transactions.slice(0, 3).map((trx) => (
                  <div key={trx.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{trx.companyName || trx.companyEmail}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{trx.orderId} • {trx.paymentType}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">Rp {trx.amount.toLocaleString('id-ID')}</p>
                      <span className="text-[10px] text-emerald-300 font-semibold">SETTLEMENT</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: ALL JOBS ON PLATFORM (DETAIL LOKER SUPER ADMIN) */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari judul loker, nama PT, departemen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <span className="text-xs text-slate-400">Total <strong>{filteredJobs.length}</strong> Lowongan dari Seluruh PT</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Posisi & Loker</th>
                  <th className="py-3.5 px-4">Perusahaan (PT)</th>
                  <th className="py-3.5 px-4">Departemen & Tipe</th>
                  <th className="py-3.5 px-4">Kisaran Gaji</th>
                  <th className="py-3.5 px-4">Jumlah Pelamar</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredJobs.map((j) => {
                  const applicantCount = applications.filter(a => a.jobId === j.id).length;
                  return (
                    <tr key={j.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white text-sm">{j.title}</p>
                        <p className="text-[11px] text-slate-400">{j.location}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {j.companyLogo && (
                            <img src={j.companyLogo} alt={j.companyName} className="w-6 h-6 rounded-md object-cover" />
                          )}
                          <span className="font-semibold text-emerald-400">{j.companyName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-300">{j.department}</span>
                        <span className="ml-1.5 px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[10px]">
                          {j.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-400">{j.salaryRange || 'Kompetitif'}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white">{applicantCount}</span> Pelamar
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold text-[10px]">
                          AKTIF
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedJobModal(j)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs transition-colors border border-amber-500/30"
                        >
                          Lihat Detail Loker
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COMPANIES MANAGEMENT */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama perusahaan atau industri..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <span className="text-xs text-slate-400">Total {filteredCompanies.length} Perusahaan Terdaftar</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Perusahaan</th>
                  <th className="py-3 px-4">Sektor / Industri</th>
                  <th className="py-3 px-4">Paket Langganan</th>
                  <th className="py-3 px-4">Batas Loker</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img src={c.logo} alt={c.name} className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <p className="font-bold text-white">{c.name}</p>
                          <p className="text-[11px] text-slate-400">{c.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{c.industry}</td>
                    <td className="py-3.5 px-4">
                      {(() => {
                        const sub = c.activeSubscription || 'Perusahaan';
                        const isUmk = sub.toLowerCase().includes('umk') || sub.toLowerCase().includes('starter');
                        const isInd = sub.toLowerCase().includes('industri') || sub.toLowerCase().includes('enterprise');
                        const badgeClass = isUmk
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : isInd
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                        return (
                          <span className={`px-2 py-0.5 rounded font-semibold border ${badgeClass}`}>
                            {sub}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-4">{c.jobQuota} Loker</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={c.website || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                      >
                        <span>Website</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TRANSACTIONS LOGS */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Perusahaan / Email</th>
                  <th className="py-3 px-4">Paket</th>
                  <th className="py-3 px-4">Nominal</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Status Midtrans</th>
                  <th className="py-3 px-4">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{t.orderId}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{t.companyName || 'Perusahaan'}</p>
                      <p className="text-[11px] text-slate-400">{t.companyEmail}</p>
                    </td>
                    <td className="py-3.5 px-4">{t.packageName}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      Rp {t.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">{t.paymentType}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase text-[10px]">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(t.createdAt).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AI & SYSTEM SETTINGS */}
      {activeTab === 'ai-settings' && (
        <form onSubmit={handleSaveSettings} className="max-w-2xl p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 text-xs">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Konfigurasi Google Gemini AI & Engine ATS</span>
            </h3>
            <p className="text-slate-400">Atur kredensial model kecerdasan buatan untuk seluruh evaluasi dokumen pelamar.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Google Gemini API Key:</label>
              <input
                type="password"
                value={settings.geminiApiKey}
                onChange={(e) => setSettingsState({ ...settings, geminiApiKey: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Model Gemini Utama:</label>
              <select
                value={settings.aiModel}
                onChange={(e) => setSettingsState({ ...settings, aiModel: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Tercepat & Akurat - Rekomendasi)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Standar)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Skor Minimum Lolos Otomatis (Passing Threshold):</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="50"
                  max="90"
                  value={settings.minPassingScore}
                  onChange={(e) => setSettingsState({ ...settings, minPassingScore: parseInt(e.target.value) })}
                  className="flex-1 accent-amber-500"
                />
                <span className="font-bold text-amber-400 text-sm w-12 text-right">{settings.minPassingScore}%</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {savedSettings ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Pengaturan berhasil disimpan!</span>
              </span>
            ) : <span />}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all flex items-center gap-2 shadow-md shadow-amber-950/40"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      )}

      {/* SUPER ADMIN JOB DETAIL MODAL */}
      {selectedJobModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 text-xs text-slate-300 max-h-[90vh] flex flex-col">
            
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {selectedJobModal.companyLogo ? (
                    <img src={selectedJobModal.companyLogo} alt={selectedJobModal.companyName} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6 text-emerald-400" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-400">{selectedJobModal.companyName}</span>
                  <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">{selectedJobModal.title}</h3>
                  <p className="text-[11px] text-slate-400">{selectedJobModal.department} • {selectedJobModal.location} • {selectedJobModal.type}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedJobModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-5 flex-1 pr-1">
              
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Level Pengalaman:</span>
                  <p className="font-bold text-white mt-0.5">{selectedJobModal.experienceLevel}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Gaji:</span>
                  <p className="font-bold text-emerald-400 mt-0.5">{selectedJobModal.salaryRange}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Pendidikan:</span>
                  <p className="font-bold text-white mt-0.5">{selectedJobModal.minEducation}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Deskripsi Loker:</h4>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line p-3 rounded-xl bg-slate-950 border border-slate-800">
                  {selectedJobModal.description}
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-emerald-400 uppercase text-[11px] tracking-wider">Key Skills untuk AI ATS:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJobModal.keySkills.map((sk, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-[11px]">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pelamar Masuk untuk Loker Ini */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center justify-between">
                  <span>Daftar Pelamar Masuk ({jobApplications.length})</span>
                </h4>

                {jobApplications.length > 0 ? (
                  <div className="space-y-2">
                    {jobApplications.map((app) => (
                      <div key={app.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">{app.applicantName}</p>
                          <p className="text-[11px] text-slate-400">{app.applicantEmail} • Dilamar: {new Date(app.appliedDate).toLocaleDateString('id-ID')}</p>
                        </div>
                        <AiScoreBadge
                          score={app.aiEvaluation?.overallScore ?? 0}
                          fitLevel={app.aiEvaluation?.fitLevel}
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Belum ada pelamar yang mendaftar untuk lowongan ini.</p>
                )}
              </div>

            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedJobModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
              >
                Tutup Jendela
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
