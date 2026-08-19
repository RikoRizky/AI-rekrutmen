import { NextRequest, NextResponse } from 'next/server';
import { evaluateApplicantWithAi } from '@/lib/ai-evaluator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { job, documents, applicantName, applicantHeadline, geminiApiKey, preferredModel } = body;

    if (!job || !documents || !applicantName) {
      return NextResponse.json({ error: 'Missing required fields (job, documents, applicantName)' }, { status: 400 });
    }

    const evaluation = await evaluateApplicantWithAi({
      job,
      documents,
      applicantName,
      applicantHeadline,
      geminiApiKey: geminiApiKey || process.env.GEMINI_API_KEY,
      preferredModel: preferredModel || 'gemini-3.6-flash'
    });

    return NextResponse.json({ success: true, evaluation });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown AI evaluation error';
    console.error('Error in AI analysis route:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
