'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createJob, initializeStorage } from '@/lib/storage';
import { JobType, ExperienceLevel } from '@/lib/types';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  Trash2,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Layers,
  Building,
  DollarSign,
  GraduationCap
} from 'lucide-react';

export default function CreateJobPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering & Technology');
  const [location, setLocation] = useState('Jakarta (Hybrid)');
  const [type, setType] = useState<JobType>('Full-time');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Mid-Level (3-5 thn)');
  const [salaryRange, setSalaryRange] = useState('Rp 12.000.000 - Rp 18.000.000 / bulan');
  const [minEducation, setMinEducation] = useState('S1 Teknik Informatika / Setara');
  const [description, setDescription] = useState('');

  // Key Skills tags
  const [keySkills, setKeySkills] = useState<string[]>(['React.js', 'TypeScript', 'Tailwind CSS']);
  const [newSkill, setNewSkill] = useState('');

  // Requirements items
  const [requirements, setRequirements] = useState<string[]>([
    'Minimal 3 tahun pengalaman kerja di bidang terkait',
    'Memiliki pemahaman mendalam tentang arsitektur perangkat lunak',
    'Komunikasi yang baik dan terbiasa bekerja dalam tim Agile'
  ]);
  const [newReq, setNewReq] = useState('');

  // Responsibilities items
  const [responsibilities, setResponsibilities] = useState<string[]>([
    'Mengembangkan dan memelihara fitur aplikasi web modern',
    'Berkolaborasi dengan tim UI/UX dan Backend'
  ]);
  const [newResp, setNewResp] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSkill = () => {
    if (newSkill.trim() && !keySkills.includes(newSkill.trim())) {
      setKeySkills([...keySkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setKeySkills(keySkills.filter((s) => s !== skill));
  };

  const handleAddReq = () => {
    if (newReq.trim()) {
      setRequirements([...requirements, newReq.trim()]);
      setNewReq('');
    }
  };

  const handleRemoveReq = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleAddResp = () => {
    if (newResp.trim()) {
      setResponsibilities([...responsibilities, newResp.trim()]);
      setNewResp('');
    }
  };

  const handleRemoveResp = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Harap isi judul lowongan dan deskripsi pekerjaan.');
      return;
    }

    setIsSubmitting(true);
    initializeStorage();

    const created = createJob({
      title: title.trim(),
      department,
      location,
      type,
      experienceLevel,
      salaryRange,
      minEducation,
      description: description.trim(),
      keySkills,
      requirements,
      responsibilities
    });

    setTimeout(() => {
      router.push(`/admin/jobs/${created.id}/candidates`);
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/admin" className="hover:text-indigo-600 transition flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard ATS
        </Link>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 font-medium">Buka Lowongan Pekerjaan Baru</span>
      </div>

      {/* Form Container */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
        
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Formulir Pendaftaran Lowongan HRD
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            Buka Pendaftaran Lowongan Pekerjaan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Lowongan yang dibuat akan langsung tampil di halaman beranda pelamar dan siap menerima berkas pelamar untuk dianalisis oleh AI.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Title & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Judul Posisi Pekerjaan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Senior Full-Stack Engineer"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Departemen / Divisi <span className="text-rose-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                <option value="Engineering & Technology">Engineering & Technology</option>
                <option value="Human Resources & People Ops">Human Resources & People Ops</option>
                <option value="Data & Analytics">Data & Analytics</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Marketing & Growth">Marketing & Growth</option>
                <option value="Finance & Accounting">Finance & Accounting</option>
                <option value="Operations & Support">Operations & Support</option>
              </select>
            </div>
          </div>

          {/* Location, Type, Level */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Lokasi Kerja
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Jakarta Selatan (Hybrid)"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tipe Pekerjaan
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as JobType)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                <option value="Full-time">Full-time</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Contract">Contract</option>
                <option value="Part-time">Part-time</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Jenjang Pengalaman
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                <option value="Entry-Level">Entry-Level (Fresh Graduate)</option>
                <option value="Junior (1-2 thn)">Junior (1-2 tahun)</option>
                <option value="Mid-Level (3-5 thn)">Mid-Level (3-5 tahun)</option>
                <option value="Senior (5+ thn)">Senior (5+ tahun)</option>
                <option value="Lead / Manager">Lead / Manager</option>
              </select>
            </div>
          </div>

          {/* Salary & Education */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kisaran Gaji
              </label>
              <input
                type="text"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                placeholder="Rp 15.000.000 - Rp 22.000.000 / bulan"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Pendidikan Minimum
              </label>
              <input
                type="text"
                value={minEducation}
                onChange={(e) => setMinEducation(e.target.value)}
                placeholder="S1 Teknik Informatika / Psikologi"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Deskripsi Pekerjaan <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan peran posisi ini, proyek yang akan dikerjakan, dan lingkungan kerja..."
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Key Skills Tag Input (Used by AI Engine for Matching) */}
          <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
            <div>
              <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                ⚡ Keahlian Kunci untuk Evaluasi AI (Key Skills)
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                AI akan secara khusus memindai keahlian-keahlian ini dari isi CV & sertifikat yang diunggah pelamar.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Ketik skill (misal: Next.js, Python, BEI) lalu tekan Tambah..."
                className="flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition"
              >
                + Tambah
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {keySkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Requirements List Builder */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Persyaratan & Kualifikasi Lowongan
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={newReq}
                onChange={(e) => setNewReq(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddReq();
                  }
                }}
                placeholder="Tambahkan kualifikasi..."
                className="flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddReq}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 dark:bg-slate-700 text-white"
              >
                Tambah
              </button>
            </div>

            <div className="space-y-1.5">
              {requirements.map((req, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                    <span>{req}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveReq(idx)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Responsibilities List Builder */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Tanggung Jawab Utama
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={newResp}
                onChange={(e) => setNewResp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddResp();
                  }
                }}
                placeholder="Tambahkan tanggung jawab..."
                className="flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddResp}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 dark:bg-slate-700 text-white"
              >
                Tambah
              </button>
            </div>

            <div className="space-y-1.5">
              {responsibilities.map((resp, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span>{resp}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveResp(idx)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <Link
              href="/admin"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Batal
            </Link>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Menerbitkan...' : 'Publikasikan Lowongan & Aktifkan AI Screening'}</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
