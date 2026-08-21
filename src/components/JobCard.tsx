'use client';

import React from 'react';
import Link from 'next/link';
import { Job } from '@/lib/types';
import {
  Building2,
  MapPin,
  Clock,
  Briefcase,
  DollarSign,
  ChevronRight,
  Sparkles,
  Users,
  CheckCircle2
} from 'lucide-react';

interface JobCardProps {
  job: Job;
  applicantCount?: number;
  hasApplied?: boolean;
}

export default function JobCard({ job, applicantCount = 0, hasApplied = false }: JobCardProps) {
  const getJobTypeBadge = (type: string) => {
    switch (type) {
      case 'Remote':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'Hybrid':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'Contract':
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
      default:
        return 'bg-slate-800 text-slate-200 border-slate-700';
    }
  };

  return (
    <div className={`group relative bg-slate-900 border rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-950/20 flex flex-col justify-between ${
      hasApplied ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800 hover:border-emerald-500/50'
    }`}>
      
      {/* Top Section: Company Identity & Header */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {job.companyLogo ? (
                <img
                  src={job.companyLogo}
                  alt={job.companyName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-emerald-400">
                  {job.companyName || 'Perusahaan Mitra'}
                </span>
                {job.companyIndustry && (
                  <span className="text-[11px] text-slate-400">
                    • {job.companyIndustry}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                {job.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasApplied && (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Sudah Dilamar</span>
              </span>
            )}
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border shrink-0 ${getJobTypeBadge(job.type)}`}>
              {job.type}
            </span>
          </div>
        </div>

        {/* Info Grid (Department, Location, Salary) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-3.5 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{job.department}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5 font-medium text-emerald-400">
            <DollarSign className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{job.salaryRange || 'Kompetitif'}</span>
          </div>
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {job.description}
        </p>

        {/* Skill Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {job.keySkills.slice(0, 4).map((skill, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300 text-[11px] font-medium"
            >
              {skill}
            </span>
          ))}
          {job.keySkills.length > 4 && (
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[11px]">
              +{job.keySkills.length - 4} lainnya
            </span>
          )}
        </div>
      </div>

      {/* Card Footer CTA */}
      <div className="pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span><strong>{applicantCount}</strong> pelamar terdaftar</span>
        </div>

        <Link
          href={`/jobs/${job.id}`}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all shadow-sm hover:translate-x-0.5 ${
            hasApplied
              ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          <span>{hasApplied ? 'Lihat Riwayat' : 'Detail & Lamar'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
}
