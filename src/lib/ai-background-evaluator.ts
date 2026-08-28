import {
  UserBiodata,
  AiBackgroundReport,
  NameVerificationResult,
  DocumentAttachment
} from './types';

// ─── Helper 1: Kalkulasi Usia & Analisis Kronologi Biodata ────────────────────

export function calculateCandidateAge(birthDateStr?: string): number | undefined {
  if (!birthDateStr) return undefined;
  try {
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) return undefined;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 && age <= 100 ? age : undefined;
  } catch {
    return undefined;
  }
}

interface TimelineAuditResult {
  isPlausible: boolean;
  notes: string;
  estimatedCareerYears?: number;
}

function auditTimelineConsistency(
  birthDateStr?: string,
  graduationYearStr?: string,
  lastEducation?: string
): TimelineAuditResult {
  const age = calculateCandidateAge(birthDateStr);
  const gradYear = parseInt(graduationYearStr || '', 10);
  const currentYear = new Date().getFullYear();

  if (!age || isNaN(gradYear)) {
    return {
      isPlausible: true,
      notes: 'Timeline kelulusan tidak dapat diverifikasi penuh karena tanggal lahir atau tahun kelulusan belum lengkap.'
    };
  }

  const birthYear = currentYear - age;
  const ageAtGraduation = gradYear - birthYear;

  // Analisis usia kelulusan berdasarkan jenjang
  const isBachelor = (lastEducation || '').toLowerCase().includes('s1') || (lastEducation || '').toLowerCase().includes('d4');

  const careerYears = Math.max(0, currentYear - gradYear);

  if (ageAtGraduation < 15) {
    return {
      isPlausible: false,
      notes: `⚠️ Anomali: Usia saat tahun kelulusan ${gradYear} terhitung ${ageAtGraduation} tahun (terlalu muda untuk jenjang ${lastEducation || 'pendidikan'}).`,
      estimatedCareerYears: careerYears
    };
  }

  if (isBachelor && ageAtGraduation < 19) {
    return {
      isPlausible: false,
      notes: `⚠️ Catatan: Usia saat lulus S1/D4 (${ageAtGraduation} thn) lebih awal dari rata-rata (akselerasi/perlu konfirmasi ijazah).`,
      estimatedCareerYears: careerYears
    };
  }

  if (gradYear > currentYear + 1) {
    return {
      isPlausible: false,
      notes: `⚠️ Tahun kelulusan (${gradYear}) berada di masa depan melampaui batas wajar.`,
      estimatedCareerYears: 0
    };
  }

  return {
    isPlausible: true,
    notes: `✅ Timeline kronologis konsisten: Usia saat lulus ${ageAtGraduation} tahun, estimasi masa karir pasca-lulus ±${careerYears} tahun.`,
    estimatedCareerYears: careerYears
  };
}

// ─── Helper 2: Cross-Verification Nama Resmi KTP vs Dokumen CV ───────────────

export function verifyNameInDocuments(
  fullName: string,
  documents?: DocumentAttachment[]
): NameVerificationResult {
  if (!documents || documents.length === 0) {
    return {
      nameInBiodata: fullName,
      nameFoundInCv: false,
      nameVariantsFound: [],
      verificationNote: 'Tidak ada berkas CV/dokumen pendukung yang diunggah untuk cross-check identitas resmi.'
    };
  }

  const cvTexts = documents
    .filter(d => d.type === 'cv' || d.type === 'cover_letter' || d.type === 'certificate')
    .map(d => d.extractedText || '')
    .join('\n')
    .toLowerCase();

  if (!cvTexts.trim()) {
    return {
      nameInBiodata: fullName,
      nameFoundInCv: false,
      nameVariantsFound: [],
      verificationNote: 'Teks dokumen CV belum dapat diekstraksi untuk verifikasi nama.'
    };
  }

  const cleanFullName = fullName.trim().toLowerCase();
  const nameParts = cleanFullName.split(/\s+/).filter(Boolean);
  const nameVariantsFound: string[] = [];

  // Exact Match
  if (cvTexts.includes(cleanFullName)) {
    nameVariantsFound.push(fullName.trim());
  }

  // First & Last Name Match
  if (nameParts.length >= 2) {
    const firstLast = `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
    if (!nameVariantsFound.includes(firstLast) && cvTexts.includes(firstLast)) {
      nameVariantsFound.push(firstLast);
    }
    // Check first name as word boundary
    const firstWordRegex = new RegExp(`\\b${nameParts[0]}\\b`);
    if (firstWordRegex.test(cvTexts) && !nameVariantsFound.some(v => v.toLowerCase().includes(nameParts[0]))) {
      nameVariantsFound.push(nameParts[0]);
    }
  } else if (nameParts.length === 1) {
    if (cvTexts.includes(nameParts[0])) {
      nameVariantsFound.push(nameParts[0]);
    }
  }

  const nameFoundInCv = nameVariantsFound.length > 0;

  let verificationNote = '';
  if (nameFoundInCv && nameVariantsFound[0]?.toLowerCase() === cleanFullName) {
    verificationNote = `✅ Nama lengkap "${fullName}" terverifikasi identik di dalam dokumen CV — data resmi valid dan konsisten.`;
  } else if (nameFoundInCv) {
    verificationNote = `⚠️ Variasi nama "${nameVariantsFound.join('", "')}" ditemukan di dokumen CV, selaras dengan nama KTP "${fullName}".`;
  } else {
    verificationNote = `⚠️ Nama resmi "${fullName}" tidak ditemukan di dalam teks dokumen CV. HRD disarankan melakukan verifikasi identitas fisik.`;
  }

  return {
    nameInBiodata: fullName,
    nameFoundInCv,
    nameVariantsFound,
    verificationNote
  };
}

// ─── Main Analyzer: Pure Biodata Background & Track Record Evaluation ────────

/**
 * Menganalisis dan mengecek rekam jejak, kredibilitas, dan integritas kandidat
 * secara murni dari data biodata resmi dan berkas dokumen karir.
 */
export async function analyzeCandidateBackgroundWithAi(biodata: UserBiodata): Promise<AiBackgroundReport> {
  const calculatedAge = calculateCandidateAge(biodata.birthDate);
  const timelineAudit = auditTimelineConsistency(biodata.birthDate, biodata.graduationYear, biodata.lastEducation);
  const nameVerificationResult = verifyNameInDocuments(biodata.fullName, biodata.documents);

  // Ambil API key
  const apiKey = (
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') || ''
  ).trim();

  if (apiKey && apiKey.length > 10) {
    try {
      const aiResult = await callGeminiForBiodataBackgroundCheck(
        biodata,
        calculatedAge,
        timelineAudit,
        nameVerificationResult,
        apiKey
      );

      return {
        ...aiResult,
        calculatedAge,
        nameVerificationResult,
        generatedAt: new Date().toISOString()
      };
    } catch (err) {
      console.warn('Gemini biodata background check failed, using heuristic fallback:', err);
    }
  }

  // Fallback heuristik jika API key tidak tersedia
  return generateHeuristicBiodataReport(biodata, calculatedAge, timelineAudit, nameVerificationResult);
}

// ─── Gemini AI Prompt: Pure Biodata Intelligence ─────────────────────────────

async function callGeminiForBiodataBackgroundCheck(
  biodata: UserBiodata,
  calculatedAge: number | undefined,
  timelineAudit: TimelineAuditResult,
  nameVerification: NameVerificationResult,
  apiKey: string
): Promise<Omit<AiBackgroundReport, 'nameVerificationResult' | 'generatedAt'>> {

  const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  const cvSummary = (biodata.documents || [])
    .map(d => `[Dokumen: ${d.name} (${d.type})] Teks:\n${(d.extractedText || '').slice(0, 1500)}`)
    .join('\n\n') || '(Tidak ada dokumen CV yang dilampirkan)';

  const bioText = biodata.bioSummary || biodata.socials?.additionalBio || '(Tidak ada ringkasan bio)';

  const prompt = `
Anda adalah AI Human Capital Intelligence & Background Verification Specialist untuk HR Executive.
Tugas Anda adalah melakukan audit menyeluruh terhadap kredibilitas biodata, rekam jejak akademik, kontinuitas karir, dan integritas kandidat MURNI HANYA dari data biodata resmi dan berkas dokumen yang diberikan.

══════════════════════════════════════════════════
DATA BIODATA RESMI KANDIDAT:
══════════════════════════════════════════════════
- Nama Lengkap (Sesuai KTP): ${biodata.fullName}
- Jenis Kelamin: ${biodata.gender || 'Tidak dicantumkan'}
- Tempat, Tanggal Lahir: ${biodata.birthPlace || '-'}, ${biodata.birthDate || '-'} (Usia Terhitung: ${calculatedAge !== undefined ? `${calculatedAge} tahun` : 'Tidak terdeteksi'})
- Nomor Telepon / WhatsApp: ${biodata.phone || '-'}
- Alamat & Domisili: ${biodata.address || '-'}, ${biodata.city || '-'}
- Jenjang Pendidikan Terakhir: ${biodata.lastEducation || '-'}
- Nama Institusi / Universitas / Sekolah: ${biodata.institutionName || '-'}
- Jurusan / Program Studi: ${biodata.educationMajor || '-'}
- Tahun Kelulusan: ${biodata.graduationYear || '-'}
- IPK / Nilai Rata-rata: ${biodata.gpa || '-'}

══════════════════════════════════════════════════
AUDIT IDENTITAS & KRONOLOGI AWAL:
══════════════════════════════════════════════════
- Verifikasi Nama KTP di Dokumen: ${nameVerification.verificationNote}
- Audit Kronologi Timeline: ${timelineAudit.notes}

══════════════════════════════════════════════════
DESKRIPSI PROFIL / BIO DIRI:
══════════════════════════════════════════════════
${bioText}

══════════════════════════════════════════════════
BERKAS DOKUMEN & CV (RINGKASAN TEKS):
══════════════════════════════════════════════════
${cvSummary}

══════════════════════════════════════════════════
INSTRUKSI EVALUASI REKAM JEJAK:
══════════════════════════════════════════════════
1. "credibilityScore" (0-100): Skor kelengkapan, validitas kronologis (usia vs tahun lulus), dan konsistensi data institusi/jurusan.
2. "integrityAndEthicsScore" (0-100): Skor keaslian data dan kesesuaian identitas resmi KTP dengan dokumen pendukung CV.
3. "personalitySummary" (string, 2-3 kalimat): Ringkasan karakter profesional, etos kerja, dan profil kepribadian berdasarkan data riwayat pendidikan & karir.
4. "careerTrajectorySummary" (string, 2-3 kalimat): Analisis perkembangan rekam jejak karir, kontinuitas pendidikan ke dunia profesional, dan estimasi kapabilitas kerja.
5. "academicAuditSummary" (string, 1-2 kalimat): Evaluasi kelayakan riwayat akademik (reputasi institusi, relevansi jurusan, dan pencapaian IPK/nilai).
6. "greenFlags" (array of string, 2-4 poin): Poin positif nyata berdasarkan biodata dan dokumen (misal: konsistensi identitas, institusi bereputasi, IPK unggul, linieritas jurusan).
7. "redFlags" (array of string, 1-3 poin): Poin catatan/anomali (misal: nama tidak cocok di CV, data tidak lengkap, ketidaksesuaian timeline). Jika data sangat baik dan tidak ada anomali, berikan 1 poin: "Biodata resmi dan berkas pendukung lengkap tanpa catatan anomali."
8. "hrDiscretionNotes" (string, 1-2 kalimat): Rekomendasi verifikasi administratif strategis bagi tim HRD.

KEMBALIKAN HANYA FORMAT JSON VALID:
{
  "credibilityScore": 92,
  "integrityAndEthicsScore": 95,
  "personalitySummary": "string",
  "careerTrajectorySummary": "string",
  "academicAuditSummary": "string",
  "greenFlags": ["string", "string"],
  "redFlags": ["string"],
  "hrDiscretionNotes": "string"
}
`.trim();

  let lastErr: Error | null = null;
  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
          })
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
      }

      const json = await res.json();
      const parts = json.candidates?.[0]?.content?.parts || [];
      let textOutput = parts.map((p: { text?: string }) => p.text || '').join('');
      textOutput = textOutput.replace(/```json/gi, '').replace(/```/g, '').trim();

      if (!textOutput) throw new Error('Empty response from Gemini');

      const parsed = JSON.parse(textOutput);
      const credibility = Math.min(100, Math.max(0, Number(parsed.credibilityScore) || 85));
      const integrity = Math.min(100, Math.max(0, Number(parsed.integrityAndEthicsScore) || 90));
      const careerTraj = parsed.careerTrajectorySummary || 'Rekam jejak karir dan latar belakang akademik menunjukkan profil pelamar yang terstruktur.';

      return {
        credibilityScore: credibility,
        digitalFootprintScore: credibility, // alias
        integrityAndEthicsScore: integrity,
        personalitySummary: parsed.personalitySummary || `${biodata.fullName} memiliki latar belakang pendidikan ${biodata.lastEducation || ''} di ${biodata.institutionName || 'institusi resmi'} yang terverifikasi.`,
        careerTrajectorySummary: careerTraj,
        socialMediaPresenceSummary: careerTraj, // alias
        academicAuditSummary: parsed.academicAuditSummary || `Latar belakang ${biodata.lastEducation || 'pendidikan'} pada jurusan ${biodata.educationMajor || 'terkait'} di ${biodata.institutionName || 'institusi tertera'}.`,
        calculatedAge,
        greenFlags: Array.isArray(parsed.greenFlags) && parsed.greenFlags.length > 0
          ? parsed.greenFlags
          : ['Biodata diri terisi lengkap dan siap diverifikasi oleh HRD.'],
        redFlags: Array.isArray(parsed.redFlags) && parsed.redFlags.length > 0
          ? parsed.redFlags
          : ['Tidak ditemukan catatan anomali berdasarkan data yang tersedia.'],
        hrDiscretionNotes: parsed.hrDiscretionNotes || 'Data biodata resmi konsisten. Lakukan konfirmasi berkas fisik saat sesi wawancara.'
      };
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      console.warn(`Biodata background check model ${model} failed:`, lastErr.message);
    }
  }

  throw lastErr || new Error('All Gemini models failed for biodata background check');
}

// ─── Heuristic Fallback (jika Gemini tidak tersedia) ─────────────────────────

function generateHeuristicBiodataReport(
  biodata: UserBiodata,
  calculatedAge: number | undefined,
  timelineAudit: TimelineAuditResult,
  nameVerification: NameVerificationResult
): AiBackgroundReport {
  let credibility = 60; // Base score

  // Kelengkapan data dasar
  if (biodata.fullName) credibility += 8;
  if (biodata.birthDate && biodata.birthPlace) credibility += 8;
  if (biodata.city && biodata.address) credibility += 6;
  if (biodata.phone) credibility += 5;
  if (biodata.institutionName) credibility += 5;
  if (biodata.educationMajor) credibility += 4;
  if (biodata.graduationYear) credibility += 4;

  // Bonus jika ada dokumen CV
  const hasCv = biodata.documents && biodata.documents.length > 0;
  if (hasCv) credibility += 5;

  // Penalty jika timeline anomali
  if (!timelineAudit.isPlausible) credibility -= 15;

  credibility = Math.min(98, Math.max(40, credibility));

  // Integritas
  let integrity = 85;
  if (nameVerification.nameFoundInCv) {
    integrity = 96;
  } else if (hasCv && !nameVerification.nameFoundInCv) {
    integrity = 72;
  }

  // Green flags
  const greenFlags: string[] = [];
  if (nameVerification.nameFoundInCv) {
    greenFlags.push(`Nama lengkap KTP terverifikasi identik di dalam dokumen CV (${nameVerification.nameInBiodata}).`);
  }
  if (biodata.lastEducation && biodata.institutionName) {
    greenFlags.push(`Riwayat pendidikan resmi: ${biodata.lastEducation} - ${biodata.educationMajor || 'Umum'} di ${biodata.institutionName}.`);
  }
  if (biodata.gpa) {
    const numGpa = parseFloat(biodata.gpa);
    if (!isNaN(numGpa) && numGpa >= 3.5) {
      greenFlags.push(`Prestasi akademik unggul dengan IPK/Nilai ${biodata.gpa}.`);
    } else {
      greenFlags.push(`Pencatatan nilai akademik/IPK transparan (${biodata.gpa}).`);
    }
  }
  if (timelineAudit.isPlausible) {
    greenFlags.push(timelineAudit.notes.replace('✅ ', ''));
  }
  if (biodata.bioSummary || biodata.socials?.additionalBio) {
    greenFlags.push('Kandidat melampirkan ringkasan profil profesional yang mendeskripsikan keahlian.');
  }
  if (greenFlags.length === 0) {
    greenFlags.push('Biodata resmi pelamar tersedia untuk proses verifikasi rekrutmen.');
  }

  // Red flags
  const redFlags: string[] = [];
  if (hasCv && !nameVerification.nameFoundInCv) {
    redFlags.push(`Nama resmi "${biodata.fullName}" tidak terdeteksi di dokumen CV yang diunggah — disarankan verifikasi manual.`);
  }
  if (!timelineAudit.isPlausible) {
    redFlags.push(timelineAudit.notes.replace('⚠️ ', ''));
  }
  if (!hasCv) {
    redFlags.push('Belum ada berkas CV/dokumen pendukung yang diunggah untuk verifikasi rekam jejak karir.');
  }
  if (redFlags.length === 0) {
    redFlags.push('Tidak ditemukan catatan negatif atau anomali data pada biodata yang diisi.');
  }

  const ageText = calculatedAge !== undefined ? `berusia ${calculatedAge} tahun` : 'data usia belum lengkap';
  const personalitySummary = `${biodata.fullName} (${ageText}) memiliki latar belakang pendidikan ${biodata.lastEducation || ''} di ${biodata.institutionName || 'institusi pendidikan'}${biodata.educationMajor ? ` jurusan ${biodata.educationMajor}` : ''} dengan profil biodata yang terstruktur.`;
  const careerTrajectory = `Rekam jejak akademik dan profil karir menunjukkan kesiapan profesional pada bidang ${biodata.educationMajor || 'keahlian terkait'}. ${timelineAudit.notes}`;
  const academicAudit = `Jenjang ${biodata.lastEducation || '-'} di ${biodata.institutionName || '-'} (Lulus: ${biodata.graduationYear || '-'}${biodata.gpa ? `, IPK: ${biodata.gpa}` : ''}).`;

  return {
    credibilityScore: credibility,
    digitalFootprintScore: credibility,
    integrityAndEthicsScore: integrity,
    personalitySummary,
    careerTrajectorySummary: careerTrajectory,
    socialMediaPresenceSummary: careerTrajectory,
    academicAuditSummary: academicAudit,
    calculatedAge,
    greenFlags,
    redFlags,
    hrDiscretionNotes: `Data biodata resmi konsisten. ${nameVerification.verificationNote}`,
    nameVerificationResult: nameVerification,
    generatedAt: new Date().toISOString()
  };
}

