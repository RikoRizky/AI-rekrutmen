import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/tokens?token=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenStr = searchParams.get('token');

    if (tokenStr) {
      const token = await prisma.companyInvitationToken.findUnique({
        where: { token: tokenStr }
      });
      if (!token) {
        return NextResponse.json({ success: false, error: 'Token tidak valid' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        token: {
          ...token,
          expiresAt: token.expiresAt.toISOString(),
          createdAt: token.createdAt.toISOString(),
        }
      });
    }

    const tokens = await prisma.companyInvitationToken.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      tokens: tokens.map((t) => ({
        ...t,
        expiresAt: t.expiresAt.toISOString(),
        createdAt: t.createdAt.toISOString(),
      }))
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching tokens';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/tokens (create or consume token)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, token, email, packageType, expiresAt } = body;

    if (action === 'consume') {
      const existing = await prisma.companyInvitationToken.findUnique({
        where: { token }
      });
      if (!existing || existing.isUsed) {
        return NextResponse.json({ success: false, error: 'Token sudah digunakan atau tidak ditemukan' }, { status: 400 });
      }

      const updated = await prisma.companyInvitationToken.update({
        where: { token },
        data: { isUsed: true }
      });

      return NextResponse.json({ success: true, message: 'Token berhasil digunakan', token: updated });
    }

    // Default: create token
    const created = await prisma.companyInvitationToken.create({
      data: {
        id: `token-${Date.now()}`,
        token,
        email,
        packageType: packageType || 'Starter Business',
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    });

    return NextResponse.json({
      success: true,
      token: {
        ...created,
        expiresAt: created.expiresAt.toISOString(),
        createdAt: created.createdAt.toISOString(),
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memproses token';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
