import { Job, DocumentAttachment, AiEvaluationResult, FitLevel, RecommendationDecision, DetailedInterviewQuestion } from './types';

export interface EvaluateApplicantParams {
  job: Job;
  documents: DocumentAttachment[];
  applicantName: string;
  applicantHeadline?: string;
  geminiApiKey?: string;
  preferredModel?: string;
}

const FALLBACK_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash'
];

/**
 * Main evaluation entry point.
 * Uses Google Gemini API (Real AI) if API key is provided, with graceful intelligent local NLP engine fallback.
 */
export async function evaluateApplicantWithAi({
  job,
  documents,
  applicantName,
  applicantHeadline = '',
  geminiApiKey = '',
  preferredModel = 'gemini-3.6-flash'
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
  const localResult = runIntelligentLocalAnalysis(job, applicantName, applicantHeadline, documents);
  return {
    ...localResult,
    isRealAi: false,
    modelUsed: 'Intelligent Local NLP Engine',
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
  documentsText: string,
  apiKey: string,
  preferredModel: string
): Promise<AiEvaluationResult | null> {
  const modelsToTry = Array.from(new Set([preferredModel, ...FALLBACK_MODELS]));
  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const result = await callSingleGeminiModel(job, applicantName, applicantHeadline, documentsText, apiKey, model);
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
  documentsText: string,
  apiKey: string,
  modelName: string
): Promise<AiEvaluationResult | null> {
  const prompt = `
Anda adalah AI Human Resource Director & Senior ATS Screening Specialist bersertifikasi internasional.
Lakukan analisis mendalam, kritis, objektif, dan komprehensif terhadap berkas lamaran kandidat berikut dibandingkan dengan kualifikasi lowongan pekerjaan.

=== INFORMASI LOWONGAN PEKERJAAN ===
Judul Posisi: ${job.title}
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

=== DATA PELAMAR ===
Nama: ${applicantName}
Headline: ${applicantHeadline || 'Tidak dicantumkan'}

=== BERKAS DOKUMEN ASLI PELAMAR (CV, SURAT LAMARAN, SERTIFIKAT, PORTOFOLIO) ===
${documentsText}

=== INSTRUKSI ANALISIS MENDALAM ===
1. Baca dan telaah seluruh teks riwayat kerja, deskripsi proyek, tools/teknologi yang digunakan, pendidikan, dan sertifikasi pelamar.
2. Berikan penilaian skor objektif (skala 0 - 100) untuk masing-masing dimensi berikut:
   - technicalScore (Bobot 35%): Kesesuaian nyata keahlian teknis, framework, tools, dan bahasa pemrograman terhadap Key Skills lowongan.
   - experienceScore (Bobot 30%): Kesesuaian jumlah tahun pengalaman, relevansi industri, kedalaman proyek, dan seniority.
   - educationScore (Bobot 20%): Kesesuaian jenjang pendidikan, jurusan terkait, dan sertifikasi profesional pendukung.
   - motivationScore (Bobot 15%): Kualitas surat lamaran, keselarasan visi karir, kejelasan komunikasi, dan antusiasme pelamar.
   - cultureFitScore (Opsional, skala 0-100): Kesiapan adaptasi, kolaborasi tim, dan kepemimpinan.
   - overallScore: Nilai agregat tertimbang (35% Technical + 30% Experience + 20% Education + 15% Motivation).
3. Tentukan fitLevel:
   - "Top Match" (overallScore >= 85)
   - "High Match" (overallScore >= 70 && < 85)
   - "Moderate Match" (overallScore >= 50 && < 70)
   - "Low Match" (overallScore < 50)
4. Tentukan recommendation:
   - "STRONGLY_RECOMMENDED" (Sangat direkomendasikan lanjut ke Hiring Manager)
   - "INTERVIEW" (Layak diuji wawancara teknis / HR)
   - "CONSIDER" (Dipertimbangkan sebagai cadangan / perlu pendalaman)
   - "NOT_SUITABLE" (Belum memenuhi kualifikasi)
5. Susun "executiveSummary" dalam Bahasa Indonesia formal dan tajam (3-4 kalimat padat yang menjelaskan profil kandidat, kecocokannya terhadap lowongan ini, dan poin pertimbangan utama).
6. Tulis "strengths" (3-5 poin spesifik yang mengutip bukti nyata dari CV/portofolio pelamar).
7. Tulis "gaps" (2-4 poin kekurangan, kesenjangan kompetensi, atau hal yang belum terbukti di CV).
8. Identifikasi "matchedSkills" (daftar skill dari Key Skills lowongan yang benar-benar ada di berkas).
9. Identifikasi "missingSkills" (daftar skill dari Key Skills lowongan yang belum/tidak ditemukan di berkas).
10. Identifikasi "additionalSkills" (2-4 keahlian bernilai tambah yang dimiliki pelamar di luar kualifikasi lowongan).
11. Buat "detailedQuestions" (3-4 pertanyaan wawancara khusus yang dibuat spesifik menggali isi CV kandidat ini):
    Setiap pertanyaan harus memiliki format objek:
    {
      "question": "Kalimat pertanyaan wawancara terpersonalisasi",
      "context": "Alasan mengapa pertanyaan ini diajukan berdasarkan CV kandidat",
      "targetCriteria": "Hal-hal yang diharapkan dijawab oleh kandidat untuk membuktikan kompetensinya"
    }
12. Tulis "riskFactors" (poin potensi risiko jika ada, misalnya sering berpindah kerja < 6 bulan, gap karir, atau overqualified/underqualified; jika tidak ada beri array kosong []).

KEMBALIKAN HANYA JSON MURNI YANG VALID (Valid JSON Object) TANPA MARKDOWN BACKTICKS ATAU PENJELASAN LAIN DI LUAR JSON. Format JSON:
{
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
          temperature: 0.15,
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
    overallScore: Math.min(100, Math.max(0, Number(parsed.overallScore) || 75)),
    technicalScore: Math.min(100, Math.max(0, Number(parsed.technicalScore) || 75)),
    experienceScore: Math.min(100, Math.max(0, Number(parsed.experienceScore) || 75)),
    educationScore: Math.min(100, Math.max(0, Number(parsed.educationScore) || 75)),
    motivationScore: Math.min(100, Math.max(0, Number(parsed.motivationScore) || 75)),
    cultureFitScore: parsed.cultureFitScore ? Math.min(100, Math.max(0, Number(parsed.cultureFitScore))) : undefined,
    fitLevel: parsed.fitLevel || 'High Match',
    executiveSummary: parsed.executiveSummary || 'Analisis berkas kandidat telah selesai diproses.',
    strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : ['Memiliki profil kompetensi yang relevan'],
    gaps: Array.isArray(parsed.gaps) && parsed.gaps.length > 0 ? parsed.gaps : ['Tidak ditemukan kesenjangan mencolok'],
    matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [],
    missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
    additionalSkills: Array.isArray(parsed.additionalSkills) ? parsed.additionalSkills : [],
    recommendation: parsed.recommendation || 'INTERVIEW',
    recommendationReason: parsed.recommendationReason || 'Kandidat memiliki potensi yang relevan dengan spesifikasi pekerjaan.',
    suggestedInterviewQuestions: suggestedQuestions,
    detailedQuestions: Array.isArray(parsed.detailedQuestions) ? parsed.detailedQuestions : [],
    riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
    isRealAi: true,
    modelUsed: displayModelName,
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Built-in Intelligent Screening & NLP Matching Engine
 * Used as high-performance local fallback if Gemini is offline.
 */
export function runIntelligentLocalAnalysis(
  job: Job,
  applicantName: string,
  applicantHeadline: string,
  documents: DocumentAttachment[]
): AiEvaluationResult {
  const combinedText = [
    applicantHeadline,
    ...documents.map(d => d.extractedText)
  ].join(' ').toLowerCase();

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
      'tableau / power bi': ['tableau', 'power bi', 'powerbi', 'looker', 'metabase']
    };

    const searchTokens = variations[sLower] || [sLower];
    const isMatched = searchTokens.some(token => combinedText.includes(token));

    if (isMatched) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const skillMatchRatio = job.keySkills.length > 0
    ? matchedSkills.length / job.keySkills.length
    : 0.8;
  
  let technicalScore = Math.round(skillMatchRatio * 85 + (matchedSkills.length > 0 ? 15 : 0));
  technicalScore = Math.min(99, Math.max(20, technicalScore));

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

  if (job.experienceLevel.includes('Senior') || job.experienceLevel.includes('5+')) {
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
  let educationScore = 60;
  const hasBachelor = combinedText.includes('s1') || combinedText.includes('sarjana') || combinedText.includes('bachelor') || combinedText.includes('universitas') || combinedText.includes('institut');
  const hasCertificate = documents.some(d => d.type === 'certificate') || combinedText.includes('sertifikat') || combinedText.includes('certified') || combinedText.includes('certification');
  
  if (hasBachelor && hasCertificate) {
    educationScore = 95;
  } else if (hasBachelor) {
    educationScore = 85;
  } else if (hasCertificate) {
    educationScore = 75;
  } else {
    educationScore = 60;
  }

  // 4. Motivation & Cover Letter Evaluation
  let motivationScore = 65;
  const hasCoverLetter = documents.some(d => d.type === 'cover_letter');
  if (hasCoverLetter) {
    const cl = documents.find(d => d.type === 'cover_letter')!;
    if (cl.extractedText.length > 200) {
      motivationScore = 92;
    } else {
      motivationScore = 78;
    }
  } else {
    motivationScore = 65;
  }

  // 5. Aggregate Overall Score
  const overallScore = Math.round(
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

  if (matchedSkills.length > 0) {
    strengths.push(`Menguasai ${matchedSkills.length} dari ${job.keySkills.length} keahlian utama yang disyaratkan (${matchedSkills.slice(0, 3).join(', ')}${matchedSkills.length > 3 ? ', dll' : ''}).`);
  }
  if (experienceScore >= 80) {
    strengths.push(`Tingkat pengalaman (${maxYearsFound > 0 ? maxYearsFound + ' tahun' : 'solid'}) selaras dengan kualifikasi ${job.experienceLevel}.`);
  }
  if (hasCertificate) {
    strengths.push(`Melampirkan berkas sertifikasi kompetensi profesional pendukung.`);
  }

  if (missingSkills.length > 0) {
    gaps.push(`Belum teridentifikasi pengalaman spesifik pada: ${missingSkills.slice(0, 4).join(', ')}.`);
  }
  if (experienceScore < 70) {
    gaps.push(`Tingkat pengalaman belum sepenuhnya mencapai target ${job.experienceLevel} yang disyaratkan.`);
  }

  let executiveSummary = '';
  let recommendationReason = '';

  if (fitLevel === 'Top Match') {
    executiveSummary = `Kandidat ${applicantName} memiliki keselarasan profil yang sangat kuat untuk posisi ${job.title}. Penguasaan stack teknologi (${matchedSkills.join(', ')}) dan riwayat karir memenuhi standar tinggi yang disyaratkan.`;
    recommendationReason = 'Sangat direkomendasikan untuk segera dijadwalkan wawancara dengan Hiring Manager.';
  } else if (fitLevel === 'High Match') {
    executiveSummary = `Kandidat ${applicantName} menunjukkan kompetensi yang relevan dan solid untuk posisi ${job.title}, dengan penguasaan pada mayoritas keahlian kunci.`;
    recommendationReason = 'Layak untuk diikutsertakan ke tahap interview atau technical assessment.';
  } else if (fitLevel === 'Moderate Match') {
    executiveSummary = `Kandidat ${applicantName} memiliki dasar keahlian yang cukup, namun masih memiliki celah pada beberapa tools utama untuk posisi ${job.title}.`;
    recommendationReason = 'Dapat dipertimbangkan sebagai opsi cadangan atau jenjang pendukung.';
  } else {
    executiveSummary = `Profil kandidat ${applicantName} belum memenuhi kualifikasi minimum yang diharapkan untuk posisi ${job.title}.`;
    recommendationReason = 'Kandidat belum sesuai dengan kebutuhan posisi saat ini.';
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
    riskFactors: [],
    analyzedAt: new Date().toISOString()
  };
}
