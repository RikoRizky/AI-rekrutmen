'use client';

import React, { useState, useEffect } from 'react';
import { Job, Application, Company, User, CompanyScaleCategory } from '@/lib/types';
import {
  getAllJobs,
  getAllApplications,
  getAllCompanies,
  getCurrentUser,
  initializeStorage,
  REFRESH_EVENT,
  getJobDeadlineCountdown,
  getCompanyScaleCategory
} from '@/lib/storage';
import JobCard from '@/components/JobCard';
import { Search, Filter, Briefcase, Building2, MapPin, Store, Factory, Sparkles, CheckCircle2, GraduationCap, Users } from 'lucide-react';

interface EducationTier {
  id: string;
  label: string;
  shortLabel: string;
  rank: number;
}

const EDUCATION_TIERS: EducationTier[] = [
  { id: 'sma_smk', label: 'SMA / SMK Sederajat', shortLabel: 'Min. SMA/SMK', rank: 1 },
  { id: 'd3', label: 'Diploma (D3)', shortLabel: 'Min. D3', rank: 2 },
  { id: 's1', label: 'Sarjana (S1 / D4)', shortLabel: 'Min. S1', rank: 3 },
  { id: 's2', label: 'Magister (S2)', shortLabel: 'Min. S2', rank: 4 },
  { id: 's3', label: 'Doktoral (S3)', shortLabel: 'Min. S3', rank: 5 },
];

function getEduTier(eduString?: string | null): EducationTier {
  if (!eduString) return EDUCATION_TIERS[0];
  const s = eduString.toLowerCase();
  if (s.includes('s3') || s.includes('doktor')) return EDUCATION_TIERS[4];
  if (s.includes('s2') || s.includes('magister') || s.includes('master')) return EDUCATION_TIERS[3];
  if (s.includes('s1') || s.includes('sarjana') || s.includes('d4') || s.includes('bachelor')) return EDUCATION_TIERS[2];
  if (s.includes('d3') || s.includes('diploma') || s.includes('d1') || s.includes('d2')) return EDUCATION_TIERS[1];
  return EDUCATION_TIERS[0]; // SMA / SMK
}

export default function JobsCatalogPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScale, setSelectedScale] = useState<'all' | CompanyScaleCategory>('all');
  const [selectedEducation, setSelectedEducation] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    initializeStorage();
    const load = () => {
      setJobs(getAllJobs());
      setCompanies(getAllCompanies());
      setApplications(getAllApplications());
      setCurrentUser(getCurrentUser());
    };
    load();

    window.addEventListener(REFRESH_EVENT, load);
    return () => window.removeEventListener(REFRESH_EVENT, load);
  }, []);

  // Helper to get company scale for a job
  const getJobScale = (job: Job): CompanyScaleCategory => {
    if (job.companyCategory && (job.companyCategory === 'UMK' || job.companyCategory === 'Perusahaan' || job.companyCategory === 'Industri')) {
      return job.companyCategory as CompanyScaleCategory;
    }
    const comp = companies.find((c) => c.id === job.companyId);
    return getCompanyScaleCategory(comp?.activeSubscription, job.companyName, job.companyIndustry);
  };

  // Active unexpired jobs
  const activeJobs = jobs.filter((j) => {
    const deadlineInfo = getJobDeadlineCountdown(j.deadline);
    return !deadlineInfo.isExpired && (!j.status || j.status === 'active');
  });

  // Dynamic Education Tiers extracted from active jobs data
  const availableEduTiers = Array.from(
    new Set(activeJobs.map((j) => getEduTier(j.minEducation).id))
  )
    .map((id) => EDUCATION_TIERS.find((t) => t.id === id)!)
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank);

  // Counts for Scale
  const countAll = activeJobs.length;
  const countUmk = activeJobs.filter((j) => getJobScale(j) === 'UMK').length;
  const countPerusahaan = activeJobs.filter((j) => getJobScale(j) === 'Perusahaan').length;
  const countIndustri = activeJobs.filter((j) => getJobScale(j) === 'Industri').length;

  const filteredJobs = activeJobs.filter((job) => {
    const jobScale = getJobScale(job);
    const jobEduTier = getEduTier(job.minEducation);
    const reqGender = (job.genderRequirement || 'Semua Gender').toLowerCase();

    // 1. Match Scale
    const matchScale = selectedScale === 'all' || jobScale === selectedScale;

    // 2. Match Education
    const matchEducation = (() => {
      if (selectedEducation === 'all') return true;
      const selectedTierObj = EDUCATION_TIERS.find((t) => t.id === selectedEducation);
      if (!selectedTierObj) return true;
      return jobEduTier.id === selectedEducation;
    })();

    // 3. Match Gender
    const matchGender = (() => {
      if (selectedGender === 'all') return true;
      if (selectedGender === 'male') {
        return reqGender.includes('pria') || reqGender.includes('laki');
      }
      if (selectedGender === 'female') {
        return reqGender.includes('wanita') || reqGender.includes('perempuan');
      }
      return true;
    })();

    // 4. Match Job Type
    const matchType = selectedType === 'all' || job.type === selectedType;

    // 5. Match Search Query
    const matchSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jobScale.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.minEducation && job.minEducation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      job.keySkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchScale && matchEducation && matchGender && matchType && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Eksplorasi Lowongan Kerja Mitra SmartRecruit
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Temukan karir impian Anda dari mitra <span className="text-amber-400 font-semibold">UMK</span>, <span className="text-emerald-400 font-semibold">Perusahaan (PT)</span>, hingga <span className="text-purple-400 font-semibold">Industri</span> dengan filter pendidikan dan kriteria gender yang akurat.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Search Box */}
          <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <Search className="w-4 h-4 text-emerald-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari judul loker, keahlian (contoh: Python, Barista), atau nama PT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          {/* 4 Filter Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            
            {/* 1. Scale Filter */}
            <select
              value={selectedScale}
              onChange={(e) => setSelectedScale(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Skala ({countAll})</option>
              <option value="UMK">🏪 UMK ({countUmk})</option>
              <option value="Perusahaan">🏢 Perusahaan ({countPerusahaan})</option>
              <option value="Industri">🏭 Industri ({countIndustri})</option>
            </select>

            {/* 2. Minimal Pendidikan Filter (Dynamic from Available Jobs) */}
            <select
              value={selectedEducation}
              onChange={(e) => setSelectedEducation(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Pendidikan</option>
              {availableEduTiers.map((tier) => {
                const countThisEdu = activeJobs.filter((j) => getEduTier(j.minEducation).id === tier.id).length;
                return (
                  <option key={tier.id} value={tier.id}>
                    🎓 {tier.shortLabel} ({countThisEdu})
                  </option>
                );
              })}
            </select>

            {/* 3. Gender Filter (Khusus Wanita, Khusus Pria, Semua Gender) */}
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Gender</option>
              <option value="male">👨 Khusus Pria</option>
              <option value="female">👩 Khusus Wanita</option>
            </select>

            {/* 4. Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
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

      {/* Jobs Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Menampilkan <strong>{filteredJobs.length}</strong> lowongan kerja aktif
            {(selectedScale !== 'all' || selectedEducation !== 'all' || selectedGender !== 'all' || selectedType !== 'all') && (
              <span className="ml-2 inline-flex items-center gap-1.5">
                <span className="text-slate-500">•</span>
                <button
                  onClick={() => {
                    setSelectedScale('all');
                    setSelectedEducation('all');
                    setSelectedGender('all');
                    setSelectedType('all');
                    setSearchQuery('');
                  }}
                  className="text-emerald-400 hover:underline font-semibold"
                >
                  Reset Filter
                </button>
              </span>
            )}
          </span>
        </div>

        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const hasApplied = currentUser
                ? applications.some(
                    (a) =>
                      a.jobId === job.id &&
                      (a.userId === currentUser.id ||
                        a.applicantEmail.toLowerCase() === currentUser.email.toLowerCase())
                  )
                : false;

              return (
                <JobCard
                  key={job.id}
                  job={job}
                  applicantCount={applications.filter((a) => a.jobId === job.id).length}
                  hasApplied={hasApplied}
                />
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 text-xs space-y-3">
            <p className="font-semibold text-white text-sm">Tidak ada lowongan kerja yang sesuai filter.</p>
            <p>Coba sesuaikan filter pendidikan, kriteria gender, skala, atau ubah kata kunci pencarian Anda.</p>
            <button
              onClick={() => {
                setSelectedScale('all');
                setSelectedEducation('all');
                setSelectedGender('all');
                setSelectedType('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs transition-colors"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
