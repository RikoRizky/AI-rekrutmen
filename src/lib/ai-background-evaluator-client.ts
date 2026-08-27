'use client';

import { UserBiodata, AiBackgroundReport } from './types';

/**
 * Client-side wrapper yang mendelegasikan analisis ke server route /api/ai-background-check.
 * Ini agar:
 * 1. GEMINI_API_KEY tidak terekspos ke browser
 * 2. Fetch ke GitHub API berjalan dari server (tidak ada CORS)
 * 3. File ai-background-evaluator.ts (server-only) tidak di-import di client bundle
 */
export async function analyzeCandidateBackgroundViaServer(
  biodata: UserBiodata
): Promise<AiBackgroundReport> {
  try {
    const res = await fetch('/api/ai-background-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ biodata })
    });

    const data = await res.json();

    if (res.ok && data.success && data.report) {
      return data.report as AiBackgroundReport;
    }

    console.warn('[ai-background-evaluator-client] Server returned error:', data.error);
  } catch (err) {
    console.warn('[ai-background-evaluator-client] Fetch failed, using local fallback:', err);
  }

  // Fallback minimal jika server tidak tersedia
  return generateMinimalFallback(biodata);
}

function generateMinimalFallback(biodata: UserBiodata): AiBackgroundReport {
  const hasSocials = (biodata.socials.customLinks?.length ?? 0) > 0
    || Boolean(biodata.socials.linkedin)
    || Boolean(biodata.socials.github)
    || Boolean(biodata.socials.instagram);

  return {
    personalitySummary: `${biodata.fullName} memiliki profil pendidikan dari ${biodata.institutionName || 'institusi yang tercantum'}.`,
    digitalFootprintScore: hasSocials ? 72 : 45,
    socialMediaPresenceSummary: hasSocials
      ? 'Kandidat mencantumkan akun media sosial yang perlu diverifikasi manual oleh HR.'
      : 'Tidak ada tautan media sosial yang dicantumkan.',
    integrityAndEthicsScore: 75,
    greenFlags: [
      biodata.institutionName
        ? `Riwayat pendidikan tercantum: ${biodata.lastEducation || ''} di ${biodata.institutionName}`
        : 'Data biodata telah diisi oleh kandidat.',
    ].filter(Boolean),
    redFlags: ['Analisis AI tidak dapat dilakukan saat ini — lakukan verifikasi manual.'],
    hrDiscretionNotes: 'Sistem analisis background tidak tersedia. Disarankan verifikasi manual semua tautan yang dicantumkan.',
    generatedAt: new Date().toISOString()
  };
}
