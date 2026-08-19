'use client';

import React, { useState } from 'react';
import { DocumentAttachment, DocumentType } from '@/lib/types';
import { extractTextFromFile } from '@/lib/document-parser';
import { UploadCloud, FileText, CheckCircle, Trash2, Eye, EyeOff, Award, Mail, FileCheck } from 'lucide-react';

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
    accentColor: string;
  }[] = [
    {
      type: 'cv',
      title: 'Curriculum Vitae (CV / Resume)',
      description: 'Upload PDF/DOCX/TXT berisi riwayat kerja, skill, dan pendidikan Anda.',
      required: true,
      icon: FileText,
      accentColor: 'indigo'
    },
    {
      type: 'cover_letter',
      title: 'Surat Lamaran Kerja (Cover Letter)',
      description: 'Surat pengantar motivasi diri dan alasan Anda melamar posisi ini.',
      required: false,
      icon: Mail,
      accentColor: 'blue'
    },
    {
      type: 'certificate',
      title: 'Sertifikat & Portofolio Pendukung',
      description: 'Sertifikasi keahlian, lisensi profesional, atau bukti pencapaian.',
      required: false,
      icon: Award,
      accentColor: 'emerald'
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

      // Remove existing doc of the same type if it's CV or cover letter, or append for certificates
      let updated: DocumentAttachment[];
      if (type === 'certificate') {
        const newDoc: DocumentAttachment = {
          id: docId,
          name: file.name,
          type,
          size: file.size,
          extractedText,
          uploadedAt: new Date().toISOString()
        };
        updated = [...documents.filter(d => d.type !== type || d.name !== file.name), newDoc];
      } else {
        const newDoc: DocumentAttachment = {
          id: docId,
          name: file.name,
          type,
          size: file.size,
          extractedText,
          uploadedAt: new Date().toISOString()
        };
        updated = [...documents.filter(d => d.type !== type), newDoc];
      }

      onDocumentsChange(updated);
    } catch (err) {
      console.error('Failed to parse file:', err);
      alert('Gagal mengekstrak teks dokumen. Silakan coba file lain.');
    } finally {
      setExtractingMap((prev) => ({ ...prev, [type]: false }));
      // Reset input value so same file can be uploaded again if needed
      e.target.value = '';
    }
  };

  const handleRemoveDoc = (id: string) => {
    onDocumentsChange(documents.filter((d) => d.id !== id));
    if (expandedPreview === id) {
      setExpandedPreview(null);
    }
  };

  const getDocByType = (type: DocumentType) => {
    return documents.find((d) => d.type === type);
  };

  return (
    <div className="space-y-5">
      {documentSlots.map((slot) => {
        const doc = getDocByType(slot.type);
        const isExtracting = extractingMap[slot.type];
        const Icon = slot.icon;

        return (
          <div
            key={slot.type}
            className={`rounded-2xl border transition-all duration-200 ${
              doc
                ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 shadow-xs'
                : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/60'
            }`}
          >
            <div className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Info & Title */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-3 rounded-xl ${
                      doc
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    {doc ? <FileCheck className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {slot.title}
                      </h4>
                      {slot.required ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          Wajib
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-500 dark:text-slate-400">
                          Opsional
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                      {slot.description}
                    </p>
                  </div>
                </div>

                {/* Action / Upload Button */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {doc ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedPreview(expandedPreview === doc.id ? null : doc.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        {expandedPreview === doc.id ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" /> Tutup Isi
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" /> Teks Ekstraksi AI
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition"
                        title="Hapus berkas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      className={`relative cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition ${
                        isExtracting
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                      }`}
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{isExtracting ? 'Mengekstrak AI...' : 'Pilih Berkas'}</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept=".pdf,.docx,.doc,.txt,.rtf,.md"
                        disabled={isExtracting}
                        onChange={(e) => handleFileUpload(e, slot.type)}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Uploaded File Info Card */}
              {doc && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-medium truncate max-w-xs sm:max-w-md">{doc.name}</span>
                    <span className="text-slate-400">({(doc.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    ✓ AI Siap Menganalisis ({doc.extractedText.length} karakter)
                  </span>
                </div>
              )}

              {/* Expanded Extracted Text Preview */}
              {doc && expandedPreview === doc.id && (
                <div className="mt-3 p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono max-h-48 overflow-y-auto leading-relaxed border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 mb-2 border-b border-slate-800 pb-1">
                    🔍 Teks Dokumen yang Dibaca oleh AI Engine:
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs">
                    {doc.extractedText || '(Dokumen tidak mengandung teks terbaca)'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
