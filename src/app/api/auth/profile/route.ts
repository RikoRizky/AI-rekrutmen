import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/auth/profile - Update user biodata and profile
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, biodata, avatarUrl } = body;

    if (!userId || !biodata) {
      return NextResponse.json({ success: false, error: 'User ID and biodata are required' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(biodata.fullName && { name: biodata.fullName }),
        ...(biodata.phone && { phone: biodata.phone }),
        ...(avatarUrl && { image: avatarUrl }),
        biodata: JSON.parse(JSON.stringify(biodata)),
        profileCompleted: true,
      },
      include: { company: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Profil & Biodata berhasil diperbarui di database!',
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        headline: updated.headline,
        avatar: updated.image,
        companyId: updated.companyId,
        companyName: updated.company?.name,
        biodata: updated.biodata as any,
        profileCompleted: updated.profileCompleted,
        createdAt: updated.createdAt.toISOString(),
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui biodata user';
    console.error('Error updating user profile:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
