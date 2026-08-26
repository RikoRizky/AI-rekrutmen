import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/password';

// GET /api/companies - List all companies
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { jobs: true, users: true }
        }
      }
    });

    const formatted = companies.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      logo: c.logo || undefined,
      description: c.description || '',
      industry: c.industry || 'Teknologi Informasi',
      website: c.website || undefined,
      address: c.address || '',
      isVerified: c.isVerified,
      activeSubscription: c.activeSubscription || 'Starter',
      subscriptionExpiresAt: c.subscriptionExpiresAt ? c.subscriptionExpiresAt.toISOString() : undefined,
      jobQuota: c.jobQuota,
      createdAt: c.createdAt.toISOString(),
      jobCount: c._count.jobs,
    }));

    return NextResponse.json({ success: true, companies: formatted });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch companies';
    console.error('Error fetching companies:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/companies - Register a new company and admin
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, logo, description, industry, website, address, adminName, adminEmail, adminPhone, adminPassword } = body;

    if (!name || !adminEmail || !adminName) {
      return NextResponse.json(
        { success: false, error: 'Nama perusahaan, nama admin, dan email wajib diisi.' },
        { status: 400 }
      );
    }

    const companySlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')) + `-${Date.now().toString(36)}`;
    const companyId = `comp-${Date.now()}`;

    const newCompany = await prisma.company.create({
      data: {
        id: companyId,
        name,
        slug: companySlug,
        logo: logo || null,
        description: description || '',
        industry: industry || 'Teknologi Informasi',
        website: website || '',
        address: address || '',
        isVerified: true,
        activeSubscription: 'Starter',
        jobQuota: 10,
      }
    });

    // Create / connect Admin User
    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (adminUser) {
      adminUser = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          role: 'company_admin',
          companyId: newCompany.id,
          phone: adminPhone || adminUser.phone,
          headline: `Talent Acquisition Lead at ${newCompany.name}`,
        }
      });
    } else {
      const hashedPassword = await hashPassword(adminPassword || 'password123');
      adminUser = await prisma.user.create({
        data: {
          id: `user-${Date.now()}`,
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          phone: adminPhone || null,
          role: 'company_admin',
          companyId: newCompany.id,
          headline: `Talent Acquisition Lead at ${newCompany.name}`,
          image: logo || null,
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Perusahaan dan akun admin berhasil didaftarkan!',
      company: {
        ...newCompany,
        createdAt: newCompany.createdAt.toISOString(),
      },
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        phone: adminUser.phone,
        role: adminUser.role,
        headline: adminUser.headline,
        companyId: newCompany.id,
        companyName: newCompany.name,
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mendaftarkan perusahaan';
    console.error('Error registering company:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/companies - Update company profile
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, logo, description, industry, website, address, activeSubscription, jobQuota } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Company ID is required' }, { status: 400 });
    }

    const updated = await prisma.company.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(logo !== undefined && { logo }),
        ...(description !== undefined && { description }),
        ...(industry && { industry }),
        ...(website !== undefined && { website }),
        ...(address !== undefined && { address }),
        ...(activeSubscription && { activeSubscription }),
        ...(jobQuota !== undefined && { jobQuota }),
      }
    });

    // Also update any synced jobs
    if (name || logo || address) {
      await prisma.job.updateMany({
        where: { companyId: id },
        data: {
          ...(name && { companyName: name }),
          ...(logo && { companyLogo: logo }),
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Profil perusahaan berhasil diperbarui!',
      company: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui data perusahaan';
    console.error('Error updating company:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
