import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ valid: false, reason: 'Token tidak boleh kosong.' }, { status: 400 });
    }

    // 1. Check in Prisma MySQL DB
    const tokenRecord = await prisma.companyInvitationToken.findUnique({
      where: { token }
    });

    if (!tokenRecord) {
      return NextResponse.json({
        valid: false,
        reason: 'Token pendaftaran tidak valid atau tidak terdaftar di sistem.'
      }, { status: 404 });
    }

    if (tokenRecord.isUsed) {
      return NextResponse.json({
        valid: false,
        reason: 'Link aktivasi pendaftaran ini sudah pernah digunakan untuk membuat akun perusahaan dan sekarang sudah hangus (One-Time Link).'
      }, { status: 400 });
    }

    if (tokenRecord.expiresAt && new Date(tokenRecord.expiresAt) < new Date()) {
      return NextResponse.json({
        valid: false,
        reason: 'Link aktivasi pendaftaran telah kedaluwarsa.'
      }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      token: {
        ...tokenRecord,
        expiresAt: tokenRecord.expiresAt.toISOString(),
        createdAt: tokenRecord.createdAt.toISOString(),
      },
      message: 'Token valid dan siap digunakan untuk registrasi perusahaan.'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error verifikasi token';
    console.error('verify-token error:', error);
    return NextResponse.json({ valid: false, reason: message }, { status: 500 });
  }
}
