'use client';

import React from 'react';
import { FitLevel } from '@/lib/types';
import { Sparkles, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface AiScoreBadgeProps {
  score: number;
  fitLevel?: FitLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  isRealAi?: boolean;
}

export default function AiScoreBadge({
  score,
  fitLevel,
  size = 'md',
  showLabel = true,
  isRealAi = false
}: AiScoreBadgeProps) {
  let level = fitLevel;
  if (!level) {
    if (score >= 85) level = 'Top Match';
    else if (score >= 70) level = 'High Match';
    else if (score >= 50) level = 'Moderate Match';
    else level = 'Low Match';
  }

  const getStyle = () => {
    switch (level) {
      case 'Top Match':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
          gradient: 'from-emerald-500 to-teal-500',
          ring: 'ring-emerald-500/30',
          icon: Sparkles,
          label: 'Top Match (Sangat Relevan)',
          badgeColor: 'bg-emerald-500'
        };
      case 'High Match':
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400',
          gradient: 'from-cyan-500 to-blue-500',
          ring: 'ring-cyan-500/30',
          icon: CheckCircle2,
          label: 'High Match (Relevan)',
          badgeColor: 'bg-cyan-500'
        };
      case 'Moderate Match':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
          gradient: 'from-amber-500 to-orange-500',
          ring: 'ring-amber-500/30',
          icon: AlertTriangle,
          label: 'Moderate Match (Cukup)',
          badgeColor: 'bg-amber-500'
        };
      case 'Low Match':
      default:
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400',
          gradient: 'from-rose-500 to-red-500',
          ring: 'ring-rose-500/30',
          icon: XCircle,
          label: 'Low Match (Kurang Relevan)',
          badgeColor: 'bg-rose-500'
        };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${style.bg}`}>
        <span className="font-bold">{score}%</span>
        {showLabel && <span className="opacity-90">{level}</span>}
        {isRealAi && (
          <span className="text-[9px] font-bold px-1 rounded bg-indigo-600 text-white leading-tight">
            Gemini AI
          </span>
        )}
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className={`flex items-center gap-4 p-4 rounded-2xl border ${style.bg}`}>
        <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${style.gradient} text-white font-extrabold text-2xl shadow-lg ring-4 ${style.ring}`}>
          {score}%
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase opacity-80">
            <Icon className="w-4 h-4" /> AI Match Score {isRealAi && '• Gemini Real AI'}
          </div>
          <div className="text-lg font-bold mt-0.5">{style.label}</div>
        </div>
      </div>
    );
  }

  // Medium (default)
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold shadow-xs ${style.bg}`}>
      <div className={`flex items-center justify-center px-2 py-0.5 rounded-lg bg-gradient-to-r ${style.gradient} text-white font-bold text-xs`}>
        {score}%
      </div>
      <Icon className="w-4 h-4" />
      {showLabel && <span>{level}</span>}
      {isRealAi && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-600 text-white">
          Gemini AI
        </span>
      )}
    </div>
  );
}
