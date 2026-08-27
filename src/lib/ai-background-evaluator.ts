import {
  UserBiodata,
  AiBackgroundReport,
  GitHubStats,
  PlatformVerification,
  NameVerificationResult
} from './types';

// ─── Layer 1: Real GitHub API Fetch ──────────────────────────────────────────

/**
 * Mengambil data profil GitHub secara nyata dari GitHub REST API (public, no auth required).
 * Rate limit: 60 req/jam tanpa token. Gunakan GITHUB_TOKEN env untuk 5000/jam.
 */
async function fetchGitHubPublicData(usernameOrUrl: string): Promise<GitHubStats | null> {
  try {
    // Ekstrak username dari URL jika diberikan URL
    let username = usernameOrUrl.trim();
    const ghMatch = username.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
    if (ghMatch) username = ghMatch[1];
    // Bersihkan prefix @ jika ada
    username = username.replace(/^@/, '');

    if (!username || username.length < 1) return null;

    const headers: Record<string, string> = { 'Accept': 'application/vnd.github.v3+json' };
    const token = process.env.GITHUB_TOKEN;
    if (token) headers['Authorization'] = `token ${token}`;

    // Fetch profil user
    const profileRes = await fetch(`https://api.github.com/users/${username}`, {
      headers,
      next: { revalidate: 3600 } // cache 1 jam di Next.js
    });

    if (!profileRes.ok) {
      if (profileRes.status === 404) return null; // user tidak ada
      console.warn(`GitHub API error for user ${username}: HTTP ${profileRes.status}`);
      return null;
    }

    const profile = await profileRes.json();

    // Fetch repos untuk hitung total stars dan top languages
    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=30&sort=pushed&direction=desc`,
      { headers, next: { revalidate: 3600 } }
    );

    let totalStars = 0;
    let topLanguages: string[] = [];
    let lastActive: string | undefined;

    if (reposRes.ok) {
      const repos = await reposRes.json();
      if (Array.isArray(repos)) {
        // Hitung total stars
        totalStars = repos.reduce((sum: number, r: { stargazers_count?: number }) => sum + (r.stargazers_count || 0), 0);

        // Hitung bahasa paling banyak dipakai
        const langCount: Record<string, number> = {};
        for (const repo of repos) {
          if (repo.language) {
            langCount[repo.language] = (langCount[repo.language] || 0) + 1;
          }
        }
        topLanguages = Object.entries(langCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 4)
          .map(([lang]) => lang);

        // Ambil tanggal push terakhir
        if (repos[0]?.pushed_at) {
          lastActive = repos[0].pushed_at;
        }
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
  } catch (err) {
    console.warn('fetchGitHubPublicData error:', err);
    return null;
  }
}

// ─── Layer 2: Platform URL Normalization & Real HTTP Verification ─────────────

/**
 * Platform yang bisa diverifikasi via HTTP (tidak block server request).
 * LinkedIn dan beberapa platform lain memblokir non-browser request.
 */
const VERIFIABLE_PLATFORMS = new Set(['github', 'portofolio / website', 'youtube', 'behance / dribbble', 'medium / dev.to', 'lainnya']);

/**
 * Verifikasi URL sosial media secara nyata lewat HTTP request.
 * - 200-299 atau 301/302: verified_public
 * - 404: not_found
 * - Error/timeout/blocked: fallback ke status username_provided/url_provided
 */
async function verifyUrlExists(url: string, platform: string): Promise<'verified_public' | 'username_provided' | 'url_provided' | 'not_found'> {
  const isUsername = !url.startsWith('http');
  const baseStatus: 'username_provided' | 'url_provided' = isUsername ? 'username_provided' : 'url_provided';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SmartRecruit-Bot/1.0; +https://smartrecruit.id)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow'
    });
    clearTimeout(timeout);

    if (res.status === 404 || res.status === 410) {
      return 'not_found';
    }
    if (res.status >= 200 && res.status < 400) {
      return 'verified_public';
    }
    // Lain-lain (403, 405, dll) — platform mungkin block HEAD, asumsikan ada
    return baseStatus;
  } catch {
    // Timeout / CORS / network error — tidak bisa diverifikasi, asumsikan mungkin ada
    return baseStatus;
  }
}

/**
 * Normalisasi URL/username sosial media, lalu verifikasi mana yang bisa dicek lewat HTTP.
 * GitHub: gunakan API (sudah dilakukan di layer 1).
 * Platform terverifikasi: coba HEAD request.
 * LinkedIn/Instagram/TikTok/Facebook: bangun URL saja, tidak bisa dicek server-side (diblokir).
 */
async function normalizeSocialPlatforms(
  socials: UserBiodata['socials']
): Promise<PlatformVerification[]> {
  const result: PlatformVerification[] = [];

  const entries = socials.customLinks && socials.customLinks.length > 0
    ? socials.customLinks
    : [
        socials.linkedin ? { platform: 'LinkedIn', urlOrUsername: socials.linkedin } : null,
        socials.github ? { platform: 'GitHub', urlOrUsername: socials.github } : null,
        socials.instagram ? { platform: 'Instagram', urlOrUsername: socials.instagram } : null,
        socials.tiktok ? { platform: 'TikTok', urlOrUsername: socials.tiktok } : null,
        socials.facebook ? { platform: 'Facebook', urlOrUsername: socials.facebook } : null,
        socials.twitter ? { platform: 'Twitter (X)', urlOrUsername: socials.twitter } : null,
        socials.portfolioUrl ? { platform: 'Portofolio / Website', urlOrUsername: socials.portfolioUrl } : null,
      ].filter(Boolean) as { platform: string; urlOrUsername: string }[];

  const platformBaseUrls: Record<string, string> = {
    'linkedin': 'https://linkedin.com/in/',
    'github': 'https://github.com/',
    'instagram': 'https://www.instagram.com/',
    'tiktok': 'https://www.tiktok.com/@',
    'facebook': 'https://facebook.com/',
    'twitter (x)': 'https://x.com/',
    'twitter': 'https://x.com/',
    'youtube': 'https://www.youtube.com/@',
    'threads': 'https://www.threads.net/@',
    'behance / dribbble': 'https://www.behance.net/',
    'medium / dev.to': 'https://dev.to/',
  };

  // Verifikasi semua platform secara parallel
  const tasks = entries.map(async (entry) => {
    const raw = entry.urlOrUsername.trim();
    if (!raw) return null;

    const platformLower = entry.platform.toLowerCase();
    let resolvedUrl: string;
    let isRawUrl = false;

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      resolvedUrl = raw;
      isRawUrl = true;
    } else {
      const baseUrl = platformBaseUrls[platformLower];
      const cleanUsername = raw.replace(/^@/, '');
      resolvedUrl = baseUrl ? `${baseUrl}${cleanUsername}` : `https://${raw}`;
    }

    let status: PlatformVerification['status'];

    if (platformLower === 'github') {
      // GitHub diverifikasi via API tersendiri di layer 1
      status = isRawUrl ? 'url_provided' : 'username_provided';
    } else if (isRawUrl || VERIFIABLE_PLATFORMS.has(platformLower)) {
      // URL penuh atau platform yang bisa dicek server-side
      status = await verifyUrlExists(resolvedUrl, platformLower);
    } else {
      // Platform yang block server request (LinkedIn, Instagram, TikTok, Facebook, Twitter)
      // Bangun URL saja, tandai sebagai username_provided — perlu verifikasi manual
      status = isRawUrl ? 'url_provided' : 'username_provided';
    }

    return {
      platform: entry.platform,
      urlOrUsername: raw,
      resolvedUrl,
      status
    } as PlatformVerification;
  });

  const resolved = await Promise.all(tasks);
  for (const item of resolved) {
    if (item) result.push(item);
  }

  return result;
}

// ─── Layer 3: Name Cross-Verification (lokal, tanpa AI halusinasi) ──────────

/**
 * Verifikasi apakah nama lengkap dari biodata/KTP ditemukan di dalam teks dokumen CV.
 * Dilakukan secara lokal — tidak perlu API, tidak bisa dihalusinasi.
 */
function verifyNameInDocuments(
  fullName: string,
  documents?: UserBiodata['documents']
): NameVerificationResult {
  if (!documents || documents.length === 0) {
    return {
      nameInBiodata: fullName,
      nameFoundInCv: false,
      nameVariantsFound: [],
      verificationNote: 'Tidak ada dokumen CV yang diunggah untuk diverifikasi nama.'
    };
  }

  const cvTexts = documents
    .filter(d => d.type === 'cv' || d.type === 'cover_letter')
    .map(d => d.extractedText || '')
    .join('\n')
    .toLowerCase();

  const nameParts = fullName.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const nameVariantsFound: string[] = [];

  // Cek nama lengkap (exact match)
  if (cvTexts.includes(fullName.trim().toLowerCase())) {
    nameVariantsFound.push(fullName.trim());
  }

  // Cek setiap bagian nama (minimal first name + last name)
  if (nameParts.length >= 2) {
    const firstLast = `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
    if (!nameVariantsFound.includes(firstLast) && cvTexts.includes(firstLast)) {
      nameVariantsFound.push(firstLast);
    }
    // Cek hanya nama pertama
    if (cvTexts.includes(nameParts[0])) {
      const matchWord = new RegExp(`\\b${nameParts[0]}\\b`);
      if (matchWord.test(cvTexts) && !nameVariantsFound.find(v => v === nameParts[0])) {
        nameVariantsFound.push(nameParts[0]);
      }
    }
  } else if (nameParts.length === 1) {
    if (cvTexts.includes(nameParts[0])) {
      nameVariantsFound.push(nameParts[0]);
    }
  }

  const nameFoundInCv = nameVariantsFound.length > 0;

  let verificationNote = '';
  if (nameFoundInCv && nameVariantsFound[0]?.toLowerCase() === fullName.trim().toLowerCase()) {
    verificationNote = `✅ Nama lengkap "${fullName}" ditemukan di dalam dokumen CV — konsisten dengan biodata resmi.`;
  } else if (nameFoundInCv) {
    verificationNote = `⚠️ Variasi nama "${nameVariantsFound.join('", "')}" ditemukan di CV, namun tidak identik persis dengan nama KTP "${fullName}". HR perlu memverifikasi.`;
  } else {
    verificationNote = `❌ Nama "${fullName}" tidak ditemukan di dalam dokumen CV/cover letter yang diunggah. Perlu klarifikasi dari kandidat.`;
  }

  return {
    nameInBiodata: fullName,
    nameFoundInCv,
    nameVariantsFound,
    verificationNote
  };
}

// ─── Main Analyzer ────────────────────────────────────────────────────────────

/**
 * Menganalisis riwayat hidup dan jejak digital kandidat secara nyata.
 * Layer 1: Fetch data GitHub API asli (bukan karangan)
 * Layer 2: Normalisasi dan klasifikasi URL semua platform
 * Layer 3: Cross-verify nama KTP vs dokumen CV
 * Layer 4: Kirim semua data nyata ke Gemini untuk sintesis — bukan hallusinasi
 */
export async function analyzeCandidateBackgroundWithAi(biodata: UserBiodata): Promise<AiBackgroundReport> {
  // --- Layer 2: Normalisasi + verifikasi HTTP platform (async) ---
  const platformsVerified = await normalizeSocialPlatforms(biodata.socials);

  // --- Layer 1: Fetch GitHub data nyata ---
  const githubEntry = platformsVerified.find(
    p => p.platform.toLowerCase() === 'github'
  ) || (biodata.socials.github
    ? { platform: 'GitHub', urlOrUsername: biodata.socials.github, resolvedUrl: '', status: 'username_provided' as const }
    : null);

  let githubStats: GitHubStats | undefined;
  if (githubEntry?.urlOrUsername) {
    const fetched = await fetchGitHubPublicData(githubEntry.urlOrUsername);
    if (fetched) githubStats = fetched;
  }

  // --- Layer 3: Cross-verify nama ---
  const nameVerificationResult = verifyNameInDocuments(biodata.fullName, biodata.documents);

  // --- Build platform summary text ---
  const platformSummaryText = platformsVerified.length > 0
    ? platformsVerified.map(p => {
        const ghData = p.platform.toLowerCase() === 'github' && githubStats
          ? ` [REAL DATA: ${githubStats.publicRepos} repos publik, ${githubStats.followers} followers, ${githubStats.totalStars} total stars, bahasa: ${githubStats.topLanguages.slice(0, 3).join('/')}]`
          : '';
        return `- ${p.platform}: ${p.resolvedUrl} (${p.status})${ghData}`;
      }).join('\n')
    : '- Tidak ada tautan media sosial yang dicantumkan';

  const githubSection = githubStats ? `
DATA GITHUB REAL (diambil langsung dari GitHub API):
- Username: @${githubStats.username}
- Nama di GitHub: ${githubStats.name || '(tidak diisi)'}
- Bio: ${githubStats.bio || '(tidak ada bio)'}
- Repo Publik: ${githubStats.publicRepos}
- Followers / Following: ${githubStats.followers} / ${githubStats.following}
- Total Stars Diterima: ${githubStats.totalStars}
- Bahasa Pemrograman Utama: ${githubStats.topLanguages.length > 0 ? githubStats.topLanguages.join(', ') : 'tidak terdeteksi'}
- Aktivitas Terakhir: ${githubStats.lastActive ? new Date(githubStats.lastActive).toLocaleDateString('id-ID') : 'tidak diketahui'}
` : (githubEntry ? `INFO GITHUB: Username "${githubEntry.urlOrUsername}" diberikan namun tidak dapat diambil data dari GitHub API (akun mungkin private/tidak ada).` : '');

  const nameVerifSection = `
VERIFIKASI NAMA:
- Nama di Biodata/KTP: ${nameVerificationResult.nameInBiodata}
- Status Verifikasi: ${nameVerificationResult.verificationNote}
`;

  // --- Ambil API key ---
  const apiKey = (
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') || ''
  ).trim();

  if (apiKey && apiKey.length > 10) {
    try {
      const result = await callGeminiForBackgroundCheck(
        biodata,
        platformSummaryText,
        githubSection,
        nameVerifSection,
        apiKey
      );
      return {
        ...result,
        githubStats,
        platformsVerified,
        nameVerificationResult,
        generatedAt: new Date().toISOString()
      };
    } catch (err) {
      console.warn('Gemini background check failed, using heuristic fallback:', err);
    }
  }

  // Fallback heuristik jika tidak ada API key
  return generateHeuristicBackgroundReport(biodata, githubStats, platformsVerified, nameVerificationResult);
}

// ─── Gemini AI Synthesis (berdasarkan data nyata, bukan mengarang) ────────────

async function callGeminiForBackgroundCheck(
  biodata: UserBiodata,
  platformSummaryText: string,
  githubSection: string,
  nameVerifSection: string,
  apiKey: string
): Promise<Omit<AiBackgroundReport, 'githubStats' | 'platformsVerified' | 'nameVerificationResult' | 'generatedAt'>> {

  const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  const prompt = `
Anda adalah AI Spesialis Background Checker & Human Capital Intelligence untuk HR Executive.
Tugas Anda adalah mensintesis data yang diberikan (BUKAN mengarang informasi yang tidak ada) untuk menghasilkan laporan evaluasi latar belakang kandidat.

PENTING: Hanya analisis berdasarkan data yang benar-benar tersedia. Jangan mengarang fakta. Jika data tidak tersedia, nyatakan apa adanya.

═══════════════════════════════════════
DATA BIODATA RESMI KANDIDAT:
═══════════════════════════════════════
- Nama Lengkap (KTP): ${biodata.fullName}
- Jenis Kelamin: ${biodata.gender || 'Tidak dicantumkan'}
- Tempat & Tgl Lahir: ${biodata.birthPlace || '-'}, ${biodata.birthDate || '-'}
- Domisili: ${biodata.city || '-'}
- Pendidikan: ${biodata.lastEducation || '-'} - ${biodata.educationMajor || '-'} di ${biodata.institutionName || '-'} (Lulus: ${biodata.graduationYear || '-'}, IPK: ${biodata.gpa || '-'})


═══════════════════════════════════════
JEJAK SOSIAL MEDIA (DATA REAL):
═══════════════════════════════════════
${platformSummaryText}

${githubSection}

═══════════════════════════════════════
${nameVerifSection}

═══════════════════════════════════════
RINGKASAN PORTOFOLIO KANDIDAT:
═══════════════════════════════════════
${biodata.socials.additionalBio || 'Tidak ada deskripsi tambahan dari kandidat.'}

═══════════════════════════════════════
INSTRUKSI ANALISIS:
═══════════════════════════════════════
1. "personalitySummary": Berdasarkan data pendidikan dan aktivitas digital yang ADA, buat ringkasan karakter profesional (2-3 kalimat). Jangan mengarang jika data minimal.
2. "digitalFootprintScore": Skor 0-100 berdasarkan jumlah dan kualitas platform yang tercantum, kelengkapan profil GitHub (jika ada data real), dan konsistensi online. Berikan skor rendah jika tidak ada data.
3. "socialMediaPresenceSummary": Ringkas keberadaan online berdasarkan platform yang tercantum. Jika GitHub ada datanya, sebutkan angka real (repos, stars). Untuk LinkedIn/Instagram yang tidak ada data API, nyatakan "profil perlu diverifikasi manual".
4. "integrityAndEthicsScore": Skor 0-100. Tinggi jika nama di CV konsisten dengan KTP, profil GitHub ada dan aktif. Turunkan jika ada inkonsistensi nama.
5. "greenFlags": Array 2-4 poin positif yang HANYA berdasarkan data yang benar-benar ada.
6. "redFlags": Array poin peringatan atau kekhawatiran. Jika nama tidak cocok di CV, ini harus masuk redFlags. Jika tidak ada kekhawatiran nyata, isi dengan satu poin "Tidak ditemukan catatan negatif berdasarkan data yang tersedia."
7. "hrDiscretionNotes": Catatan rahasia singkat untuk HR — termasuk saran verifikasi manual jika diperlukan (2 kalimat).

KEMBALIKAN HANYA JSON VALID TANPA BACKTICK/MARKDOWN:
{
  "personalitySummary": "string",
  "digitalFootprintScore": 85,
  "socialMediaPresenceSummary": "string",
  "integrityAndEthicsScore": 90,
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
      return {
        personalitySummary: parsed.personalitySummary || 'Data tidak cukup untuk membuat ringkasan kepribadian.',
        digitalFootprintScore: Math.min(100, Math.max(0, Number(parsed.digitalFootprintScore) || 50)),
        socialMediaPresenceSummary: parsed.socialMediaPresenceSummary || 'Analisis jejak sosial media belum tersedia.',
        integrityAndEthicsScore: Math.min(100, Math.max(0, Number(parsed.integrityAndEthicsScore) || 70)),
        greenFlags: Array.isArray(parsed.greenFlags) && parsed.greenFlags.length > 0
          ? parsed.greenFlags
          : ['Data profil yang dicantumkan tersedia untuk diverifikasi'],
        redFlags: Array.isArray(parsed.redFlags) && parsed.redFlags.length > 0
          ? parsed.redFlags
          : ['Tidak ditemukan catatan negatif berdasarkan data yang tersedia.'],
        hrDiscretionNotes: parsed.hrDiscretionNotes || 'Lakukan verifikasi manual terhadap tautan sosial media yang dicantumkan kandidat.'
      };
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      console.warn(`Background check model ${model} failed:`, lastErr.message);
    }
  }

  throw lastErr || new Error('All Gemini models failed for background check');
}

// ─── Heuristic Fallback (jika Gemini tidak tersedia) ─────────────────────────

function generateHeuristicBackgroundReport(
  biodata: UserBiodata,
  githubStats: GitHubStats | undefined,
  platformsVerified: PlatformVerification[],
  nameVerification: NameVerificationResult
): AiBackgroundReport {
  const hasLinkedIn = platformsVerified.some(p => p.platform.toLowerCase() === 'linkedin');
  const hasGithub = !!githubStats;
  const hasPortfolio = platformsVerified.some(
    p => p.platform.toLowerCase().includes('portofolio') || p.platform.toLowerCase().includes('website')
  );
  const totalPlatforms = platformsVerified.length;

  // Hitung skor berdasarkan data nyata
  let digitalScore = 40; // base
  if (hasLinkedIn) digitalScore += 15;
  if (hasGithub) {
    digitalScore += 15;
    if (githubStats!.publicRepos >= 5) digitalScore += 5;
    if (githubStats!.totalStars >= 10) digitalScore += 5;
    if (githubStats!.followers >= 10) digitalScore += 5;
  }
  if (hasPortfolio) digitalScore += 10;
  if (totalPlatforms >= 3) digitalScore += 5;
  if (biodata.institutionName) digitalScore += 5;
  digitalScore = Math.min(98, digitalScore);

  const integrityScore = nameVerification.nameFoundInCv ? 92 : 70;

  const greenFlags: string[] = [];
  if (hasLinkedIn) greenFlags.push('Profil LinkedIn dicantumkan — dapat diverifikasi manual oleh HR.');
  if (hasGithub) {
    greenFlags.push(
      `GitHub terverifikasi aktif: ${githubStats!.publicRepos} repo publik, ${githubStats!.totalStars} stars, bahasa: ${githubStats!.topLanguages.slice(0, 2).join(' & ') || 'N/A'}.`
    );
  }
  if (hasPortfolio) greenFlags.push('Mencantumkan tautan portofolio / website yang dapat diaudit langsung.');
  if (biodata.lastEducation && biodata.institutionName) {
    greenFlags.push(`Riwayat pendidikan: ${biodata.lastEducation} di ${biodata.institutionName}${biodata.gpa ? `, IPK ${biodata.gpa}` : ''}.`);
  }
  if (nameVerification.nameFoundInCv) {
    greenFlags.push(`Nama di CV konsisten dengan nama KTP (${nameVerification.nameInBiodata}).`);
  }
  if (greenFlags.length === 0) greenFlags.push('Data profil tersedia untuk verifikasi lebih lanjut oleh HR.');

  const redFlags: string[] = [];
  if (!nameVerification.nameFoundInCv && biodata.documents && biodata.documents.length > 0) {
    redFlags.push(`Nama "${nameVerification.nameInBiodata}" tidak ditemukan dalam dokumen CV — perlu klarifikasi.`);
  }
  if (!hasLinkedIn && totalPlatforms === 0) {
    redFlags.push('Tidak ada akun media sosial profesional yang dicantumkan untuk verifikasi.');
  }
  if (!hasGithub && (biodata.socials.github)) {
    redFlags.push(`Username GitHub "${biodata.socials.github}" dicantumkan namun tidak dapat diambil data (akun mungkin tidak ada / private).`);
  }
  if (redFlags.length === 0) redFlags.push('Tidak ditemukan catatan negatif berdasarkan data yang tersedia.');

  const ghSummary = githubStats
    ? `GitHub aktif dengan ${githubStats.publicRepos} repository publik dan ${githubStats.totalStars} stars. Bahasa dominan: ${githubStats.topLanguages.slice(0, 3).join(', ') || 'tidak terdeteksi'}.`
    : '';

  return {
    personalitySummary: `${biodata.fullName} memiliki latar belakang pendidikan ${biodata.lastEducation || ''} dari ${biodata.institutionName || 'institusi yang tercantum'}${biodata.educationMajor ? ` bidang ${biodata.educationMajor}` : ''}. ${ghSummary}`,
    digitalFootprintScore: digitalScore,
    socialMediaPresenceSummary: `Kandidat mencantumkan ${totalPlatforms} platform digital. ${ghSummary} ${hasLinkedIn ? 'LinkedIn tersedia untuk verifikasi jaringan profesional.' : ''} ${!hasGithub && !hasLinkedIn ? 'Disarankan HR melakukan verifikasi manual.' : ''}`.trim(),
    integrityAndEthicsScore: integrityScore,
    greenFlags,
    redFlags,
    hrDiscretionNotes: `Lakukan klik dan verifikasi manual pada tautan yang dicantumkan kandidat. ${nameVerification.verificationNote}`,
    githubStats,
    platformsVerified,
    nameVerificationResult: nameVerification,
    generatedAt: new Date().toISOString()
  };
}
