import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/jobs/[id] - Get job details by ID
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            industry: true,
            website: true,
            address: true,
            description: true,
            isVerified: true
          }
        },
        _count: {
          select: { applications: true }
        }
      }
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Lowongan kerja tidak ditemukan' }, { status: 404 });
    }

    const formattedJob = {
      ...job,
      companyLogo: job.company?.logo || job.companyLogo,
      companyIndustry: job.company?.industry || job.companyIndustry,
      companyName: job.company?.name || job.companyName,
      createdAt: job.createdAt.toISOString(),
      deadline: job.deadline ? job.deadline.toISOString() : undefined,
      applicantCount: job._count.applications,
    };

    return NextResponse.json({ success: true, job: formattedJob });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch job detail';
    console.error('Error fetching job detail:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT /api/jobs/[id] - Update job details
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.department && { department: body.department }),
        ...(body.location && { location: body.location }),
        ...(body.type && { type: body.type }),
        ...(body.experienceLevel && { experienceLevel: body.experienceLevel }),
        ...(body.salaryRange !== undefined && { salaryRange: body.salaryRange }),
        ...(body.description && { description: body.description }),
        ...(body.requirements && { requirements: body.requirements }),
        ...(body.responsibilities && { responsibilities: body.responsibilities }),
        ...(body.keySkills && { keySkills: body.keySkills }),
        ...(body.minEducation !== undefined && { minEducation: body.minEducation }),
        ...(body.status && { status: body.status }),
        ...(body.deadline !== undefined && { deadline: body.deadline ? new Date(body.deadline) : null }),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Lowongan kerja berhasil diperbarui!',
      job: {
        ...updatedJob,
        createdAt: updatedJob.createdAt.toISOString(),
        deadline: updatedJob.deadline ? updatedJob.deadline.toISOString() : undefined,
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui lowongan kerja';
    console.error('Error updating job:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/jobs/[id] - Delete a job
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Delete related applications or cascade
    await prisma.job.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Lowongan berhasil dihapus' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus lowongan';
    console.error('Error deleting job:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
