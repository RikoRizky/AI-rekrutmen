import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      token,
      companyName,
      industry,
      address,
      website,
      description,
      adminName,
      adminEmail,
      adminPhone,
      password,
      logo
    } = body;

    if (!token || !companyName || !adminEmail || !adminName) {
      return NextResponse.json(
        { error: 'Field token, nama perusahaan, nama admin, dan email wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Verify token in Prisma DB
    const tokenRecord = await prisma.companyInvitationToken.findUnique({
      where: { token }
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Token pendaftaran tidak valid atau tidak ditemukan.' },
        { status: 400 }
      );
    }

    if (tokenRecord.isUsed) {
      return NextResponse.json(
        { error: 'Link aktivasi pendaftaran ini sudah pernah digunakan sebelumnya (One-Time Link).' },
        { status: 400 }
      );
    }

    if (tokenRecord.expiresAt && new Date(tokenRecord.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Link pendaftaran telah kedaluwarsa.' },
        { status: 400 }
      );
    }

    // 2. Atomically mark token as consumed in DB
    await prisma.companyInvitationToken.update({
      where: { token },
      data: { isUsed: true }
    });

    // 3. Create or update Company in DB
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 6);
    const company = await prisma.company.create({
      data: {
        id: `comp-${Date.now()}`,
        name: companyName,
        slug,
        industry: industry || 'Teknologi Informasi',
        address: address || '',
        website: website || '',
        description: description || '',
        logo: logo || null,
        activeSubscription: tokenRecord.packageType || 'Professional',
        subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000),
        jobQuota: 20,
        isVerified: true
      }
    });

    // 4. Create or update Admin User in DB
    let user = await prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase().trim() }
    });

    if (user) {
      user = await prisma.user.update({
        where: { email: adminEmail.toLowerCase().trim() },
        data: {
          name: adminName,
          phone: adminPhone || user.phone,
          role: 'company_admin',
          companyId: company.id,
          password: password || user.password
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          id: `user-${Date.now()}`,
          name: adminName,
          email: adminEmail.toLowerCase().trim(),
          password: password || '123456',
          phone: adminPhone || '',
          role: 'company_admin',
          companyId: company.id,
          profileCompleted: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Perusahaan & Akun HRD berhasil didaftarkan!',
      company,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        companyId: company.id,
        companyName: company.name
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mendaftarkan perusahaan';
    console.error('Registration error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
