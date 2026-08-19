'use client';

import React from 'react';
import { AiEvaluationResult } from '@/lib/types';
import { Code2, Briefcase, GraduationCap, HeartHandshake, Users, Check, X, PlusCircle, AlertTriangle, Sparkles, Cpu } from 'lucide-react';

interface AiAnalysisRadarProps {
  evaluation: AiEvaluationResult;
}

export default function AiAnalysisRadar({ evaluation }: AiAnalysisRadarProps) {
  const metrics = [
    {
      name: 'Kesesuaian Skill Teknis',
      score: evaluation.technicalScore,
      weight: 'Bobot 35%',
      icon: Code2,
      color: 'bg-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-950/40',
      textColor: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      name: 'Kedalaman Pengalaman Kerja',
      score: evaluation.experienceScore,
      weight: 'Bobot 30%',
      icon: Briefcase,
      color: 'bg-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-950/40',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      name: 'Pendidikan & Sertifikasi',
      score: evaluation.educationScore,
      weight: 'Bobot 20%',
      icon: GraduationCap,
      color: 'bg-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-950/40',
      textColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      name: 'Motivasi & Komunikasi',
      score: evaluation.motivationScore,
      weight: 'Bobot 15%',
      icon: HeartHandshake,
      color: 'bg-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-950/40',
      textColor: 'text-amber-600 dark:text-amber-400'
    }
  ];

  if (evaluation.cultureFitScore !== undefined) {
    metrics.push({
      name: 'Kecocokan Budaya & Leadership',
      score: evaluation.cultureFitScore,
      weight: 'Indikator AI',
      icon: Users,
      color: 'bg-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-950/40',
      textColor: 'text-purple-600 dark:text-purple-400'
    });
  }

  return (
    <div className="space-y-6">
      {/* Real AI Verification Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-indigo-600 text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
              {evaluation.isRealAi ? 'Analisis Google Gemini AI Aktif' : 'Engine Analisis Cerdas'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2">
              Model: {evaluation.modelUsed || 'Google Gemini 3.6 Flash'}
            </span>
          </div>
        </div>

        {evaluation.latencyMs && (
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            ⚡ {(evaluation.latencyMs / 1000).toFixed(2)}s
          </span>
        )}
      </div>

      {/* Pillars Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.name}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${m.bgColor} ${m.textColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{m.name}</div>
                    <div className="text-[10px] text-slate-500">{m.weight}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-base font-bold ${m.textColor}`}>{m.score}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${m.color}`}
                  style={{ width: `${Math.max(5, m.score)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Skills Matrix (Matched, Missing, & Additional Bonus Skills) */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Matriks Kesesuaian Skill Kunci
          </h4>
          <div className="flex flex-wrap gap-2">
            {evaluation.matchedSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {skill}
              </span>
            ))}

            {evaluation.missingSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300"
              >
                <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                {skill} (Belum Terdeteksi)
              </span>
            ))}

            {evaluation.matchedSkills.length === 0 && evaluation.missingSkills.length === 0 && (
              <span className="text-xs text-slate-500 italic">Tidak ada spesifikasi skill eksplisit pada berkas.</span>
            )}
          </div>
        </div>

        {/* Additional Bonus Skills found by AI */}
        {evaluation.additionalSkills && evaluation.additionalSkills.length > 0 && (
          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1.5">
              <PlusCircle className="w-3.5 h-3.5" /> Keahlian Tambahan / Nilai Plus Terdeteksi AI
            </h4>
            <div className="flex flex-wrap gap-2">
              {evaluation.additionalSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300"
                >
                  ✨ {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Risk Factors / Red Flags (if any detected) */}
      {evaluation.riskFactors && evaluation.riskFactors.length > 0 && (
        <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Catatan Pertimbangan Khusus (Risk Factor AI)
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            {evaluation.riskFactors.map((rf, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>{rf}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
