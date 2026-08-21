'use client';

import React from 'react';
import { AiEvaluationResult } from '@/lib/types';

interface AiAnalysisRadarProps {
  evaluation: AiEvaluationResult;
}

export default function AiAnalysisRadar({ evaluation }: AiAnalysisRadarProps) {
  const axes = [
    { label: 'Technical', value: evaluation.technicalScore || 75 },
    { label: 'Experience', value: evaluation.experienceScore || 70 },
    { label: 'Education', value: evaluation.educationScore || 80 },
    { label: 'Motivation', value: evaluation.motivationScore || 75 },
    { label: 'Culture Fit', value: evaluation.cultureFitScore || 80 }
  ];

  const size = 320;
  const center = size / 2;
  const radius = 110;
  const totalAxes = axes.length;

  const getCoordinates = (value: number, index: number) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Polygon points for candidate score
  const polygonPoints = axes
    .map((axis, i) => {
      const { x, y } = getCoordinates(axis.value, i);
      return `${x},${y}`;
    })
    .join(' ');

  // Grid levels (25%, 50%, 75%, 100%)
  const levels = [25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center bg-slate-950/80 border border-slate-800 rounded-3xl p-5 w-full">
      <div className="flex items-center justify-between w-full mb-3">
        <span className="text-xs sm:text-sm font-bold text-white">Radar 5 Dimensi Kompetensi</span>
        <span className="text-xs sm:text-sm font-black text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
          Skor: {evaluation.overallScore}/100
        </span>
      </div>

      <div className="relative my-2">
        <svg width={size} height={size} className="overflow-visible">
          {/* Background Level Webs */}
          {levels.map((lvl) => {
            const pts = axes
              .map((_, i) => {
                const { x, y } = getCoordinates(lvl, i);
                return `${x},${y}`;
              })
              .join(' ');
            return (
              <polygon
                key={lvl}
                points={pts}
                fill="none"
                stroke="#1e293b"
                strokeWidth="1.5"
                strokeDasharray={lvl === 100 ? 'none' : '3 3'}
              />
            );
          })}

          {/* Axis Spoke Lines */}
          {axes.map((_, i) => {
            const { x, y } = getCoordinates(100, i);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#334155"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Candidate Value Polygon (Emerald Theme) */}
          <polygon
            points={polygonPoints}
            fill="rgba(16, 185, 129, 0.25)"
            stroke="#10b981"
            strokeWidth="2.5"
            className="transition-all duration-500"
          />

          {/* Data Points */}
          {axes.map((axis, i) => {
            const { x, y } = getCoordinates(axis.value, i);
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="#10b981"
                  stroke="#064e3b"
                  strokeWidth="2"
                />
              </g>
            );
          })}

          {/* Labels */}
          {axes.map((axis, i) => {
            const angle = (Math.PI * 2 / totalAxes) * indexToLabelOffset(i) - Math.PI / 2;
            const labelR = radius + 26;
            const lx = center + labelR * Math.cos(angle);
            const ly = center + labelR * Math.sin(angle);

            return (
              <text
                key={i}
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[11px] font-bold fill-slate-200"
              >
                {axis.label} ({axis.value}%)
              </text>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2.5 w-full mt-4 pt-3 border-t border-slate-800 text-center text-xs">
        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-[11px]">Teknis</div>
          <div className="font-bold text-emerald-400 text-xs">{evaluation.technicalScore}%</div>
        </div>
        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-[11px]">Pengalaman</div>
          <div className="font-bold text-emerald-400 text-xs">{evaluation.experienceScore}%</div>
        </div>
        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-[11px]">Edukasi</div>
          <div className="font-bold text-emerald-400 text-xs">{evaluation.educationScore}%</div>
        </div>
      </div>
    </div>
  );
}

function indexToLabelOffset(i: number) {
  return i;
}
