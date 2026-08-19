'use client';

import React from 'react';
import { Job } from '@/lib/types';
import Link from 'next/link';
import { Briefcase, MapPin, DollarSign, Clock, ArrowRight, Sparkles } from 'lucide-react';

interface JobCardProps {
  job: Job;
  applicantsCount?: number;
}

export default function JobCard({ job, applicantsCount = 0 }: JobCardProps) {
  const isClosed = job.status === 'closed';

  return (
    <div className={`group relative rounded-3xl border transition-all duration-300 overflow-hidden ${
      isClosed
        ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-75'
        : 'border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5'
    }`}>
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all pointer-events-none" />

      <div className="p-6 sm:p-7 flex flex-col justify-between h-full">
        <div>
          {/* Header & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              {job.department}
            </span>

            <div className="flex items-center gap-2">
              {isClosed ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                  Ditutup
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Membuka Lamaran
                </span>
              )}
            </div>
          </div>

          {/* Job Title */}
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
            {job.title}
          </h3>

          {/* Job Meta (Location, Type, Exp, Salary) */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-slate-500 dark:text-slate-400 mt-4">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{job.type}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>{job.experienceLevel}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>{job.salaryRange.split('/')[0]}</span>
            </div>
          </div>

          {/* Description Snippet */}
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-4 line-clamp-2 leading-relaxed">
            {job.description}
          </p>

          {/* Skills Badges */}
          <div className="flex flex-wrap gap-1.5 mt-4">
            {job.keySkills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                {skill}
              </span>
            ))}
            {job.keySkills.length > 4 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                +{job.keySkills.length - 4} lainnya
              </span>
            )}
          </div>
        </div>

        {/* Footer & CTA */}
        <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>AI Automated Screening</span>
          </div>

          <Link
            href={`/jobs/${job.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 dark:group-hover:text-white transition shadow-sm"
          >
            <span>{isClosed ? 'Lihat Detail' : 'Lamar Sekarang'}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
}
