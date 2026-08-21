import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PATCH /api/applications/[id] - Update status or HR notes
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { status, hrNotes } = body;

    const updated = await prisma.application.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(hrNotes !== undefined && { hrNotes }),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Status lamaran berhasil diperbarui!',
      application: updated
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui status lamaran';
    console.error('Error updating application status:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
