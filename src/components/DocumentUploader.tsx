'use client';

import React, { useState } from 'react';
import { DocumentAttachment, DocumentType } from '@/lib/types';
import { extractTextFromFile } from '@/lib/document-parser';
import {
  UploadCloud,
  FileText,
  Trash2,
  Eye,
  EyeOff,
  Award,
  Mail,
  Loader2,
  CheckCircle2,
  FileCode,
  Sparkles
} from 'lucide-react';

interface DocumentUploaderProps {
  documents: DocumentAttachment[];
  onDocumentsChange: (documents: DocumentAttachment[]) => void;
}

export default function DocumentUploader({
  documents,
  onDocumentsChange
}: DocumentUploaderProps) {
  const [extractingMap, setExtractingMap] = useState<Record<string, boolean>>({});
  const [expandedPreview, setExpandedPreview] = useState<string | null>(null);

  const documentSlots: {
    type: DocumentType;
    title: string;
    description: string;
    required: boolean;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      type: 'cv',
      title: 'Curriculum Vitae (CV / Resume)',
      description: 'Format PDF / DOCX / TXT maksimal 5MB.',
      required: true,
      icon: FileText
    },
    {
      type: 'cover_letter',
      title: 'Surat Lamaran (Cover Letter)',
      description: 'Surat pengantar atau pernyataan motivasi diri.',
      required: false,
      icon: Mail
    },
    {
      type: 'certificate',
      title: 'Sertifikat & Portofolio',
      description: 'Bukti kompetensi kerja, lisensi, atau portofolio.',
      required: false,
      icon: Award
    }
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: DocumentType) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    setExtractingMap((prev) => ({ ...prev, [type]: true }));

    try {
      const extractedText = await extractTextFromFile(file, type);

      const newDoc: DocumentAttachment = {
        id: docId,
        name: file.name,
        type,
        size: file.size,
        extractedText,
        uploadedAt: new Date().toISOString()
      };

      const filtered = documents.filter((d) => d.type !== type);
      onDocumentsChange([...filtered, newDoc]);
    } catch (err) {
      console.error('Extraction error:', err);
      alert('Gagal mengekstrak teks file. Silakan coba format PDF atau TXT.');
    } finally {
      setExtractingMap((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleRemove = (type: DocumentType) => {
    onDocumentsChange(documents.filter((d) => d.type !== type));
    if (expandedPreview === type) {
      setExpandedPreview(null);
    }
  };

  return (
    <div className="space-y-3 w-full">
      {documentSlots.map((slot) => {
        const uploadedDoc = documents.find((d) => d.type === slot.type);
        const isExtracting = extractingMap[slot.type];
        const Icon = slot.icon;
        const isPreviewOpen = expandedPreview === slot.type;

        return (
          <div
            key={slot.type}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 overflow-hidden ${
              uploadedDoc
                ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/10 ring-1 ring-emerald-500/20'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700/90'
            }`}
          >
            {/* Header Slot: Icon, Title, and Badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    uploadedDoc
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">
                    {slot.title}
                  </h4>
                </div>
              </div>

              {/* Requirement Badge */}
              <div className="shrink-0">
                {uploadedDoc ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Terunggah</span>
                  </span>
                ) : slot.required ? (
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold">
                    Wajib
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-[10px]">
                    Opsional
                  </span>
                )}
              </div>
            </div>

            {/* Uploaded File Info vs Empty State */}
            {uploadedDoc ? (
              <div className="space-y-2.5 mt-2.5 pt-2.5 border-t border-slate-800/80">
                {/* File Name Pill */}
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-medium text-slate-200 truncate text-[11px]" title={uploadedDoc.name}>
                      {uploadedDoc.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {(uploadedDoc.size / 1024).toFixed(1)} KB
                  </span>
                </div>

                {/* Bottom Actions Row: Preview & Delete */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedPreview(isPreviewOpen ? null : slot.type)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all border ${
                      isPreviewOpen
                        ? 'bg-slate-800 text-white border-slate-600 shadow-sm'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    {isPreviewOpen ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        <span>Tutup Teks AI</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Lihat Ekstraksi Teks AI</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(slot.type)}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-colors border border-rose-500/25 flex items-center gap-1 text-[11px] font-semibold"
                    title="Hapus berkas ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-3">
                <p className="text-[11px] text-slate-400 truncate">
                  {slot.description}
                </p>

                <label className="relative cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-md shadow-emerald-950/30 transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]">
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Membaca...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Unggah</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={(e) => handleFileUpload(e, slot.type)}
                    disabled={isExtracting}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Extracted Text Preview Drawer */}
            {isPreviewOpen && uploadedDoc && (
              <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Teks yang Dianalisis oleh AI:
                  </span>
                  <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[10px]">
                    {uploadedDoc.extractedText.length.toLocaleString('id-ID')} Karakter
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed select-text scrollbar-thin scrollbar-thumb-slate-800">
                  {uploadedDoc.extractedText || 'Teks kosong atau tidak terbaca.'}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
