'use client';

import React, { useState, useEffect } from 'react';
import { Job, Application } from '@/lib/types';
import { getAllJobs, getAllApplications, initializeStorage, REFRESH_EVENT } from '@/lib/storage';
import JobCard from '@/components/JobCard';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  Briefcase,
  MapPin,
  FileCheck2,
  TrendingUp,
  BrainCircuit,
  Award,
  Users,
  ArrowRight,
  Filter
} from 'lucide-react';

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    initializeStorage();
    const loadData = () => {
      setJobs(getAllJobs());
      setApplications(getAllApplications());
    };
    loadData();

    window.addEventListener(REFRESH_EVENT, loadData);
    return () => window.removeEventListener(REFRESH_EVENT, loadData);
  }, []);

  // Filter departments list
  const departments = ['all', ...Array.from(new Set(jobs.map((j) => j.department)))];

  // Filtered jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.keySkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept =
      selectedDepartment === 'all' || job.department === selectedDepartment;

    const matchesType =
      selectedType === 'all' || job.type === selectedType;

    return matchesSearch && matchesDept && matchesType;
  });

  const getApplicantCountForJob = (jobId: string) => {
    return applications.filter((a) => a.jobId === jobId).length;
  };

  return (
    <div className="space-y-16 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        
        {/* Glow backdrop circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>AI Automated Screening & Candidate Ranking ATS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Rekrutmen Cerdas dengan <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-teal-300 bg-clip-text text-transparent">
              Analisis Berkas & Perangkingan AI
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed">
            Pelamar cukup mengunggah CV, surat lamaran, dan sertifikat pendukung. Sistem AI secara otomatis membaca seluruh isi dokumen, mengevaluasi kompetensi, dan mengurutkan kandidat paling relevan secara instan untuk tim HRD.
          </p>

          {/* Search Box in Hero */}
          <div className="max-w-3xl mx-auto pt-4">
            <div className="p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-2xl flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-slate-900/80 rounded-xl border border-slate-700/50">
                <Search className="w-5 h-5 text-indigo-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari posisi, kata kunci keahlian (React, Python, HR, dll)..."
                  className="w-full bg-transparent text-sm text-white placeholder-slate-400 outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50 text-xs font-medium text-slate-200 outline-hidden"
                >
                  <option value="all">Semua Departemen</option>
                  {departments.filter(d => d !== 'all').map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50 text-xs font-medium text-slate-200 outline-hidden"
                >
                  <option value="all">Semua Tipe</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-slate-800/80 text-left">
            <div>
              <div className="text-2xl font-black text-white">{jobs.length}</div>
              <div className="text-xs text-slate-400">Lowongan Aktif</div>
            </div>
            <div>
              <div className="text-2xl font-black text-indigo-400">{applications.length}</div>
              <div className="text-xs text-slate-400">Pelamar Teranalisis</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400">100%</div>
              <div className="text-xs text-slate-400">Otomasi Screening AI</div>
            </div>
            <div>
              <div className="text-2xl font-black text-teal-400">&lt; 3 Detik</div>
              <div className="text-xs text-slate-400">Waktu Evaluasi Berkas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Jobs Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Daftar Lowongan Pekerjaan Tersedia
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Pilih posisi yang sesuai dengan keahlian Anda dan unggah berkas untuk seleksi instan AI.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">
              Menampilkan {filteredJobs.length} posisi
            </span>
          </div>
        </div>

        {/* Job Cards Grid */}
        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                applicantsCount={getApplicantCountForJob(job.id)}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Tidak ada lowongan yang sesuai</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Coba gunakan kata kunci lain atau reset filter departemen untuk melihat lowongan yang tersedia.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDepartment('all');
                setSelectedType('all');
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white"
            >
              Reset Filter Pencarian
            </button>
          </div>
        )}
      </section>

      {/* How AI Screening Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Alur Kerja Cerdas
            </span>
            <h3 className="text-2xl sm:text-3xl font-black">
              Bagaimana AI Menganalisis & Mengurutkan Pelamar?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Sistem memadukan Natural Language Processing (NLP) dan Large Language Model untuk menyaring kandidat secara adil, objektif, dan transparan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-base shadow-lg">
                1
              </div>
              <h4 className="font-bold text-base">Unggah & Ekstraksi Dokumen</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pelamar mengunggah CV, Surat Lamaran Kerja, dan Sertifikat. Mesin mengekstrak seluruh teks, riwayat kerja, dan kompetensi secara otomatis.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-base shadow-lg">
                2
              </div>
              <h4 className="font-bold text-base">Evaluasi Semantik 4 Pilar</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                AI menghitung kecocokan pada 4 pilar: Keahlian Teknis (35%), Pengalaman Kerja (30%), Pendidikan & Sertifikasi (20%), serta Motivasi (15%).
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-base shadow-lg">
                3
              </div>
              <h4 className="font-bold text-base">Perangkingan Otomatis HRD</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Kandidat otomatis disusun dari yang paling relevan (skor 90-100%) ke paling rendah di dashboard HRD lengkap dengan panduan pertanyaan wawancara.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
