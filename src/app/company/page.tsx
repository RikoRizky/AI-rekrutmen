'use client';

import React, { useState, useEffect } from 'react';
import { Job, Application, Company, User } from '@/lib/types';
import {
  getCurrentUser,
  getJobsByCompanyId,
  getApplicationsByCompanyId,
  getAllCompanies,
  updateCompany,
  getDefaultCompanyLogo,
  initializeStorage,
  REFRESH_EVENT,
  getJobDeadlineCountdown
} from '@/lib/storage';
import CandidateDetailModal from '@/components/CandidateDetailModal';
import AiScoreBadge from '@/components/AiScoreBadge';
import Link from 'next/link';
import {
  Building2,
  PlusCircle,
  Users,
  Briefcase,
  Sparkles,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  Ban,
  ArrowUpRight,
  ExternalLink,
  ArrowLeft,
  DollarSign,
  MapPin,
  Calendar,
  ChevronRight,
  GraduationCap,
  Settings2,
  Upload,
  X,
  Check,
  Globe
} from 'lucide-react';

export default function CompanyPortalPage() {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  // Selected Job to view applicants (null = view jobs list, Job = view applicants for this job)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Candidate Filters (when viewing applicants of a job)
  const [selectedFitLevel, setSelectedFitLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [candidateSearchQuery, setCandidateSearchQuery] = useState<string>('');

  // Active Candidate Modal
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);

  // Edit Company Profile Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLogo, setEditLogo] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const sanitizeLogo = (comp: Company): string => {
    if (!comp.logo || comp.logo.includes('photo-1599305445671-ac291c95aaa9') || comp.logo.startsWith('data:image/svg+xml')) {
      return getDefaultCompanyLogo(comp.name);
    }
    return comp.logo;
  };

  const loadData = () => {
    const user = getCurrentUser();
    setCurrentUserState(user);

    if (user && user.companyId) {
      const companies = getAllCompanies();
      const comp = companies.find((c) => c.id === user.companyId) || companies[0];
      
      // Auto-migrate if old logo exists
      const cleanLogo = sanitizeLogo(comp);
      if (comp.logo !== cleanLogo) {
        updateCompany(comp.id, { logo: cleanLogo });
        comp.logo = cleanLogo;
      }

      setCompany(comp);

      const compJobs = getJobsByCompanyId(comp.id);
      setJobs(compJobs);

      const compApps = getApplicationsByCompanyId(comp.id);
      setApplications(compApps);
    } else {
      // Fallback to first company in storage
      const companies = getAllCompanies();
      const comp = companies[0];
      const cleanLogo = sanitizeLogo(comp);
      if (comp.logo !== cleanLogo) {
        updateCompany(comp.id, { logo: cleanLogo });
        comp.logo = cleanLogo;
      }
      setCompany(comp);
      setJobs(getJobsByCompanyId(comp.id));
      setApplications(getApplicationsByCompanyId(comp.id));
    }
  };

  const handleOpenEditModal = () => {
    if (!company) return;
    setEditName(company.name);
    setEditIndustry(company.industry || '');
    setEditAddress(company.address || '');
    setEditWebsite(company.website || '');
    setEditDescription(company.description || '');
    setEditLogo(sanitizeLogo(company));
    setSaveSuccessMsg(false);
    setIsEditProfileOpen(true);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setEditLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateDefaultLogo = () => {
    setEditLogo(getDefaultCompanyLogo(editName || company?.name || 'PT'));
  };

  const handleSaveCompanyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    if (!editName.trim()) {
      alert('Nama perusahaan wajib diisi.');
      return;
    }

    setIsSavingProfile(true);
    const updated = updateCompany(company.id, {
      name: editName.trim(),
      industry: editIndustry.trim(),
      address: editAddress.trim(),
      website: editWebsite.trim(),
      description: editDescription.trim(),
      logo: editLogo || getDefaultCompanyLogo(editName)
    });

    if (updated) {
      setCompany(updated);
      setSaveSuccessMsg(true);
      setTimeout(() => {
        setIsSavingProfile(false);
        setIsEditProfileOpen(false);
        loadData();
      }, 600);
    } else {
      setIsSavingProfile(false);
      alert('Gagal menyimpan profil perusahaan.');
    }
  };

  useEffect(() => {
    initializeStorage();
    loadData();

    const handleOpenEvent = () => {
      const user = getCurrentUser();
      const companies = getAllCompanies();
      const comp = user?.companyId ? companies.find((c) => c.id === user.companyId) || companies[0] : companies[0];
      if (comp) {
        setEditName(comp.name);
        setEditIndustry(comp.industry || '');
        setEditAddress(comp.address || '');
        setEditWebsite(comp.website || '');
        setEditDescription(comp.description || '');
        setEditLogo(sanitizeLogo(comp));
        setSaveSuccessMsg(false);
        setIsEditProfileOpen(true);
      }
    };

    window.addEventListener(REFRESH_EVENT, loadData);
    window.addEventListener('smartrecruit_open_company_edit', handleOpenEvent);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('edit') === 'true') {
        handleOpenEvent();
      }
    }

    return () => {
      window.removeEventListener(REFRESH_EVENT, loadData);
      window.removeEventListener('smartrecruit_open_company_edit', handleOpenEvent);
    };
  }, []);

  // Filter applicants for the selected job
  const jobApplicants = selectedJob
    ? applications
        .filter((app) => app.jobId === selectedJob.id)
        .filter((app) => {
          const matchFit = selectedFitLevel === 'all' || app.aiEvaluation.fitLevel === selectedFitLevel;
          const matchStatus = selectedStatus === 'all' || app.status === selectedStatus;
          const matchSearch =
            app.applicantName.toLowerCase().includes(candidateSearchQuery.toLowerCase()) ||
            app.applicantEmail.toLowerCase().includes(candidateSearchQuery.toLowerCase()) ||
            (app.applicantHeadline && app.applicantHeadline.toLowerCase().includes(candidateSearchQuery.toLowerCase()));

          return matchFit && matchStatus && matchSearch;
        })
        .sort((a, b) => b.aiEvaluation.overallScore - a.aiEvaluation.overallScore)
    : [];

  // Statistics
  const totalApplicantsCount = applications.length;
  const topMatchCount = applications.filter((a) => a.aiEvaluation.overallScore >= 85).length;
  const interviewCount = applications.filter((a) => a.status === 'interview').length;
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length;

  const activeJobsCount = jobs.filter((j) => j.status !== 'closed' && !getJobDeadlineCountdown(j.deadline).isExpired).length;
  const closedJobsCount = jobs.length - activeJobsCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Profile PT */}
      {company && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-start gap-4">
            <img
              src={company.logo}
              alt={company.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/30 shrink-0 shadow-md"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{company.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  Paket {company.activeSubscription || 'Professional'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {company.industry} • {company.address}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                <span>
                  Kuota Loker: <strong className="text-emerald-400">{jobs.length}/{company.jobQuota}</strong> Terpakai
                </span>
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                  >
                    <span>Website PT</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenEditModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs shadow-md transition-all hover:scale-[1.02]"
            >
              <Settings2 className="w-4 h-4 text-emerald-400" />
              <span>Edit Profil PT</span>
            </button>

            <Link
              href="/company/jobs/new"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buka Lowongan Baru</span>
            </Link>
          </div>
        </div>
      )}

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Lowongan Dibuat</span>
            <Briefcase className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{jobs.length} Loker</div>
          <div className="text-[11px] font-medium flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{activeJobsCount} Aktif Terbuka</span>
            {closedJobsCount > 0 && (
              <span className="text-rose-400 font-semibold">• {closedJobsCount} Ditutup</span>
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Pelamar Masuk</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{totalApplicantsCount}</div>
          <div className="text-[11px] text-slate-400">Dari seluruh loker aktif</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Kandidat Top Match (85+)</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">{topMatchCount}</div>
          <div className="text-[11px] text-emerald-400/90 font-medium">Sangat direkomendasikan AI</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tahap Wawancara</span>
            <MessageSquare className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">{interviewCount}</div>
          <div className="text-[11px] text-slate-400">Kandidat dijadwalkan</div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* TAMPILAN UTAMA (LEVEL 1): DAFTAR LOKER YANG DIBUAT PERUSAHAAN             */}
      {/* ========================================================================= */}
      {!selectedJob ? (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                <span>Lowongan Kerja yang Dibuat ({jobs.length})</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih atau klik salah satu lowongan untuk melihat dan menyaring seluruh pelamar yang masuk.
              </p>
            </div>

            <Link
              href="/company/jobs/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>+ Buat Lowongan Baru</span>
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <Briefcase className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Belum Ada Lowongan yang Dibuat</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Perusahaan Anda belum membuka loker apapun. Buat loker pertama Anda agar para pencari kerja dapat melamar.
                </p>
              </div>
              <Link
                href="/company/jobs/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Buka Lowongan Sekarang</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((j) => {
                const deadlineInfo = getJobDeadlineCountdown(j.deadline);
                const isJobActive = j.status !== 'closed' && !deadlineInfo.isExpired;
                const applicantsForThisJob = applications.filter((a) => a.jobId === j.id);
                const topMatchForThisJob = applicantsForThisJob.filter((a) => (a.aiEvaluation?.overallScore || 0) >= 85).length;
                const interviewForThisJob = applicantsForThisJob.filter((a) => a.status === 'interview').length;

                return (
                  <div
                    key={j.id}
                    className={`p-6 rounded-3xl bg-slate-900 border transition-all flex flex-col justify-between space-y-5 shadow-lg group ${
                      isJobActive ? 'border-slate-800 hover:border-emerald-500/40' : 'border-rose-500/30 bg-slate-900/80'
                    }`}
                  >
                    {/* Top Info */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                          {j.type}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border ${deadlineInfo.badgeClass}`}>
                            <Clock className="w-3 h-3 inline mr-1" />
                            {deadlineInfo.label}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors leading-tight">
                          {j.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{j.department} • {j.location}</span>
                        </p>
                      </div>

                      {/* Salary & Experience */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
                        <span className="font-bold text-emerald-400">{j.salaryRange || 'Kompetitif'}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300">{j.experienceLevel}</span>
                      </div>

                      {/* Key Skills */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {j.keySkills.slice(0, 3).map((sk, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 text-[10px] border border-slate-800"
                          >
                            {sk}
                          </span>
                        ))}
                        {j.keySkills.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px]">
                            +{j.keySkills.length - 3} lainnya
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Stats & Action */}
                    <div className="pt-4 border-t border-slate-800 space-y-3">
                      
                      {/* Loker Candidate Summary Badges */}
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                          <span className="text-slate-400 block">Pelamar</span>
                          <strong className="text-white text-xs block mt-0.5">{applicantsForThisJob.length}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                          <span className="text-emerald-400 block">Top Match</span>
                          <strong className="text-emerald-400 text-xs block mt-0.5">{topMatchForThisJob}</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                          <span className="text-amber-400 block">Interview</span>
                          <strong className="text-amber-400 text-xs block mt-0.5">{interviewForThisJob}</strong>
                        </div>
                      </div>

                      {/* Primary CTA: Open Applicants List */}
                      <button
                        onClick={() => setSelectedJob(j)}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/40"
                      >
                        <Users className="w-4 h-4" />
                        <span>Lihat & Kelola Pelamar ({applicantsForThisJob.length})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <Link
                          href={`/jobs/${j.id}`}
                          target="_blank"
                          className="text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                        >
                          <span>Pratinjau Loker Publik</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                        {isJobActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[10px] bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Aktif Terbuka</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-[10px] bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span>Pendaftaran Ditutup</span>
                          </span>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      ) : (
        /* ========================================================================= */
        /* TAMPILAN DETAIL (LEVEL 2): DAFTAR PELAMAR DARI LOKER YANG DIKLIK          */
        /* ========================================================================= */
        <div className="space-y-6">
          
          {/* Back Button to Jobs List */}
          <button
            onClick={() => setSelectedJob(null)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>&larr; Kembali ke Daftar Lowongan Perusahaan</span>
          </button>

          {/* Selected Job Header Summary */}
          {(() => {
            const selectedJobDeadline = getJobDeadlineCountdown(selectedJob.deadline);
            const isSelectedJobActive = selectedJob.status !== 'closed' && !selectedJobDeadline.isExpired;

            return (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                      {selectedJob.type}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border ${selectedJobDeadline.badgeClass}`}>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {selectedJobDeadline.label}
                    </span>
                    {isSelectedJobActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Aktif Terbuka</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span>Pendaftaran Ditutup</span>
                      </span>
                    )}
                    <span className="text-xs text-slate-400">• {selectedJob.department} • {selectedJob.location}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">{selectedJob.title}</h2>
                  <p className="text-xs text-emerald-400 font-semibold">
                    Gaji: {selectedJob.salaryRange || 'Kompetitif'} • Pengalaman: {selectedJob.experienceLevel} • Batas: {selectedJob.deadline ? new Date(selectedJob.deadline).toLocaleDateString('id-ID') : 'Terbuka'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Total Pelamar Loker Ini</span>
                    <strong className="text-lg font-black text-white">{jobApplicants.length} Kandidat</strong>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Filter Bar for this Job's Applicants */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            
            {/* Search candidate name */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama pelamar atau email..."
                value={candidateSearchQuery}
                onChange={(e) => setCandidateSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedFitLevel}
                onChange={(e) => setSelectedFitLevel(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Skor AI</option>
                <option value="TOP_MATCH">Top Match (85%+)</option>
                <option value="GOOD_MATCH">Good Match (70-84%)</option>
                <option value="MODERATE_MATCH">Moderate (50-69%)</option>
                <option value="LOW_MATCH">Low Match (&lt;50%)</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Status</option>
                <option value="applied">Baru Masuk (Screening)</option>
                <option value="interview">Wawancara</option>
                <option value="accepted">Diterima (Hired)</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>

          </div>

          {/* Candidates List Table for Selected Job */}
          {jobApplicants.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Belum Ada Pelamar untuk Lowongan Ini</h3>
              <p className="text-xs text-slate-400">
                Pencari kerja yang melamar di lowongan ini akan otomatis dievaluasi oleh Gemini AI dan muncul di tabel ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6">Nama Kandidat</th>
                    <th className="py-4 px-6">Skor & Fit Level AI</th>
                    <th className="py-4 px-6">Rekomendasi AI</th>
                    <th className="py-4 px-6">Status Seleksi</th>
                    <th className="py-4 px-6 text-right">Evaluasi AI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {jobApplicants.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                      
                      {/* Candidate info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-emerald-400 border border-slate-700 shrink-0">
                            {app.applicantName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{app.applicantName}</p>
                            <p className="text-[11px] text-slate-400">{app.applicantEmail}</p>
                            {app.applicantHeadline && (
                              <p className="text-[10px] text-emerald-400">{app.applicantHeadline}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* AI Match Badge */}
                      <td className="py-4 px-6">
                        <AiScoreBadge
                          score={app.aiEvaluation.overallScore}
                          fitLevel={app.aiEvaluation.fitLevel}
                          size="md"
                        />
                      </td>

                      {/* AI Recommendation */}
                      <td className="py-4 px-6 font-mono text-[11px] font-bold text-emerald-300">
                        {app.aiEvaluation.recommendation}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase ${
                            app.status === 'accepted'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : app.status === 'interview'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : app.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {app.status === 'applied' ? 'Screening' : app.status}
                        </span>
                      </td>

                      {/* Action Modal */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedCandidate(app)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Buka Detail & AI</span>
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* Edit Profil Perusahaan Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8 relative">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">Edit Profil Perusahaan</h2>
                  <p className="text-xs text-slate-400">Perbarui identitas, logo, alamat, dan informasi resmi PT Anda</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompanyProfile} className="space-y-5 text-xs">
              
              {/* Logo Editor Section */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <label className="font-bold text-slate-300 block">Logo & Foto Profil Perusahaan</label>
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative group">
                    <img
                      src={editLogo || (company ? sanitizeLogo(company) : '') || getDefaultCompanyLogo(editName || 'PT')}
                      alt="Preview Logo"
                      className="w-20 h-20 rounded-2xl object-cover ring-2 ring-emerald-500/40 bg-slate-900 shrink-0 shadow-lg"
                    />
                  </div>

                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <label className="cursor-pointer px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Foto Logo</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp, image/svg+xml"
                          onChange={handleLogoFileUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={handleGenerateDefaultLogo}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Pakai Logo Generik (Bebas Hak Cipta)</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Format didukung: PNG, JPG, WebP, SVG (Maks. 2MB). Foto otomatis bebas hak cipta.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Nama Perusahaan / PT *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Contoh: PT Inovasi Maju Bersama"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Kategori Industri / Sektor *</label>
                  <input
                    type="text"
                    required
                    value={editIndustry}
                    onChange={(e) => setEditIndustry(e.target.value)}
                    placeholder="Contoh: Logistik & Supply Chain, IT..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Lokasi / Alamat Kantor *</label>
                  <input
                    type="text"
                    required
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Contoh: Bandung, Jawa Barat"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Website Perusahaan</label>
                  <input
                    type="url"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    placeholder="https://perusahaan.co.id"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Deskripsi / Profil Singkat Perusahaan</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Jelaskan mengenai bidang usaha, kultur kerja, atau visi misi perusahaan..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {saveSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Profil perusahaan berhasil diperbarui!</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Evaluation ATS Detail Modal */}
      {selectedCandidate && (
        <CandidateDetailModal
          application={selectedCandidate}
          onClose={() => {
            setSelectedCandidate(null);
            loadData();
          }}
        />
      )}

    </div>
  );
}
