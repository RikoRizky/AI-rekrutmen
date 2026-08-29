import { Job, DocumentAttachment, AiEvaluationResult, FitLevel, RecommendationDecision, DetailedInterviewQuestion, UserBiodata, DocumentOwnershipVerification } from './types';

export interface EvaluateApplicantParams {
  job: Job;
  documents: DocumentAttachment[];
  applicantName: string;
  applicantHeadline?: string;
  applicantBiodata?: UserBiodata;
  applicantEmail?: string;
  applicantPhone?: string;
  geminiApiKey?: string;
  preferredModel?: string;
}

const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-1.5-flash',
  'gemini-3.5-flash',
  'gemini-3.6-flash'
];

/**
 * Main evaluation entry point.
 * Uses Google Gemini API (Real AI) if API key is provided, with graceful intelligent local NLP engine fallback.
 * Strictly verifies document ownership & identity consistency between official applicant biodata and uploaded CV/documents.
 */
export async function evaluateApplicantWithAi({
  job,
  documents,
  applicantName,
  applicantHeadline = '',
  applicantBiodata,
  applicantEmail = '',
  applicantPhone = '',
  geminiApiKey = '',
  preferredModel = (typeof process !== 'undefined' && process.env?.GEMINI_MODEL) || 'gemini-2.5-flash'
}: EvaluateApplicantParams): Promise<AiEvaluationResult> {
  const startTime = Date.now();

  // Combine extracted document texts
  const cvDoc = documents.find(d => d.type === 'cv');
  const coverLetterDoc = documents.find(d => d.type === 'cover_letter');
  const certificateDocs = documents.filter(d => d.type === 'certificate');
  const portfolioDocs = documents.filter(d => d.type === 'portfolio');
  const otherDocs = documents.filter(d => !['cv', 'cover_letter', 'certificate', 'portfolio'].includes(d.type));

  const allDocumentsText = `
=== DOKUMEN CV / RESUME PELAMAR ===
${cvDoc ? (cvDoc.extractedText || `[File: ${cvDoc.name}]`) : 'Tidak dilampirkan'}

=== SURAT LAMARAN (COVER LETTER) ===
${coverLetterDoc ? (coverLetterDoc.extractedText || `[File: ${coverLetterDoc.name}]`) : 'Tidak dilampirkan'}

=== SERTIFIKAT & PENDUKUNG ===
${certificateDocs.length > 0 ? certificateDocs.map(c => `[Sertifikat: ${c.name}]\n${c.extractedText || 'Tercantum berkas sertifikat'}`).join('\n\n') : 'Tidak ada'}

=== PORTOFOLIO / PROYEK ===
${portfolioDocs.length > 0 ? portfolioDocs.map(p => `[Portofolio: ${p.name}]\n${p.extractedText || 'Tercantum berkas portofolio'}`).join('\n\n') : 'Tidak ada'}

=== DOKUMEN LAINNYA ===
${otherDocs.length > 0 ? otherDocs.map(o => `[${o.name}]\n${o.extractedText || ''}`).join('\n\n') : 'Tidak ada'}
  `.trim();

  const apiKey = (geminiApiKey || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') || '').trim();

  // If running in browser and client has no direct key, delegate to server /api/ai-analyze (which has GEMINI_API_KEY from .env.local)
  if (typeof window !== 'undefined' && (!apiKey || apiKey.length < 10)) {
    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job,
          documents,
          applicantName,
          applicantHeadline,
          applicantBiodata,
          applicantEmail,
          applicantPhone,
          preferredModel
        })
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        return data.evaluation;
      }
    } catch (e) {
      console.warn('Server AI analyze route delegation failed:', e);
    }
  }

  // If Gemini API Key is available (direct or server), run authentic Gemini AI analysis
  if (apiKey && apiKey.length > 10) {
    try {
      const geminiResult = await callGeminiApiWithFallback(
        job,
        applicantName,
        applicantHeadline,
        applicantBiodata,
        applicantEmail,
        applicantPhone,
        allDocumentsText,
        apiKey,
        preferredModel
      );
      if (geminiResult) {
        return {
          ...geminiResult,
          latencyMs: Date.now() - startTime
        };
      }
    } catch (err) {
      console.error('Gemini API call encountered an issue:', err);
      // Fall through to local intelligent engine
    }
  }

  // Fallback to local intelligent NLP analysis
  const localResult = runIntelligentLocalAnalysis(
    job,
    applicantName,
    applicantHeadline,
    documents,
    applicantBiodata,
    applicantEmail,
    applicantPhone
  );
  return {
    ...localResult,
    isRealAi: false,
    modelUsed: 'Intelligent Local NLP Engine (Identity Guard)',
    latencyMs: Date.now() - startTime
  };
}

/**
 * Calls Gemini API with automatic model cascade (tries preferredModel, then fallback list).
 */
async function callGeminiApiWithFallback(
  job: Job,
  applicantName: string,
  applicantHeadline: string,
  applicantBiodata: UserBiodata | undefined,
  applicantEmail: string,
  applicantPhone: string,
  documentsText: string,
  apiKey: string,
  preferredModel: string
): Promise<AiEvaluationResult | null> {
  const modelsToTry = Array.from(new Set([preferredModel, ...FALLBACK_MODELS]));
  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const result = await callSingleGeminiModel(
        job,
        applicantName,
        applicantHeadline,
        applicantBiodata,
        applicantEmail,
        applicantPhone,
        documentsText,
        apiKey,
        model
      );
      if (result) {
        return result;
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Model ${model} failed (${lastError.message}), trying next model...`);
    }
  }

  if (lastError) {
    throw lastError;
  }
  return null;
}

/**
 * Execute a single call to Google Gemini GenerateContent endpoint.
 */
async function callSingleGeminiModel(
  job: Job,
  applicantName: string,
  applicantHeadline: string,
  applicantBiodata: UserBiodata | undefined,
  applicantEmail: string,
  applicantPhone: string,
  documentsText: string,
  apiKey: string,
  modelName: string
): Promise<AiEvaluationResult | null> {
  const officialName = applicantBiodata?.fullName || applicantName;
  const officialPhone = applicantBiodata?.phone || applicantPhone || 'Tidak dicantumkan';
  const officialEmail = applicantEmail || 'Tidak dicantumkan';
  const officialEducation = applicantBiodata?.lastEducation || 'S1';
  const officialMajor = applicantBiodata?.educationMajor || 'Tidak dicantumkan';
  const officialInstitution = applicantBiodata?.institutionName || 'Tidak dicantumkan';
  const officialGradYear = applicantBiodata?.graduationYear || 'Tidak dicantumkan';
  const officialGpa = applicantBiodata?.gpa || 'Tidak dicantumkan';
  const officialBio = applicantBiodata?.bioSummary || applicantHeadline || 'Tidak dicantumkan';

  const prompt = `
Anda adalah AI Human Resource Director & Chief ATS Screening Specialist bersertifikasi internasional dengan keahlian Audit Forensik Dokumen & Verifikasi Identitas Kandidat.
Lakukan analisis mendalam, kritis, tajam, objektif, dan komprehensif terhadap seluruh berkas lamaran kandidat (CV, Surat Lamaran, Portofolio, Sertifikat) dibandingkan dengan kualifikasi lowongan pekerjaan serta BIODATA RESMI PELAMAR.

=== INFORMASI LOWONGAN PEKERJAAN ===
Judul Posisi: ${job.title}
Perusahaan: ${job.companyName}
Departemen: ${job.department}
Tipe Pekerjaan: ${job.type}
Tingkat Pengalaman yang Dibutuhkan: ${job.experienceLevel}
Pendidikan Minimum: ${job.minEducation}
Kisaran Gaji: ${job.salaryRange}
Keahlian Kunci Wajib (Key Skills): ${job.keySkills.join(', ')}
Deskripsi Pekerjaan:
${job.description}

Persyaratan & Kualifikasi:
${job.requirements.map(r => `- ${r}`).join('\n')}

${job.responsibilities && job.responsibilities.length > 0 ? `Tanggung Jawab Utama:\n${job.responsibilities.map(resp => `- ${resp}`).join('\n')}` : ''}

=== DATA BIODATA RESMI PELAMAR (AKUN KTP TERVERIFIKASI SISTEM) ===
Nama Lengkap Resmi (KTP): ${officialName}
Email Terdaftar: ${officialEmail}
No. WhatsApp / Telepon: ${officialPhone}
Pendidikan Terakhir: ${officialEducation}
Jurusan / Program Studi: ${officialMajor}
Universitas / Institusi / Sekolah: ${officialInstitution}
Tahun Lulus: ${officialGradYear}
IPK: ${officialGpa}
Ringkasan Karir / Bio: ${officialBio}

=== BERKAS DOKUMEN ASLI PELAMAR (CV, SURAT LAMARAN, SERTIFIKAT, PORTOFOLIO) ===
${documentsText}

=== ATURAN KRITIS #1: AUDIT KEASLIAN & KEPEMILIKAN DOKUMEN (IDENTITY & FRAUD VERIFICATION - ZERO TOLERANCE) ===
Anda HARUS memeriksa apakah dokumen yang diunggah benar-benar milik pelamar (${officialName}) atau milik orang lain:
1. EKSTRAKSI IDENTITAS DOKUMEN:
   - Baca dan catat nama lengkap, email, nomor HP, universitas yang tertulis di bagian atas CV, salam surat lamaran, sertifikat, atau portofolio.
2. PENCOCOKAN DENGAN BIODATA RESMI:
   - Cocokkan nama yang tertulis di CV dengan Nama Lengkap Resmi pelamar (${officialName}).
   - Cocokkan nama pada surat lamaran dan sertifikat.
3. ATURAN PENALTI FATAL JIKA DOKUMEN MILIK ORANG LAIN (FRAUD / SALAH BERKAS):
   - JIKA nama di CV atau berkas pendukung terbukti milik ORANG LAIN (misalnya nama pelamar adalah "${officialName}", tetapi di CV tertulis nama orang lain yang berbeda jauh seperti "Budi Santoso", "Riko Rizky Baswara", dsb.):
     * "documentOwnership.status" HARUS diisi "CONFIRMED_FRAUD_OR_IMPERSONATION" atau "SUSPICIOUS_MISMATCH".
     * "documentOwnership.isAuthenticOwner" HARUS false.
     * "documentOwnership.identityConfidence" HARUS "Fraud/Impersonation" atau "Low".
     * DILARANG KERAS MEMBERIKAN SKOR TINGGI! Walaupun skill di CV tersebut 100% cocok dengan lowongan, overallScore MAKSIMAL HANYA 5 - 15 (Low Match), karena CV tersebut bukan milik pelamar yang mengajukan lamaran!
     * technicalScore, experienceScore, educationScore, motivationScore HARUS di-penalti berat (< 20).
     * "recommendation" HARUS "NOT_SUITABLE".
     * "fitLevel" HARUS "Low Match".
     * "executiveSummary" HARUS diawali dengan kalimat peringatan tajam dan tegas kepada HRD:
       "PERINGATAN AUDIT ATS: Terdeteksi ketidaksesuaian identitas fatal / indikasi kuat impersonasi atau salah unggah dokumen. Dokumen CV mencantumkan nama [Sebutkan Nama di CV], yang sama sekali tidak sesuai dengan identitas resmi akun pelamar (${officialName})."
     * "riskFactors" HARUS mencantumkan: "Dokumen CV atas nama orang lain ([Nama di CV]) bukan milik pelamar akun (${officialName})".
   - JIKA nama di CV cocok/sesuai dengan pelamar (${officialName}):
     * "documentOwnership.status": "VERIFIED_MATCH"
     * "documentOwnership.isAuthenticOwner": true
     * "documentOwnership.identityConfidence": "High"
     * Nilai kesesuaian dihitung secara adil dan objektif sesuai kualifikasi pekerjaan.

=== INSTRUKSI PENILAIAN KOMPETENSI (JIKA DOKUMEN VALID) ===
1. Berikan penilaian skor objektif (skala 0 - 100) untuk 5 Dimensi Kompetensi:
   - technicalScore: Kesesuaian nyata keahlian teknis (${job.keySkills.join(', ')}).
   - experienceScore: Kesesuaian tahun pengalaman, seniority, dan kedalaman industri.
   - educationScore: Kesesuaian jenjang pendidikan, jurusan, dan sertifikasi.
   - motivationScore: Kualitas surat lamaran dan keseriusan pelamar.
   - cultureFitScore: Keselarasan budaya kerja dan etika profesional.
   - overallScore: Nilai agregat tertimbang (35% Tech + 30% Exp + 20% Edu + 15% Mot).
2. Tentukan fitLevel: "Top Match" (>= 85) | "High Match" (70 - 84) | "Moderate Match" (50 - 69) | "Low Match" (< 50).
3. Tentukan recommendation: "STRONGLY_RECOMMENDED" | "INTERVIEW" | "CONSIDER" | "NOT_SUITABLE".
4. Susun "executiveSummary" dalam Bahasa Indonesia formal, lugas, dan tajam (3-4 kalimat).
5. Tulis "recommendationReason" (1-2 kalimat tegas).
6. Tulis "strengths" (2-4 poin) dan "gaps" (2-4 poin).
7. Identifikasi "matchedSkills", "missingSkills", dan "additionalSkills".
8. Buat 3 pertanyaan wawancara terpersonalisasi di "detailedQuestions".

KEMBALIKAN HANYA JSON MURNI YANG VALID (Valid JSON Object) TANPA MARKDOWN BACKTICKS ATAU TEKS LAIN. Format JSON:
{
  "documentOwnership": {
    "status": "VERIFIED_MATCH",
    "isAuthenticOwner": true,
    "identityConfidence": "High",
    "detectedNamesInDocuments": ["Nama yang tertulis di dokumen"],
    "mismatchedFields": [],
    "ownershipAuditNotes": "Hasil verifikasi kesesuaian identitas nama dan biodata pelamar."
  },
  "overallScore": 88,
  "technicalScore": 90,
  "experienceScore": 85,
  "educationScore": 90,
  "motivationScore": 85,
  "cultureFitScore": 88,
  "fitLevel": "Top Match",
  "executiveSummary": "string",
  "strengths": ["string", "string"],
  "gaps": ["string", "string"],
  "matchedSkills": ["string"],
  "missingSkills": ["string"],
  "additionalSkills": ["string"],
  "recommendation": "STRONGLY_RECOMMENDED",
  "recommendationReason": "string",
  "suggestedInterviewQuestions": ["string"],
  "detailedQuestions": [
    {
      "question": "string",
      "context": "string",
      "targetCriteria": "string"
    }
  ],
  "riskFactors": []
}
  `.trim();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API [${modelName}] HTTP ${response.status}: ${errorText}`);
  }

  const json = await response.json();
  const parts = json.candidates?.[0]?.content?.parts || [];
  let textOutput = '';
  for (const part of parts) {
    if (typeof part.text === 'string') {
      textOutput += part.text;
    }
  }

  if (!textOutput.trim()) {
    throw new Error(`Empty response from Gemini API [${modelName}]`);
  }

  // Sanitize and parse JSON
  let parsed: Record<string, any>;
  try {
    const cleanedText = textOutput
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    parsed = JSON.parse(cleanedText);
  } catch {
    const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error(`Failed to parse Gemini JSON output: ${textOutput.slice(0, 100)}`);
    }
  }

  // Extract raw documents for local identity cross-check safety guard
  const localAudit = auditDocumentIdentity(
    officialName,
    officialEmail,
    documentsText
  );

  // If AI or local audit indicates fraud/mismatch, apply hard security override
  const isFraudOrMismatch =
    parsed.documentOwnership?.isAuthenticOwner === false ||
    parsed.documentOwnership?.status === 'CONFIRMED_FRAUD_OR_IMPERSONATION' ||
    parsed.documentOwnership?.status === 'SUSPICIOUS_MISMATCH' ||
    !localAudit.isAuthenticOwner;

  let finalOverallScore = Math.min(100, Math.max(0, Number(parsed.overallScore) || 75));
  let finalTechnicalScore = Math.min(100, Math.max(0, Number(parsed.technicalScore) || 75));
  let finalExperienceScore = Math.min(100, Math.max(0, Number(parsed.experienceScore) || 75));
  let finalEducationScore = Math.min(100, Math.max(0, Number(parsed.educationScore) || 75));
  let finalMotivationScore = Math.min(100, Math.max(0, Number(parsed.motivationScore) || 75));
  let finalFitLevel: FitLevel = parsed.fitLevel || 'High Match';
  let finalRecommendation: RecommendationDecision = parsed.recommendation || 'INTERVIEW';
  let finalExecutiveSummary = parsed.executiveSummary || 'Analisis berkas kandidat telah selesai diproses.';
  let finalRecommendationReason = parsed.recommendationReason || 'Kandidat memiliki potensi yang relevan dengan spesifikasi pekerjaan.';
  let finalRiskFactors: string[] = Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [];

  let finalDocOwnership: DocumentOwnershipVerification = {
    status: parsed.documentOwnership?.status || (localAudit.isAuthenticOwner ? 'VERIFIED_MATCH' : localAudit.status),
    isAuthenticOwner: parsed.documentOwnership?.isAuthenticOwner !== undefined ? parsed.documentOwnership.isAuthenticOwner : localAudit.isAuthenticOwner,
    identityConfidence: parsed.documentOwnership?.identityConfidence || localAudit.confidence,
    detectedNamesInDocuments: Array.isArray(parsed.documentOwnership?.detectedNamesInDocuments) && parsed.documentOwnership.detectedNamesInDocuments.length > 0
      ? parsed.documentOwnership.detectedNamesInDocuments
      : localAudit.detectedNames,
    mismatchedFields: Array.isArray(parsed.documentOwnership?.mismatchedFields) && parsed.documentOwnership.mismatchedFields.length > 0
      ? parsed.documentOwnership.mismatchedFields
      : localAudit.mismatches,
    ownershipAuditNotes: parsed.documentOwnership?.ownershipAuditNotes || localAudit.notes,
    verifiedAt: new Date().toISOString()
  };

  if (isFraudOrMismatch) {
    finalOverallScore = Math.min(finalOverallScore, 13);
    finalTechnicalScore = Math.min(finalTechnicalScore, 15);
    finalExperienceScore = Math.min(finalExperienceScore, 10);
    finalEducationScore = Math.min(finalEducationScore, 15);
    finalMotivationScore = Math.min(finalMotivationScore, 10);
    finalFitLevel = 'Low Match';
    finalRecommendation = 'NOT_SUITABLE';

    finalDocOwnership.isAuthenticOwner = false;
    if (finalDocOwnership.status === 'VERIFIED_MATCH') {
      finalDocOwnership.status = localAudit.status;
      finalDocOwnership.identityConfidence = localAudit.confidence;
      finalDocOwnership.ownershipAuditNotes = localAudit.notes;
    }

    const otherPerson = finalDocOwnership.detectedNamesInDocuments.join(', ') || 'Nama Lain';
    if (!finalExecutiveSummary.toLowerCase().includes('bukan milik') && !finalExecutiveSummary.toLowerCase().includes('ketidaksesuaian')) {
      finalExecutiveSummary = `PERINGATAN AUDIT ATS: Berkas dokumen (CV / Surat Lamaran) teridentifikasi kuat bukan milik pelamar akun. Dokumen mencantumkan identitas atas nama [${otherPerson}], yang tidak sesuai dengan biodata resmi pelamar (${officialName}). Indikasi salah kirim berkas atau impersonasi dokumen.`;
    }
    finalRecommendationReason = `Kandidat langsung dinyatakan TIDAK LOLOS (NOT_SUITABLE) akibat ketidaksesuaian identitas kepemilikan dokumen yang fatal.`;
    if (!finalRiskFactors.some(r => r.includes('identitas') || r.includes('Inkonsistensi'))) {
      finalRiskFactors.unshift(`Inkonsistensi Identitas Fatal: Dokumen CV atas nama "${otherPerson}" bukan milik pelamar akun (${officialName})`);
    }
  }

  // Normalise suggestedInterviewQuestions if detailedQuestions exists
  const suggestedQuestions: string[] = Array.isArray(parsed.suggestedInterviewQuestions) && parsed.suggestedInterviewQuestions.length > 0
    ? parsed.suggestedInterviewQuestions
    : (parsed.detailedQuestions || []).map((q: DetailedInterviewQuestion) => q.question);

  const displayModelName = modelName.includes('3.6')
    ? 'Google Gemini 3.6 Flash'
    : modelName.includes('3.7')
    ? 'Google Gemini 3.7 Flash'
    : modelName.includes('flash-latest')
    ? 'Google Gemini Flash Latest'
    : `Google ${modelName}`;

  return {
    overallScore: finalOverallScore,
    technicalScore: finalTechnicalScore,
    experienceScore: finalExperienceScore,
    educationScore: finalEducationScore,
    motivationScore: finalMotivationScore,
    cultureFitScore: parsed.cultureFitScore ? Math.min(100, Math.max(0, Number(parsed.cultureFitScore))) : undefined,
    fitLevel: finalFitLevel,
    executiveSummary: finalExecutiveSummary,
    strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : ['Memiliki profil kompetensi yang relevan'],
    gaps: Array.isArray(parsed.gaps) && parsed.gaps.length > 0 ? parsed.gaps : ['Tidak ditemukan kesenjangan mencolok'],
    matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [],
    missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
    additionalSkills: Array.isArray(parsed.additionalSkills) ? parsed.additionalSkills : [],
    recommendation: finalRecommendation,
    recommendationReason: finalRecommendationReason,
    suggestedInterviewQuestions: suggestedQuestions,
    detailedQuestions: Array.isArray(parsed.detailedQuestions) ? parsed.detailedQuestions : [],
    riskFactors: finalRiskFactors,
    documentOwnership: finalDocOwnership,
    isRealAi: true,
    modelUsed: displayModelName,
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Intelligent Document Identity & Ownership Cross-Checking Engine
 */
export function auditDocumentIdentity(
  officialName: string,
  officialEmail: string,
  documentsInput: DocumentAttachment[] | string
): {
  isAuthenticOwner: boolean;
  status: 'VERIFIED_MATCH' | 'SUSPICIOUS_MISMATCH' | 'CONFIRMED_FRAUD_OR_IMPERSONATION' | 'PARTIAL_MISMATCH';
  confidence: 'High' | 'Medium' | 'Low' | 'Fraud/Impersonation';
  detectedNames: string[];
  mismatches: string[];
  notes: string;
} {
  const combinedText = typeof documentsInput === 'string'
    ? documentsInput
    : documentsInput.map(d => d.extractedText || `[File: ${d.name}]`).join('\n');

  const lowerText = combinedText.toLowerCase();
  const cleanOfficial = officialName.trim().toLowerCase();
  const officialTokens = cleanOfficial.split(/\s+/).filter(t => t.length >= 2);

  // 1. Check if official full name or substantial tokens exist in the document text
  const isFullNameInDoc = lowerText.includes(cleanOfficial);
  const matchingTokens = officialTokens.filter(token => lowerText.includes(token));
  const tokenMatchRatio = officialTokens.length > 0 ? matchingTokens.length / officialTokens.length : 0;

  // If full name is in document OR majority of name tokens (at least 2 words or >= 60% tokens) are in document:
  // It is definitively the candidate's authentic document!
  const hasStrongOfficialNameMatch = isFullNameInDoc || tokenMatchRatio >= 0.6 || (officialTokens.length >= 2 && matchingTokens.length >= 2);

  if (hasStrongOfficialNameMatch) {
    return {
      isAuthenticOwner: true,
      status: 'VERIFIED_MATCH',
      confidence: 'High',
      detectedNames: [officialName],
      mismatches: [],
      notes: `Identitas berkas sah. Nama pada dokumen CV cocok dengan biodata resmi pelamar (${officialName}).`
    };
  }

  // 2. If name is NOT in document, detect if another person's name is present
  const lines = combinedText.split('\n').map(l => l.trim()).filter(Boolean);
  const detectedOtherNames: string[] = [];

  const blacklistKeywords = [
    'curriculum', 'vitae', 'resume', 'data pribadi', 'personal info', 'contact', 'pengalaman',
    'pendidikan', 'ringkasan', 'summary', 'profile', 'tentang saya', 'about me', 'engineer',
    'developer', 'specialist', 'manager', 'jakarta', 'indonesia', 'indonesian', 'skills',
    'keahlian', 'alamat', 'address', 'telepon', 'phone', 'email', 'linkedin', 'github', 'portofolio',
    'dokumen', 'berkas', 'sertifikat', 'surat lamaran', 'cover letter', 'yogyakarta', 'surabaya', 'bandung',
    'technology', 'bnsp', 'work experience', 'key projects', 'organization', 'education', 'certifications',
    'proyek', 'pengalaman kerja', 'prestasi', 'training', 'pelatihan'
  ];

  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const rawLine = lines[i];
    if (rawLine.length < 3 || rawLine.length > 45) continue;

    const lower = rawLine.toLowerCase();
    if (blacklistKeywords.some(kw => lower.includes(kw))) {
      continue;
    }

    const cleanLine = rawLine.replace(/^(nama lengkap|nama|name|full name)\s*[:\-]?\s*/i, '').trim();
    if (/^[A-Za-z\s'.]{4,40}$/.test(cleanLine)) {
      const words = cleanLine.split(/\s+/);
      if (words.length >= 2 && words.length <= 4) {
        const hasBlacklist = words.some(w => blacklistKeywords.includes(w.toLowerCase()));
        if (!hasBlacklist) {
          detectedOtherNames.push(cleanLine);
        }
      }
    }
  }

  // Also check Cover Letter signature lines
  for (let i = 0; i < lines.length; i++) {
    if (/^(hormat saya|salam hormat|salam hangat|regards|sincerely|tertanda)/i.test(lines[i])) {
      const nextLine = (lines[i + 1] || '').trim();
      const cleanNext = nextLine.replace(/^[(\[]+|[)\]]+$/g, '').trim();
      if (/^[A-Za-z\s'.]{4,40}$/.test(cleanNext)) {
        const words = cleanNext.split(/\s+/);
        if (words.length >= 2 && words.length <= 4 && !blacklistKeywords.some(kw => cleanNext.toLowerCase().includes(kw))) {
          detectedOtherNames.push(cleanNext);
        }
      }
    }
  }

  const uniqueOtherNames = Array.from(new Set(detectedOtherNames));

  if (uniqueOtherNames.length > 0) {
    const otherPersonName = uniqueOtherNames[0];
    return {
      isAuthenticOwner: false,
      status: 'CONFIRMED_FRAUD_OR_IMPERSONATION',
      confidence: 'Fraud/Impersonation',
      detectedNames: uniqueOtherNames,
      mismatches: [`Nama di dokumen ("${otherPersonName}") tidak cocok dengan Akun/KTP ("${officialName}")`],
      notes: `TERDETEKSI DOKUMEN ORANG LAIN: Berkas dokumen mencantumkan identitas atas nama "${otherPersonName}", sedangkan pelamar akun terdaftar resmi atas nama "${officialName}". Berkas ini bukan milik pelamar.`
    };
  }

  if (combinedText.length > 150) {
    return {
      isAuthenticOwner: false,
      status: 'SUSPICIOUS_MISMATCH',
      confidence: 'Low',
      detectedNames: ['Identitas Tidak Teridentifikasi'],
      mismatches: [`Nama pelamar "${officialName}" tidak teridentifikasi pada teks dokumen berkas lamaran.`],
      notes: `Inkonsistensi identitas terdeteksi: Nama resmi "${officialName}" tidak ditemukan di dalam teks berkas yang dilampirkan.`
    };
  }

  return {
    isAuthenticOwner: true,
    status: 'VERIFIED_MATCH',
    confidence: 'Medium',
    detectedNames: [officialName],
    mismatches: [],
    notes: `Dokumen terlampir atas nama pelamar (${officialName}).`
  };
}

/**
 * Built-in Intelligent Screening & NLP Matching Engine
 * Used as high-performance local fallback if Gemini is offline.
 */
export function runIntelligentLocalAnalysis(
  job: Job,
  applicantName: string,
  applicantHeadline: string = '',
  documents: DocumentAttachment[] = [],
  applicantBiodata?: UserBiodata,
  applicantEmail: string = '',
  applicantPhone: string = ''
): AiEvaluationResult {
  const officialName = applicantBiodata?.fullName || applicantName;
  const officialPhone = applicantBiodata?.phone || applicantPhone || '';
  const officialEmail = applicantEmail || '';

  const combinedText = [
    applicantHeadline,
    ...documents.map(d => d.extractedText || `[File: ${d.name}]`)
  ].join(' ').toLowerCase();

  // Run Identity Cross-Check Audit
  const identityAudit = auditDocumentIdentity(officialName, officialEmail, documents);

  // 1. Key Skills Matching
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of job.keySkills) {
    const sLower = skill.toLowerCase();
    const variations: Record<string, string[]> = {
      'react.js': ['react', 'reactjs', 'react.js', 'react js', 'next.js', 'nextjs'],
      'next.js': ['next.js', 'nextjs', 'next js', 'app router', 'ssr'],
      'typescript': ['typescript', 'ts'],
      'tailwind css': ['tailwind', 'tailwindcss', 'tailwind css', 'css'],
      'talent sourcing': ['sourcing', 'talent acquisition', 'headhunter', 'linkedin recruiter'],
      'ats system': ['ats', 'applicant tracking', 'greenhouse', 'lever', 'workday'],
      'behavioral interview (bei)': ['bei', 'behavioral interview', 'star method', 'interview kompetensi'],
      'python': ['python', 'pandas', 'numpy', 'scipy', 'django', 'flask'],
      'sql': ['sql', 'postgresql', 'mysql', 'queries', 'rdbms', 'sqlite'],
      'tableau / power bi': ['tableau', 'power bi', 'powerbi', 'looker', 'metabase'],
      'coffee brewing': ['coffee', 'barista', 'brewing', 'v60', 'espresso', 'manual brew', 'latte art'],
      'espresso calibration': ['espresso', 'grinder', 'calibration', 'mesin kopi', 'coffee machine'],
      'inventory management': ['inventory', 'stok', 'stock', 'pergudangan', 'fifo', 'pos system'],
      'customer service': ['pelayanan', 'customer service', 'hospitality', 'kasir', 'waiter', 'barista']
    };

    const searchTokens = variations[sLower] || [sLower];
    const isMatched = searchTokens.some(token => combinedText.includes(token));

    if (isMatched) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const isCompleteMismatch = job.keySkills.length > 0 && matchedSkills.length === 0;

  let technicalScore = isCompleteMismatch ? 10 : Math.round((matchedSkills.length / (job.keySkills.length || 1)) * 85 + (matchedSkills.length > 0 ? 15 : 0));
  technicalScore = Math.min(99, Math.max(10, technicalScore));

  // 2. Experience Level Evaluation
  let experienceScore = 50;
  const expMatches = combinedText.match(/(\d+)\+?\s*(?:tahun|thn|years|year|th)\s*(?:pengalaman|experience)?/g) || [];
  let maxYearsFound = 0;
  for (const match of expMatches) {
    const num = parseInt(match);
    if (!isNaN(num) && num > maxYearsFound && num < 30) {
      maxYearsFound = num;
    }
  }

  if (isCompleteMismatch) {
    experienceScore = 15;
  } else if (job.experienceLevel.includes('Senior') || job.experienceLevel.includes('5+')) {
    if (maxYearsFound >= 5 || combinedText.includes('senior') || combinedText.includes('lead')) {
      experienceScore = 92;
    } else if (maxYearsFound >= 3 || combinedText.includes('mid-level')) {
      experienceScore = 68;
    } else {
      experienceScore = 45;
    }
  } else if (job.experienceLevel.includes('Mid-Level') || job.experienceLevel.includes('3-5')) {
    if (maxYearsFound >= 3 || combinedText.includes('mid') || combinedText.includes('experienced')) {
      experienceScore = 90;
    } else if (maxYearsFound >= 1) {
      experienceScore = 75;
    } else {
      experienceScore = 50;
    }
  } else {
    experienceScore = maxYearsFound >= 1 ? 90 : 80;
  }

  // 3. Education & Certifications Evaluation
  let educationScore = 40;
  const hasBachelor = combinedText.includes('s1') || combinedText.includes('d4') || combinedText.includes('sarjana') || combinedText.includes('bachelor') || combinedText.includes('universitas') || combinedText.includes('institut');
  const hasCertificate = documents.some(d => d.type === 'certificate') || combinedText.includes('sertifikat') || combinedText.includes('certified') || combinedText.includes('certification');
  
  if (hasBachelor && hasCertificate) {
    educationScore = 95;
  } else if (hasBachelor) {
    educationScore = 85;
  } else if (hasCertificate) {
    educationScore = 75;
  } else {
    educationScore = 40;
  }

  // 4. Motivation & Cover Letter Evaluation
  let motivationScore = isCompleteMismatch ? 10 : 65;
  const hasCoverLetter = documents.some(d => d.type === 'cover_letter');
  if (hasCoverLetter) {
    const cl = documents.find(d => d.type === 'cover_letter')!;
    if (cl.extractedText && cl.extractedText.length > 200 && !isCompleteMismatch) {
      motivationScore = 92;
    } else if (!isCompleteMismatch) {
      motivationScore = 78;
    }
  }

  // 5. Aggregate Overall Score
  let overallScore = isCompleteMismatch
    ? 10
    : Math.round(
        technicalScore * 0.35 +
        experienceScore * 0.30 +
        educationScore * 0.20 +
        motivationScore * 0.15
      );

  // 6. Fit Level & Recommendation
  let fitLevel: FitLevel = 'Moderate Match';
  let recommendation: RecommendationDecision = 'CONSIDER';

  if (overallScore >= 85) {
    fitLevel = 'Top Match';
    recommendation = 'STRONGLY_RECOMMENDED';
  } else if (overallScore >= 70) {
    fitLevel = 'High Match';
    recommendation = 'INTERVIEW';
  } else if (overallScore >= 50) {
    fitLevel = 'Moderate Match';
    recommendation = 'CONSIDER';
  } else {
    fitLevel = 'Low Match';
    recommendation = 'NOT_SUITABLE';
  }

  // 7. Dynamic Strengths & Gaps
  const strengths: string[] = [];
  const gaps: string[] = [];

  if (hasBachelor) {
    strengths.push(`Pendidikan formal pelamar melampaui batas minimum kualifikasi yang disyaratkan.`);
  }
  if (hasCertificate) {
    strengths.push(`Memiliki rekam jejak sertifikasi kompetensi profesional pendukung.`);
  }
  if (matchedSkills.length > 0) {
    strengths.push(`Menguasai ${matchedSkills.length} dari ${job.keySkills.length} keahlian utama yang disyaratkan (${matchedSkills.slice(0, 3).join(', ')}).`);
  }

  if (isCompleteMismatch) {
    gaps.push(`Tidak memiliki keahlian teknis maupun pengoperasian tools yang disyaratkan untuk posisi ${job.title}.`);
    gaps.push(`Seluruh pengalaman kerja dan kompetensi kandidat berada di domain industri yang berbeda.`);
  } else {
    if (missingSkills.length > 0) {
      gaps.push(`Belum teridentifikasi pengalaman spesifik pada: ${missingSkills.slice(0, 4).join(', ')}.`);
    }
    if (experienceScore < 70) {
      gaps.push(`Tingkat pengalaman belum sepenuhnya mencapai target ${job.experienceLevel} yang disyaratkan.`);
    }
  }

  let executiveSummary = '';
  let recommendationReason = '';
  const riskFactors: string[] = [];

  if (isCompleteMismatch) {
    executiveSummary = `Kandidat ${officialName} mengajukan berkas lamaran yang tidak relevan dengan posisi ${job.title}. Seluruh pengalaman kerja, sertifikasi, dan kompetensi teknis kandidat berada pada domain keahlian yang berbeda dengan kualifikasi yang dibutuhkan.`;
    recommendationReason = `Kandidat tidak memenuhi kualifikasi teknis dan pengalaman operasional yang dibutuhkan untuk posisi ${job.title}.`;
  } else if (fitLevel === 'Top Match') {
    executiveSummary = `Kandidat ${officialName} memiliki keselarasan profil yang sangat kuat untuk posisi ${job.title}. Penguasaan keahlian (${matchedSkills.join(', ')}) dan riwayat karir memenuhi standar tinggi yang disyaratkan.`;
    recommendationReason = 'Sangat direkomendasikan untuk segera dijadwalkan wawancara dengan Hiring Manager.';
  } else if (fitLevel === 'High Match') {
    executiveSummary = `Kandidat ${officialName} menunjukkan kompetensi yang relevan dan solid untuk posisi ${job.title}, dengan penguasaan pada mayoritas keahlian kunci.`;
    recommendationReason = 'Layak untuk diikutsertakan ke tahap interview atau technical assessment.';
  } else if (fitLevel === 'Moderate Match') {
    executiveSummary = `Kandidat ${officialName} memiliki dasar keahlian yang cukup, namun masih memiliki celah pada beberapa tools utama untuk posisi ${job.title}.`;
    recommendationReason = 'Dapat dipertimbangkan sebagai opsi cadangan atau jenjang pendukung.';
  } else {
    executiveSummary = `Profil kandidat ${officialName} belum memenuhi kualifikasi minimum yang diharapkan untuk posisi ${job.title}.`;
    recommendationReason = 'Kandidat belum sesuai dengan kebutuhan posisi saat ini.';
  }

  // === APPLY ZERO-TOLERANCE DOCUMENT FRAUD & MISMATCH OVERRIDE ===
  if (!identityAudit.isAuthenticOwner) {
    overallScore = 13;
    technicalScore = 15;
    experienceScore = 10;
    educationScore = 15;
    motivationScore = 10;
    fitLevel = 'Low Match';
    recommendation = 'NOT_SUITABLE';

    const otherPerson = identityAudit.detectedNames.join(', ') || 'Nama Lain';
    executiveSummary = `PERINGATAN AUDIT ATS: Berkas dokumen (CV / Surat Lamaran) teridentifikasi kuat bukan milik pelamar akun. Dokumen mencantumkan identitas atas nama [${otherPerson}], yang tidak sesuai dengan biodata resmi pelamar (${officialName}). Indikasi salah kirim berkas atau impersonasi dokumen.`;
    recommendationReason = `Kandidat langsung dinyatakan TIDAK LOLOS (NOT_SUITABLE) akibat ketidaksesuaian identitas kepemilikan dokumen yang fatal.`;
    riskFactors.push(`Inkonsistensi Identitas Fatal: Dokumen CV atas nama "${otherPerson}" bukan milik pelamar akun (${officialName})`);
    gaps.unshift(`Dokumen CV terdeteksi atas nama orang lain (${otherPerson}).`);
  }

  const detailedQuestions: DetailedInterviewQuestion[] = [
    {
      question: `Ceritakan studi kasus proyek paling menantang yang pernah Anda selesaikan menggunakan ${matchedSkills[0] || 'teknologi keahlian Anda'}, serta dampak bisnis yang dihasilkan?`,
      context: 'Menguji kedalaman teknis dan kemampuan memecahkan masalah dalam situasi nyata.',
      targetCriteria: 'Kandidat dapat menjelaskan arsitektur solusi, trade-off yang diambil, dan metrik keberhasilan yang jelas.'
    },
    {
      question: `Bagaimana pendekatan Anda dalam mempelajari dan mengimplementasikan tools baru seperti ${missingSkills[0] || 'teknologi terkait'} dalam lingkungan produksi yang cepat?`,
      context: 'Mengukur ketangkasan belajar (learning agility) dan inisiatif mandiri.',
      targetCriteria: 'Menjelaskan metodologi riset, proof of concept (POC), dan kemampuan adaptasi tanpa mengganggu timeline proyek.'
    },
    {
      question: `Apa motivasi utama Anda melamar posisi ${job.title} di divisi ${job.department} dan bagaimana target kontribusi Anda dalam 6 bulan pertama?`,
      context: 'Mengevaluasi keselarasan budaya kerja, komitmen, dan orientasi tujuan.',
      targetCriteria: 'Jawaban terstruktur dengan pemahaman jelas mengenai industri dan rencana aksi nyata.'
    }
  ];

  const documentOwnership: DocumentOwnershipVerification = {
    status: identityAudit.status,
    isAuthenticOwner: identityAudit.isAuthenticOwner,
    identityConfidence: identityAudit.confidence,
    detectedNamesInDocuments: identityAudit.detectedNames,
    mismatchedFields: identityAudit.mismatches,
    ownershipAuditNotes: identityAudit.notes,
    verifiedAt: new Date().toISOString()
  };

  return {
    overallScore,
    technicalScore,
    experienceScore,
    educationScore,
    motivationScore,
    fitLevel,
    executiveSummary,
    strengths: strengths.length > 0 ? strengths : ['Memiliki profil kompetensi yang relevan'],
    gaps: gaps.length > 0 ? gaps : ['Tidak ditemukan kesenjangan mencolok'],
    matchedSkills,
    missingSkills,
    additionalSkills: ['Komunikasi Teknis', 'Agile/Scrum'],
    recommendation,
    recommendationReason,
    suggestedInterviewQuestions: detailedQuestions.map(d => d.question),
    detailedQuestions,
    riskFactors,
    documentOwnership,
    analyzedAt: new Date().toISOString()
  };
}
