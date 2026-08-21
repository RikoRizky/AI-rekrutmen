'use client';

import React, { useState } from 'react';
import { DocumentAttachment, DocumentType } from '@/lib/types';
import { extractTextFromFile } from '@/lib/document-parser';
import { UploadCloud, FileText, CheckCircle, Trash2, Eye, EyeOff, Award, Mail, FileCheck, Loader2 } from 'lucide-react';

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
      description: 'Upload PDF / DOCX / TXT berisi riwayat kerja, keahlian, dan pendidikan Anda.',
      required: true,
      icon: FileText
    },
    {
      type: 'cover_letter',
      title: 'Surat Lamaran Kerja (Cover Letter)',
      description: 'Surat pengantar motivasi diri dan alasan Anda melamar lowongan ini.',
      required: false,
      icon: Mail
    },
    {
      type: 'certificate',
      title: 'Sertifikat & Portofolio Pendukung',
      description: 'Sertifikasi keahlian, lisensi profesional, atau bukti pencapaian proyek.',
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
      const extractedText = await extractTextFromFile(file);

      const newDoc: DocumentAttachment = {
        id: docId,
        name: file.name,
        type,
        size: file.size,
        extractedText,
        uploadedAt: new Date().toISOString()
      };

      // Replace existing doc of this type or add
      const filtered = documents.filter((d) => d.type !== type);
      onDocumentsChange([...filtered, newDoc]);
    } catch (err) {
      console.error('Extraction error:', err);
      alert('Gagal mengekstrak teks file. Silakan coba file lain atau format PDF/TXT biasa.');
    } finally {
      setExtractingMap((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleRemove = (type: DocumentType) => {
    onDocumentsChange(documents.filter((d) => d.type !== type));
  };

  return (
    <div className="space-y-4">
      {documentSlots.map((slot) => {
        const uploadedDoc = documents.find((d) => d.type === slot.type);
        const isExtracting = extractingMap[slot.type];
        const Icon = slot.icon;

        return (
          <div
            key={slot.type}
            className={`p-4 rounded-xl border transition-all ${
              uploadedDoc
                ? 'bg-slate-900 border-emerald-500/40 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    uploadedDoc
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-semibold text-white">
                      {slot.title}
                    </h4>
                    {slot.required ? (
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold">
                        Wajib
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[10px]">
                        Opsional
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {uploadedDoc ? (
                      <span className="text-emerald-400 font-medium">
                        ✓ {uploadedDoc.name} ({(uploadedDoc.size / 1024).toFixed(1)} KB)
                      </span>
                    ) : (
                      slot.description
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {uploadedDoc ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPreview(expandedPreview === slot.type ? null : slot.type)
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors border border-slate-700"
                    >
                      {expandedPreview === slot.type ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Tutup Teks</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Teks AI</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(slot.type)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20"
                      title="Hapus Dokumen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <label className="relative cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all">
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Membaca Dokumen...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Unggah Berkas</span>
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
                )}
              </div>
            </div>

            {/* Extracted Text Preview Drawer */}
            {expandedPreview === slot.type && uploadedDoc && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span className="font-semibold text-slate-300">
                    Teks Ekstraksi yang Dibaca oleh Gemini AI:
                  </span>
                  <span>{uploadedDoc.extractedText.length} Karakter</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">
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
