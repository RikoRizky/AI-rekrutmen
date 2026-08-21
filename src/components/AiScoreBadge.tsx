'use client';

import React from 'react';
import { FitLevel, RecommendationDecision } from '@/lib/types';
import { Sparkles, CheckCircle, AlertTriangle, XCircle, ArrowUpRight } from 'lucide-react';

interface AiScoreBadgeProps {
  score: number;
  fitLevel?: FitLevel;
  recommendation?: RecommendationDecision;
  size?: 'sm' | 'md' | 'lg';
}

export default function AiScoreBadge({
  score,
  fitLevel,
  recommendation,
  size = 'md'
}: AiScoreBadgeProps) {
  const getBadgeStyle = (sc: number) => {
    if (sc >= 85) {
      return {
        bg: 'bg-emerald-500/15',
        border: 'border-emerald-500/30',
        text: 'text-emerald-300',
        dot: 'bg-emerald-400',
        label: fitLevel || 'Top Match'
      };
    }
    if (sc >= 70) {
      return {
        bg: 'bg-teal-500/15',
        border: 'border-teal-500/30',
        text: 'text-teal-300',
        dot: 'bg-teal-400',
        label: fitLevel || 'High Match'
      };
    }
    if (sc >= 50) {
      return {
        bg: 'bg-amber-500/15',
        border: 'border-amber-500/30',
        text: 'text-amber-300',
        dot: 'bg-amber-400',
        label: fitLevel || 'Moderate Match'
      };
    }
    return {
      bg: 'bg-rose-500/15',
      border: 'border-rose-500/30',
      text: 'text-rose-300',
      dot: 'bg-rose-400',
      label: fitLevel || 'Low Match'
    };
  };

  const style = getBadgeStyle(score);

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${style.bg} ${style.border} ${style.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        <span>{score}%</span>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${style.bg} ${style.border} ${style.text}`}>
        <div className="text-3xl font-black">{score}%</div>
        <div className="flex flex-col">
          <span className="text-xs uppercase font-bold tracking-wider">{style.label}</span>
          <span className="text-[11px] text-slate-300">
            {recommendation === 'STRONGLY_RECOMMENDED'
              ? 'Sangat Direkomendasikan Lanjut Wawancara'
              : recommendation === 'INTERVIEW'
              ? 'Layak untuk Diwawancarai'
              : recommendation === 'CONSIDER'
              ? 'Dipertimbangkan Sebagai Cadangan'
              : 'Belum Memenuhi Kualifikasi'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-semibold ${style.bg} ${style.border} ${style.text}`}>
      <span className={`w-2 h-2 rounded-full ${style.dot} animate-pulse`} />
      <span>{score}% Match</span>
      <span className="text-slate-400">•</span>
      <span>{style.label}</span>
    </div>
  );
}
