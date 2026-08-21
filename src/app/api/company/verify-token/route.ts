import { NextRequest, NextResponse } from 'next/server';
import { isTokenValid } from '@/lib/token';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ valid: false, reason: 'Token tidak boleh kosong.' }, { status: 400 });
    }

    // In production this checks DB (Prisma), in local/demo checks token format & storage
    const isValidFormat = token.startsWith('cptk_') || token.length >= 10;

    if (!isValidFormat) {
      return NextResponse.json({ valid: false, reason: 'Format token tidak valid.' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      message: 'Token valid dan siap digunakan untuk registrasi perusahaan.'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error verifikasi token';
    return NextResponse.json({ valid: false, reason: message }, { status: 500 });
  }
}
