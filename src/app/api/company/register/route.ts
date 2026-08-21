import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, companyName, industry, address, website, description, adminName, adminEmail, adminPhone } = body;

    if (!token || !companyName || !adminEmail || !adminName) {
      return NextResponse.json(
        { error: 'Field token, nama perusahaan, nama admin, dan email wajib diisi.' },
        { status: 400 }
      );
    }

    // Response structure
    const newCompanyId = `comp-${Date.now()}`;
    const newUserId = `user-${Date.now()}`;

    return NextResponse.json({
      success: true,
      message: 'Perusahaan berhasil didaftarkan!',
      company: {
        id: newCompanyId,
        name: companyName,
        industry: industry || 'Teknologi Informasi',
        address: address || '',
        website: website || '',
        description: description || ''
      },
      user: {
        id: newUserId,
        name: adminName,
        email: adminEmail,
        phone: adminPhone || '',
        role: 'company_admin',
        companyId: newCompanyId,
        companyName: companyName
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mendaftarkan perusahaan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
