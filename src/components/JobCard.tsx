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
  CheckCircle2,
  Banknote,
  ArrowRight,
  Store,
  Factory
} from 'lucide-react';
import { getDefaultCompanyLogo, getCurrentUser, getAllApplications, getJobDeadlineCountdown, getCompanyScaleCategory } from '@/lib/storage';

interface JobCardProps {
  job: Job;
  applicantCount?: number;
  hasApplied?: boolean;
}

export default function JobCard({ job, applicantCount = 0, hasApplied: initialHasApplied = false }: JobCardProps) {
  const [hasApplied, setHasApplied] = React.useState(initialHasApplied);
  const deadlineInfo = getJobDeadlineCountdown(job.deadline);

  const scaleCategory = job.companyCategory || getCompanyScaleCategory(undefined, job.companyName, job.companyIndustry);

  React.useEffect(() => {
    if (initialHasApplied) {
      setHasApplied(true);
      return;
    }
    const user = getCurrentUser();
    if (user) {
      const apps = getAllApplications();
      const userApplied = apps.some(
        (a) =>
          a.jobId === job.id &&
          (a.userId === user.id || a.applicantEmail?.toLowerCase() === user.email?.toLowerCase())
      );
      setHasApplied(userApplied);
    } else {
      setHasApplied(false);
    }
  }, [initialHasApplied, job.id]);

  const getJobTypeBadge = (type: string) => {
    switch (type) {
      case 'Remote':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'Hybrid':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'Contract':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getScaleBadge = (category: string) => {
    switch (category) {
      case 'UMK':
        return {
          label: 'UMK',
          badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          icon: <Store className="w-3 h-3 text-amber-400" />
        };
      case 'Industri':
        return {
          label: 'Industri',
          badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          icon: <Factory className="w-3 h-3 text-purple-400" />
        };
      default:
        return {
          label: 'Perusahaan',
          badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          icon: <Building2 className="w-3 h-3 text-emerald-400" />
        };
    }
  };

  const scaleInfo = getScaleBadge(scaleCategory);

  const companyLogo =
    job.companyLogo && !job.companyLogo.includes('photo-1599305445671-ac291c95aaa9')
      ? job.companyLogo
      : getDefaultCompanyLogo(job.companyName || 'PT');

  return (
    <div
      className={`group relative bg-slate-900 border rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-950/20 flex flex-col justify-between ${
        hasApplied
          ? 'border-emerald-500/50 bg-slate-900/90 ring-1 ring-emerald-500/30'
          : 'border-slate-800 hover:border-emerald-500/40 hover:-translate-y-1'
      }`}
    >
      <div>
        {/* Row 1: Company Logo & Identity + Status Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={companyLogo}
              alt={job.companyName}
              className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-800 bg-slate-950 shrink-0 shadow-md"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-bold text-white tracking-wide block truncate">
                  {job.companyName || 'Perusahaan Mitra'}
                </span>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[10px] font-bold border shrink-0 ${scaleInfo.badgeClass}`}>
                  {scaleInfo.icon}
                  <span>{scaleInfo.label}</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block truncate">
                {job.companyIndustry || job.location}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {hasApplied && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Sudah Dilamar</span>
              </span>
            )}
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getJobTypeBadge(job.type)}`}>
              {job.type}
            </span>
          </div>
        </div>

        {/* Row 2: Full Width Job Title */}
        <h3 className="text-base sm:text-lg font-black text-white group-hover:text-emerald-300 transition-colors leading-snug line-clamp-2 mt-1 mb-3">
          {job.title}
        </h3>

        {/* Row 3: Salary Highlight Badge */}
        <div className="mb-3.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <Banknote className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{job.salaryRange || 'Gaji Kompetitif'}</span>
          </div>
        </div>

        {/* Row 4: Location, Education, Gender, Level Pills */}
        <div className="flex flex-wrap gap-1.5 mb-3 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 text-[11px]">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate max-w-[130px]">{job.location}</span>
          </span>

          {job.minEducation && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-emerald-300 text-[11px] font-medium">
              <span>Min. {job.minEducation.split(' / ')[0]}</span>
            </span>
          )}

          {job.genderRequirement && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium ${
              job.genderRequirement.toLowerCase().includes('perempuan') || job.genderRequirement.toLowerCase().includes('wanita')
                ? 'bg-pink-500/10 text-pink-300 border-pink-500/30'
                : job.genderRequirement.toLowerCase().includes('laki') || job.genderRequirement.toLowerCase().includes('pria')
                ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                : 'bg-slate-950/80 text-slate-400 border-slate-800'
            }`}>
              <span>
                {job.genderRequirement.toLowerCase().includes('perempuan') || job.genderRequirement.toLowerCase().includes('wanita')
                  ? '👩 Khusus Wanita'
                  : job.genderRequirement.toLowerCase().includes('laki') || job.genderRequirement.toLowerCase().includes('pria')
                  ? '👨 Khusus Pria'
                  : '👥 Pria & Wanita'}
              </span>
            </span>
          )}

          {job.experienceLevel && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 text-[11px]">
              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{job.experienceLevel}</span>
            </span>
          )}
        </div>

        {/* Row 5: Short Description */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4 min-h-[32px]">
          {job.description}
        </p>

        {/* Row 6: Key Skills Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.keySkills.slice(0, 4).map((skill, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] font-medium"
            >
              {skill}
            </span>
          ))}
          {job.keySkills.length > 4 && (
            <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-500 text-[11px]">
              +{job.keySkills.length - 4} lainnya
            </span>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs gap-3">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-semibold ${deadlineInfo.badgeClass}`}>
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>{deadlineInfo.label}</span>
        </div>

        <Link
          href={`/jobs/${job.id}`}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md ${
            hasApplied
              ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 hover:scale-[1.02]'
          }`}
        >
          <span>{hasApplied ? 'Lihat Riwayat' : 'Detail & Lamar'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
