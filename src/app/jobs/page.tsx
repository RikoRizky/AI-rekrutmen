'use client';

import React, { useState, useEffect } from 'react';
import { Job, Application, Company, User } from '@/lib/types';
import { getAllJobs, getAllApplications, getAllCompanies, getCurrentUser, initializeStorage, REFRESH_EVENT, getJobDeadlineCountdown } from '@/lib/storage';
import JobCard from '@/components/JobCard';
import { Search, Filter, Briefcase, Building2, MapPin } from 'lucide-react';

export default function JobsCatalogPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
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

  const departments = ['all', ...Array.from(new Set(jobs.map((j) => j.department)))];

  const filteredJobs = jobs.filter((job) => {
    // 1. Exclude expired jobs from applicant exploration catalog
    const deadlineInfo = getJobDeadlineCountdown(job.deadline);
    if (deadlineInfo.isExpired) {
      return false;
    }

    // 2. Only active jobs
    if (job.status && job.status !== 'active') {
      return false;
    }

    const matchSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.keySkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchComp = selectedCompanyId === 'all' || job.companyId === selectedCompanyId;
    const matchDept = selectedDepartment === 'all' || job.department === selectedDepartment;
    const matchType = selectedType === 'all' || job.type === selectedType;

    return matchSearch && matchComp && matchDept && matchType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Eksplorasi Lowongan Kerja Perusahaan Mitra
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Temukan karir impian Anda dari berbagai perusahaan terverifikasi di platform SmartRecruit.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
        <div className="flex flex-col md:flex-row gap-3">
          
          <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <Search className="w-4 h-4 text-emerald-400 shrink-0" />
            <input
              type="text"
              placeholder="Cari judul loker, keahlian (contoh: Python, Next.js), atau nama PT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 shrink-0">
            {/* Company Filter */}
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua PT ({companies.length})</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'Semua Departemen' : dept}
                </option>
              ))}
            </select>

            {/* Type Filter */}
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
          <span>Menampilkan <strong>{filteredJobs.length}</strong> lowongan kerja aktif</span>
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
          <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
            Tidak ada lowongan yang sesuai dengan kriteria filter pencarian.
          </div>
        )}
      </div>

    </div>
  );
}
