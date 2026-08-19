import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const apiKey = (body.apiKey || process.env.GEMINI_API_KEY || '').trim();
    const model = (body.model || 'gemini-3.6-flash').trim();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key tidak ditemukan. Harap masukkan Google Gemini API Key Anda.' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Balas dalam JSON valid: {"status": "connected", "message": "Google Gemini AI ATS Screening Engine Active", "engine": "Real Gemini AI"}' }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: `Gemini API HTTP ${response.status}: ${errorText}`,
        latencyMs
      }, { status: 400 });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());

    return NextResponse.json({
      success: true,
      model,
      latencyMs,
      message: 'Koneksi ke Google Gemini AI Berhasil!',
      details: parsed
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal terhubung ke Google Gemini';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
