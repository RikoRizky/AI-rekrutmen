import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/jobs - List all jobs with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};

    if (companyId && companyId !== 'all') {
      where.companyId = companyId;
    }
    if (department && department !== 'all') {
      where.department = department;
    }
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { companyName: { contains: search } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            industry: true,
            isVerified: true,
          }
        },
        _count: {
          select: { applications: true }
        }
      }
    });

    const formattedJobs = jobs.map((j) => ({
      ...j,
      companyLogo: j.company?.logo || j.companyLogo,
      companyIndustry: j.company?.industry || j.companyIndustry,
      companyName: j.company?.name || j.companyName,
      createdAt: j.createdAt.toISOString(),
      deadline: j.deadline ? j.deadline.toISOString() : undefined,
      applicantCount: j._count.applications,
    }));

    return NextResponse.json({ success: true, jobs: formattedJobs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch jobs';
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/jobs - Create a new job vacancy
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyId,
      companyName,
      companyLogo,
      companyIndustry,
      title,
      department,
      location,
      type,
      experienceLevel,
      salaryRange,
      description,
      requirements,
      responsibilities,
      keySkills,
      minEducation,
      deadline
    } = body;

    if (!companyId || !title || !department || !location || !description) {
      return NextResponse.json(
        { success: false, error: 'Semua field wajib diisi (Perusahaan, Judul, Departemen, Lokasi, Deskripsi)' },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return NextResponse.json({ success: false, error: 'Perusahaan tidak ditemukan' }, { status: 404 });
    }

    const newJob = await prisma.job.create({
      data: {
        companyId,
        companyName: company.name || companyName,
        companyLogo: company.logo || companyLogo,
        companyIndustry: company.industry || companyIndustry,
        title,
        department,
        location,
        type: type || 'Full-time',
        experienceLevel: experienceLevel || 'Mid-Level (3-5 thn)',
        salaryRange: salaryRange || null,
        description,
        requirements: requirements || [],
        responsibilities: responsibilities || [],
        keySkills: keySkills || [],
        minEducation: minEducation || 'S1 / Sederajat',
        status: 'active',
        deadline: deadline ? new Date(deadline) : null,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Lowongan kerja berhasil dipublikasikan!',
      job: {
        ...newJob,
        createdAt: newJob.createdAt.toISOString(),
        deadline: newJob.deadline ? newJob.deadline.toISOString() : undefined,
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat lowongan kerja';
    console.error('Error creating job:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
