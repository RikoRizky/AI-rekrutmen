'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Job, JobType, ExperienceLevel, Company, User } from '@/lib/types';
import { getCurrentUser, getAllCompanies, createJob, initializeStorage } from '@/lib/storage';
import Link from 'next/link';
import {
  Briefcase,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  Building2,
  MapPin,
  DollarSign,
  GraduationCap,
  Save,
  Loader2
} from 'lucide-react';

export default function NewJobPage() {
  const router = useRouter();
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering & Technology');
  const [location, setLocation] = useState('Jakarta (Hybrid)');
  const [type, setType] = useState<JobType>('Full-time');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Mid-Level (3-5 thn)');
  const [salaryRange, setSalaryRange] = useState('Rp 15.000.000 - Rp 25.000.000');
  const [minEducation, setMinEducation] = useState('S1 Teknik Informatika / Terkait');
  const [genderRequirement, setGenderRequirement] = useState<'Semua Gender' | 'Laki-laki' | 'Perempuan'>('Semua Gender');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('2026-12-31');

  // Dynamic Array Fields
  const [requirements, setRequirements] = useState<string[]>([
    'Menguasai React, Next.js, dan arsitektur database relasional.',
    'Pengalaman kerja minimal 3 tahun di bidang pengembangan software.'
  ]);
  const [responsibilities, setResponsibilities] = useState<string[]>([
    'Mengembangkan fitur baru dan merancang kode yang bersih dan scalable.'
  ]);
  const [keySkillsInput, setKeySkillsInput] = useState('TypeScript, Next.js, Tailwind CSS, PostgreSQL');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    initializeStorage();
    const user = getCurrentUser();
    setCurrentUserState(user);

    const companies = getAllCompanies();
    if (user && user.companyId) {
      const comp = companies.find((c) => c.id === user.companyId) || companies[0];
      setCompany(comp);
    } else {
      setCompany(companies[0]);
    }
  }, []);

  const handleAddRequirement = () => setRequirements([...requirements, '']);
  const handleReqChange = (val: string, idx: number) => {
    const updated = [...requirements];
    updated[idx] = val;
    setRequirements(updated);
  };
  const handleRemoveReq = (idx: number) => setRequirements(requirements.filter((_, i) => i !== idx));

  const handleAddResp = () => setResponsibilities([...responsibilities, '']);
  const handleRespChange = (val: string, idx: number) => {
    const updated = [...responsibilities];
    updated[idx] = val;
    setResponsibilities(updated);
  };
  const handleRemoveResp = (idx: number) => setResponsibilities(responsibilities.filter((_, i) => i !== idx));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Harap lengkapi judul dan deskripsi lowongan.');
      return;
    }

    setIsSubmitting(true);

    const keySkills = keySkillsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const targetCompany = company || getAllCompanies()[0];

    createJob({
      companyId: targetCompany.id,
      companyName: targetCompany.name,
      companyLogo: targetCompany.logo,
      companyIndustry: targetCompany.industry,
      title,
      department,
      location,
      type,
      experienceLevel,
      salaryRange,
      minEducation,
      genderRequirement,
      description,
      requirements: requirements.filter((r) => r.trim().length > 0),
      responsibilities: responsibilities.filter((r) => r.trim().length > 0),
      keySkills,
      status: 'active',
      deadline
    });

    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/company');
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/company"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Portal PT</span>
        </Link>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
          Posting Lowongan Kerja Baru
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Buka Loker untuk {company?.name || 'Perusahaan Anda'}
        </h1>
        <p className="text-xs text-slate-400">
          Kriteria dan skill tags yang Anda tulis di sini akan digunakan oleh Gemini AI untuk mencocokkan skor berkas pelamar.
        </p>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 text-xs shadow-2xl">
        
        {/* Basic Job Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Informasi Dasar Posisi
          </h3>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Judul Posisi Pekerjaan: *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Senior Fullstack Engineer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Departemen:</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Lokasi Kerja:</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tipe Kerja:</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as JobType)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Full-time">Full-time</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Contract">Contract</option>
                <option value="Part-time">Part-time</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Gender Requirement Field */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <span>Kriteria Gender Pelamar: *</span>
              </label>
              <select
                value={genderRequirement}
                onChange={(e) => setGenderRequirement(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Semua Gender">👥 Terbuka untuk Pria & Wanita (Semua Gender)</option>
                <option value="Laki-laki">👨 Khusus Laki-laki (Pria)</option>
                <option value="Perempuan">👩 Khusus Perempuan (Wanita)</option>
              </select>
            </div>

            {/* Min Education Field */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Minimal Pendidikan Terakhir: *</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: SMA / SMK Sederajat, D3, S1 Informatika"
                value={minEducation}
                onChange={(e) => setMinEducation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Level Pengalaman:</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Entry-Level">Entry-Level</option>
                <option value="Junior (1-2 thn)">Junior (1-2 thn)</option>
                <option value="Mid-Level (3-5 thn)">Mid-Level (3-5 thn)</option>
                <option value="Senior (5+ thn)">Senior (5+ thn)</option>
                <option value="Lead / Manager">Lead / Manager</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Kisaran Gaji (Range):</label>
              <input
                type="text"
                placeholder="Rp 15.000.000 - Rp 25.000.000"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Batas Akhir Lamaran:</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Skill Tags for AI */}
        <div className="space-y-2 pt-4 border-t border-slate-800">
          <div className="space-y-1">
            <label className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Keahlian Kunci Wajib (Key Skills untuk AI ATS): *</span>
            </label>
            <input
              type="text"
              required
              placeholder="Pisahkan dengan koma, misal: TypeScript, Next.js, Node.js, Docker, PostgreSQL"
              value={keySkillsInput}
              onChange={(e) => setKeySkillsInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-400">
              *AI Gemini akan mencocokkan keahlian ini secara semantik dengan teks CV kandidat.
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1 pt-2">
          <label className="font-semibold text-slate-300">Deskripsi Lengkap Posisi: *</label>
          <textarea
            rows={4}
            required
            placeholder="Jelaskan gambaran umum pekerjaan, tantangan teknis, dan lingkungan kerja..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
          />
        </div>

        {/* Requirements */}
        <div className="space-y-2 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-300">Daftar Kualifikasi & Persyaratan:</label>
            <button
              type="button"
              onClick={handleAddRequirement}
              className="text-xs text-emerald-400 font-semibold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Poin</span>
            </button>
          </div>

          <div className="space-y-2">
            {requirements.map((req, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => handleReqChange(e.target.value, i)}
                  placeholder={`Kualifikasi #${i + 1}`}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
                {requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveReq(i)}
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Responsibilities */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-300">Tanggung Jawab Utama:</label>
            <button
              type="button"
              onClick={handleAddResp}
              className="text-xs text-emerald-400 font-semibold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Poin</span>
            </button>
          </div>

          <div className="space-y-2">
            {responsibilities.map((resp, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={resp}
                  onChange={(e) => handleRespChange(e.target.value, i)}
                  placeholder={`Tanggung jawab #${i + 1}`}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
                {responsibilities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveResp(i)}
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
          <Link
            href="/company"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mempublikasikan Loker...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Publikasikan Lowongan</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}
