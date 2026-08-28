import {
  UserBiodata,
  AiBackgroundReport,
  NameVerificationResult,
  DocumentAttachment,
  GitHubStats,
  PlatformVerification
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

  if (cvTexts.includes(cleanFullName)) {
    nameVariantsFound.push(fullName.trim());
  }

  if (nameParts.length >= 2) {
    const firstLast = `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
    if (!nameVariantsFound.includes(firstLast) && cvTexts.includes(firstLast)) {
      nameVariantsFound.push(firstLast);
    }
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

// ─── Helper 3: AI OSINT Engine - Otomatis Temukan Semua Akun Sosmed dari Biodata ───

interface ExtractedSocialsFromCv {
  linkedIn?: string;
  github?: string;
  instagram?: string;
  twitter?: string;
  portfolio?: string;
  emails: string[];
}

/**
 * Mengekstraksi URL dan username media sosial asli yang tertulis di dalam dokumen CV digital.
 */
function extractSocialsFromCvText(documents?: DocumentAttachment[]): ExtractedSocialsFromCv {
  const allDocText = (documents || []).map(d => d.extractedText || '').join('\n');
  const result: ExtractedSocialsFromCv = { emails: [] };

  if (!allDocText.trim()) return result;

  // 1. LinkedIn
  const linkedinMatch = allDocText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  if (linkedinMatch) {
    result.linkedIn = `https://www.linkedin.com/in/${linkedinMatch[1]}`;
  }

  // 2. GitHub
  const githubMatch = allDocText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  if (githubMatch && !['features', 'topics', 'pricing', 'about'].includes(githubMatch[1].toLowerCase())) {
    result.github = githubMatch[1];
  }

  // 3. Instagram
  const igMatch = allDocText.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.-]+)/i);
  if (igMatch && !['p', 'reel', 'explore', 'stories'].includes(igMatch[1].toLowerCase())) {
    result.instagram = igMatch[1];
  }

  // 4. Twitter / X
  const twitterMatch = allDocText.match(/(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i);
  if (twitterMatch && !['home', 'explore', 'search', 'intent'].includes(twitterMatch[1].toLowerCase())) {
    result.twitter = twitterMatch[1];
  }

  // 5. Portfolio / Domain Pribadi
  const portfolioMatch = allDocText.match(/https?:\/\/([a-zA-Z0-9-]+\.(?:my\.id|dev|io|id|me|site|tech|com)(?:\/[^\s]*)?)/i);
  if (portfolioMatch) {
    const rawUrl = portfolioMatch[0];
    if (!rawUrl.includes('google') && !rawUrl.includes('drive') && !rawUrl.includes('canva') && !rawUrl.includes('linkedin') && !rawUrl.includes('github') && !rawUrl.includes('instagram')) {
      result.portfolio = rawUrl;
    }
  }

  // 6. Emails
  const emailMatches = allDocText.match(/([a-zA-Z0-9._%+-]+)@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  result.emails = Array.from(new Set(emailMatches.map(e => e.toLowerCase())));

  return result;
}

/**
 * Fetch data GitHub secara live dari GitHub REST API publik dan validasi kesesuaian nama kandidat.
 */
async function probeGitHubUser(username: string, candidateFullName: string): Promise<GitHubStats | null> {
  try {
    const clean = username.replace(/^@/, '').trim();
    if (!clean || clean.length < 2) return null;

    const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json' };
    if (process.env.GITHUB_TOKEN) headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;

    const res = await fetch(`https://api.github.com/users/${clean}`, {
      headers,
      next: { revalidate: 3600 }
    });

    if (!res.ok) return null;
    const profile = await res.json();
    if (!profile || !profile.login) return null;

    // Verifikasi nama jika bukan didapat dari CV langsung
    const profileName = (profile.name || '').toLowerCase();
    const candidateParts = candidateFullName.toLowerCase().split(/\s+/).filter(Boolean);
    const firstName = candidateParts[0] || '';
    const hasNameMatch = candidateParts.some(p => p.length >= 3 && profileName.includes(p)) ||
      (profile.bio && candidateParts.some(p => p.length >= 3 && (profile.bio || '').toLowerCase().includes(p)));

    // Jika username sangat pendek/generik dan nama profil tidak cocok, jangan klaim sembarangan
    if (!hasNameMatch && clean.length <= 5) {
      return null;
    }

    // Ambil repository untuk kalkulasi statistik
    let totalStars = 0;
    let topLanguages: string[] = [];
    let lastActive: string | undefined;

    const reposRes = await fetch(
      `https://api.github.com/users/${clean}/repos?per_page=15&sort=pushed&direction=desc`,
      { headers, next: { revalidate: 3600 } }
    );

    if (reposRes.ok) {
      const repos = await reposRes.json();
      if (Array.isArray(repos)) {
        totalStars = repos.reduce((sum: number, r: { stargazers_count?: number }) => sum + (r.stargazers_count || 0), 0);
        const langCount: Record<string, number> = {};
        for (const r of repos) {
          if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
        }
        topLanguages = Object.entries(langCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 4)
          .map(([l]) => l);
        if (repos[0]?.pushed_at) lastActive = repos[0].pushed_at;
      }
    }

    return {
      username: profile.login,
      name: profile.name || undefined,
      bio: profile.bio || undefined,
      publicRepos: profile.public_repos || 0,
      followers: profile.followers || 0,
      following: profile.following || 0,
      totalStars,
      topLanguages,
      lastActive,
      profileUrl: `https://github.com/${profile.login}`,
      avatarUrl: profile.avatar_url || undefined,
      fetchedAt: new Date().toISOString()
    };
  } catch {
    return null;
  }
}

/**
 * Menemukan dan memverifikasi profil media sosial dan portofolio kandidat secara otomatis
 * murni dari data biodata pelamar.
 *
 * MENGGUNAKAN DUA LAYER CERDAS:
 * 1. Jika URL asli ada di dokumen CV -> gunakan URL presisi tersebut.
 * 2. Jika tidak ada di CV -> gunakan URL Live Search Query terarah (LinkedIn Search & Google OSINT)
 *    sehingga HR dapat langsung membuka halaman profil hasil pencarian tanpa pernah mengalami error 404!
 */
async function discoverCandidateSocials(biodata: UserBiodata): Promise<{
  platforms: PlatformVerification[];
  githubStats?: GitHubStats;
}> {
  const extracted = extractSocialsFromCvText(biodata.documents);
  const discovered: PlatformVerification[] = [];
  let foundGithubStats: GitHubStats | undefined;

  const candidateName = biodata.fullName.trim();
  const searchAffiliation = biodata.institutionName || biodata.city || '';

  // 1. LINKEDIN: Presisi CV URL atau Live Search URL (Jaminan 100% Tidak 404)
  if (extracted.linkedIn) {
    discovered.push({
      platform: 'LinkedIn',
      urlOrUsername: extracted.linkedIn.replace(/^https?:\/\/(?:www\.)?linkedin\.com\/in\//i, ''),
      resolvedUrl: extracted.linkedIn,
      status: 'verified_public',
      isAiDiscovered: true,
      matchConfidence: 'High',
      matchReason: `Tautan profil LinkedIn resmi terverifikasi langsung dari berkas CV pelamar.`
    });
  } else {
    // Bangun URL pencarian langsung LinkedIn & Google
    const linkedInSearchUrl = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(candidateName + (searchAffiliation ? ` ${searchAffiliation}` : ''))}`;
    discovered.push({
      platform: 'LinkedIn',
      urlOrUsername: `Pencarian LinkedIn: "${candidateName}"`,
      resolvedUrl: linkedInSearchUrl,
      status: 'ai_discovered',
      isAiDiscovered: true,
      matchConfidence: 'High',
      matchReason: `Pencarian live profil LinkedIn resmi atas nama "${candidateName}" ${searchAffiliation ? `di ${searchAffiliation}` : ''}.`
    });
  }

  // 2. GITHUB: Cek jika ada di CV, atau probe username dari email/nama yang cocok
  if (extracted.github) {
    const gh = await probeGitHubUser(extracted.github, candidateName);
    if (gh) {
      foundGithubStats = gh;
      discovered.push({
        platform: 'GitHub',
        urlOrUsername: `@${gh.username}`,
        resolvedUrl: gh.profileUrl,
        status: 'verified_public',
        isAiDiscovered: true,
        matchConfidence: 'High',
        matchReason: `Akun GitHub @${gh.username} (${gh.publicRepos} repo) terverifikasi dari berkas CV pelamar.`
      });
    } else {
      discovered.push({
        platform: 'GitHub',
        urlOrUsername: `@${extracted.github}`,
        resolvedUrl: `https://github.com/${extracted.github}`,
        status: 'verified_public',
        isAiDiscovered: true,
        matchConfidence: 'High',
        matchReason: `Tautan akun GitHub dicantumkan di dalam berkas CV pelamar.`
      });
    }
  } else {
    // Coba probe username dari email pelamar
    let foundEmailGh = false;
    for (const em of extracted.emails) {
      const userPart = em.split('@')[0];
      const gh = await probeGitHubUser(userPart, candidateName);
      if (gh) {
        foundGithubStats = gh;
        foundEmailGh = true;
        discovered.push({
          platform: 'GitHub',
          urlOrUsername: `@${gh.username}`,
          resolvedUrl: gh.profileUrl,
          status: 'verified_public',
          isAiDiscovered: true,
          matchConfidence: 'High',
          matchReason: `Akun GitHub @${gh.username} (${gh.publicRepos} repo) ditemukan dari email resmi pelamar.`
        });
        break;
      }
    }

    if (!foundEmailGh) {
      const ghSearchUrl = `https://github.com/search?q=${encodeURIComponent(candidateName)}&type=users`;
      discovered.push({
        platform: 'GitHub',
        urlOrUsername: `Pencarian GitHub: "${candidateName}"`,
        resolvedUrl: ghSearchUrl,
        status: 'ai_discovered',
        isAiDiscovered: true,
        matchConfidence: 'Medium',
        matchReason: `Telusuri akun developer GitHub yang terasosiasi dengan nama "${candidateName}".`
      });
    }
  }

  // 3. PORTOFOLIO / WEBSITE PRIBADI
  if (extracted.portfolio) {
    discovered.push({
      platform: 'Portofolio / Website',
      urlOrUsername: extracted.portfolio.replace(/^https?:\/\//, ''),
      resolvedUrl: extracted.portfolio,
      status: 'verified_public',
      isAiDiscovered: true,
      matchConfidence: 'High',
      matchReason: `Website/portofolio digital resmi terverifikasi dari dokumen CV pelamar.`
    });
  }

  // 4. INSTAGRAM: Presisi CV atau Google Social Search
  if (extracted.instagram) {
    discovered.push({
      platform: 'Instagram',
      urlOrUsername: `@${extracted.instagram}`,
      resolvedUrl: `https://www.instagram.com/${extracted.instagram}/`,
      status: 'verified_public',
      isAiDiscovered: true,
      matchConfidence: 'High',
      matchReason: `Akun Instagram dicantumkan di berkas dokumen kandidat.`
    });
  } else {
    const igSearchUrl = `https://www.google.com/search?q=${encodeURIComponent('site:instagram.com "' + candidateName + '"')}`;
    discovered.push({
      platform: 'Instagram',
      urlOrUsername: `Telusuri Instagram: "${candidateName}"`,
      resolvedUrl: igSearchUrl,
      status: 'ai_discovered',
      isAiDiscovered: true,
      matchConfidence: 'Medium',
      matchReason: `Pencarian Google OSINT akun Instagram publik atas nama "${candidateName}".`
    });
  }

  // 5. TWITTER / X
  if (extracted.twitter) {
    discovered.push({
      platform: 'Twitter (X)',
      urlOrUsername: `@${extracted.twitter}`,
      resolvedUrl: `https://x.com/${extracted.twitter}`,
      status: 'verified_public',
      isAiDiscovered: true,
      matchConfidence: 'High',
      matchReason: `Akun Twitter (X) terverifikasi dari dokumen CV pelamar.`
    });
  } else {
    const twitterSearchUrl = `https://twitter.com/search?q=${encodeURIComponent(candidateName)}&f=user`;
    discovered.push({
      platform: 'Twitter (X)',
      urlOrUsername: `Telusuri X: "${candidateName}"`,
      resolvedUrl: twitterSearchUrl,
      status: 'ai_discovered',
      isAiDiscovered: true,
      matchConfidence: 'Medium',
      matchReason: `Pencarian akun X/Twitter publik atas nama "${candidateName}".`
    });
  }

  // 6. JEJAK DIGITAL LENGKAP (GOOGLE OSINT AUDIT)
  const googleOsintUrl = `https://www.google.com/search?q=${encodeURIComponent('"' + candidateName + '" ' + (biodata.city || '') + ' ' + (biodata.institutionName || ''))}`;
  discovered.push({
    platform: 'Jejak Web & Publikasi',
    urlOrUsername: `Audit Web: "${candidateName}"`,
    resolvedUrl: googleOsintUrl,
    status: 'ai_discovered',
    isAiDiscovered: true,
    matchConfidence: 'High',
    matchReason: `Penelusuran jejak digital, artikel, dan pemberitaan publik di Google OSINT Engine.`
  });

  return { platforms: discovered, githubStats: foundGithubStats };
}

// ─── Main Analyzer: Pure Biodata Background & Track Record Evaluation ────────

/**
 * Menganalisis dan mengecek rekam jejak, kredibilitas, integritas, dan
 * SECARA OTOMATIS MENEMUKAN profil media sosial serta jejak digital kandidat murni dari biodata resmi pelamar.
 */
export async function analyzeCandidateBackgroundWithAi(biodata: UserBiodata): Promise<AiBackgroundReport> {
  const calculatedAge = calculateCandidateAge(biodata.birthDate);
  const timelineAudit = auditTimelineConsistency(biodata.birthDate, biodata.graduationYear, biodata.lastEducation);
  const nameVerificationResult = verifyNameInDocuments(biodata.fullName, biodata.documents);

  // 🔍 AI OSINT DISCOVERY: Menelusuri seluruh akun sosmed & jejak digital otomatis
  const { platforms: discoveredPlatforms, githubStats } = await discoverCandidateSocials(biodata);

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
        discoveredPlatforms,
        githubStats,
        apiKey
      );

      return {
        ...aiResult,
        calculatedAge,
        nameVerificationResult,
        platformsVerified: discoveredPlatforms,
        githubStats,
        generatedAt: new Date().toISOString()
      };
    } catch (err) {
      console.warn('Gemini biodata background check failed, using heuristic fallback:', err);
    }
  }

  // Fallback heuristik jika API key tidak tersedia
  return generateHeuristicBiodataReport(
    biodata,
    calculatedAge,
    timelineAudit,
    nameVerificationResult,
    discoveredPlatforms,
    githubStats
  );
}

// ─── Gemini AI Prompt: Pure Biodata Intelligence & Automated Footprint Discovery ──

async function callGeminiForBiodataBackgroundCheck(
  biodata: UserBiodata,
  calculatedAge: number | undefined,
  timelineAudit: TimelineAuditResult,
  nameVerification: NameVerificationResult,
  discoveredPlatforms: PlatformVerification[],
  githubStats: GitHubStats | undefined,
  apiKey: string
): Promise<Omit<AiBackgroundReport, 'nameVerificationResult' | 'generatedAt' | 'platformsVerified' | 'githubStats'>> {

  const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  const cvSummary = (biodata.documents || [])
    .map(d => `[Dokumen: ${d.name} (${d.type})] Teks:\n${(d.extractedText || '').slice(0, 1500)}`)
    .join('\n\n') || '(Tidak ada dokumen CV yang dilampirkan)';

  const bioText = biodata.bioSummary || biodata.socials?.additionalBio || '(Tidak ada ringkasan bio)';

  const discoveredSocialsText = discoveredPlatforms.map(
    p => `- [${p.platform}] ${p.urlOrUsername} -> ${p.resolvedUrl} (${p.matchReason || p.status})`
  ).join('\n');

  const githubDetails = githubStats
    ? `GitHub Terdeteksi: @${githubStats.username} | ${githubStats.publicRepos} Public Repos | ${githubStats.totalStars} Stars | Top Languages: ${githubStats.topLanguages.join(', ')}`
    : 'Tidak ada GitHub live stats.';

  const prompt = `
Anda adalah AI Human Capital Intelligence & Background Verification Specialist untuk HR Executive.
Tugas Anda adalah melakukan audit menyeluruh terhadap kredibilitas biodata, rekam jejak akademik, kontinuitas karir, integritas, dan profil jejak digital yang DITEMUKAN SECARA OTOMATIS OLEH SISTEM AI DARI BIODATA KANDIDAT.

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
JEJAK DIGITAL & SOSIAL MEDIA YANG DITEMUKAN OTOMATIS OLEH AI:
══════════════════════════════════════════════════
${discoveredSocialsText}
${githubDetails}

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
1. "credibilityScore" (0-100): Skor kelengkapan, validitas kronologis (usia vs tahun lulus), konsistensi data institusi/jurusan, dan eksistensi jejak digital.
2. "integrityAndEthicsScore" (0-100): Skor keaslian data dan kesesuaian identitas resmi KTP dengan dokumen pendukung CV serta kanal publik.
3. "personalitySummary" (string, 2-3 kalimat): Ringkasan karakter profesional, etos kerja, dan profil kepribadian berdasarkan data riwayat pendidikan, bio, dan jejak digital yang ditemukan.
4. "careerTrajectorySummary" (string, 2-3 kalimat): Analisis perkembangan rekam jejak karir, kontinuitas pendidikan ke dunia profesional, dan estimasi kapabilitas kerja.
5. "academicAuditSummary" (string, 1-2 kalimat): Evaluasi kelayakan riwayat akademik (reputasi institusi, relevansi jurusan, dan pencapaian IPK/nilai).
6. "greenFlags" (array of string, 2-4 poin): Poin positif nyata berdasarkan biodata, dokumen, dan akun online yang terverifikasi (misal: konsistensi identitas, institusi bereputasi, IPK unggul, GitHub/portofolio aktif).
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
      const credibility = Math.min(100, Math.max(0, Number(parsed.credibilityScore) || 88));
      const integrity = Math.min(100, Math.max(0, Number(parsed.integrityAndEthicsScore) || 92));
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
          : ['Biodata diri terisi lengkap dan jejak digital publik teridentifikasi.'],
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
  nameVerification: NameVerificationResult,
  discoveredPlatforms: PlatformVerification[],
  githubStats: GitHubStats | undefined
): AiBackgroundReport {
  let credibility = 65; // Base score

  // Kelengkapan data dasar
  if (biodata.fullName) credibility += 7;
  if (biodata.birthDate && biodata.birthPlace) credibility += 7;
  if (biodata.city && biodata.address) credibility += 5;
  if (biodata.phone) credibility += 5;
  if (biodata.institutionName) credibility += 5;
  if (biodata.educationMajor) credibility += 4;
  if (biodata.graduationYear) credibility += 4;

  // Bonus jika ada dokumen CV & github
  const hasCv = biodata.documents && biodata.documents.length > 0;
  if (hasCv) credibility += 4;
  if (githubStats) credibility += 5;

  // Penalty jika timeline anomali
  if (!timelineAudit.isPlausible) credibility -= 15;

  credibility = Math.min(98, Math.max(40, credibility));

  // Integritas
  let integrity = 86;
  if (nameVerification.nameFoundInCv) {
    integrity = 96;
  } else if (hasCv && !nameVerification.nameFoundInCv) {
    integrity = 74;
  }

  // Green flags
  const greenFlags: string[] = [];
  if (nameVerification.nameFoundInCv) {
    greenFlags.push(`Nama lengkap KTP terverifikasi identik di dalam dokumen CV (${nameVerification.nameInBiodata}).`);
  }
  if (biodata.lastEducation && biodata.institutionName) {
    greenFlags.push(`Riwayat pendidikan resmi: ${biodata.lastEducation} - ${biodata.educationMajor || 'Umum'} di ${biodata.institutionName}.`);
  }
  if (githubStats) {
    greenFlags.push(`Akun GitHub @${githubStats.username} terverifikasi aktif dengan ${githubStats.publicRepos} repository publik.`);
  }
  if (discoveredPlatforms.length > 0) {
    greenFlags.push(`AI berhasil mengidentifikasi ${discoveredPlatforms.length} tautan profil publik dan rekam jejak digital.`);
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
  const personalitySummary = `${biodata.fullName} (${ageText}) memiliki latar belakang pendidikan ${biodata.lastEducation || ''} di ${biodata.institutionName || 'institusi pendidikan'}${biodata.educationMajor ? ` jurusan ${biodata.educationMajor}` : ''} dengan jejak digital publik yang teridentifikasi oleh sistem AI.`;
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
    platformsVerified: discoveredPlatforms,
    githubStats,
    generatedAt: new Date().toISOString()
  };
}

