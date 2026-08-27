import { NextRequest, NextResponse } from 'next/server';
import { analyzeCandidateBackgroundWithAi } from '@/lib/ai-background-evaluator';
import { UserBiodata } from '@/lib/types';

/**
 * POST /api/ai-background-check
 * Server-side endpoint untuk analisis latar belakang kandidat.
 * Dijalankan di server agar:
 * - GEMINI_API_KEY dari .env tidak terekspos ke browser
 * - Fetch GitHub API dilakukan dari server (tidak ada CORS issue)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { biodata } = body as { biodata: UserBiodata };

    if (!biodata || !biodata.fullName) {
      return NextResponse.json(
        { error: 'Missing required field: biodata.fullName' },
        { status: 400 }
      );
    }

    const report = await analyzeCandidateBackgroundWithAi(biodata);

    return NextResponse.json({ success: true, report });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown background check error';
    console.error('[ai-background-check] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
