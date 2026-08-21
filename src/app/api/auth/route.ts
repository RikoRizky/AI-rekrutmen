import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getDefaultUserAvatar } from '@/lib/storage';

// GET /api/auth?email=... OR GET all users
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const id = searchParams.get('id');

    if (email) {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { company: true }
      });
      if (!user) {
        return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          headline: user.headline,
          avatar: user.image,
          companyId: user.companyId,
          companyName: user.company?.name,
          biodata: user.biodata as any,
          profileCompleted: user.profileCompleted,
          createdAt: user.createdAt.toISOString(),
        }
      });
    }

    if (id) {
      const user = await prisma.user.findUnique({
        where: { id },
        include: { company: true }
      });
      if (!user) {
        return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          headline: user.headline,
          avatar: user.image,
          companyId: user.companyId,
          companyName: user.company?.name,
          biodata: user.biodata as any,
          profileCompleted: user.profileCompleted,
          createdAt: user.createdAt.toISOString(),
        }
      });
    }

    // List all users (for Super Admin)
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { company: true }
    });

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      headline: u.headline,
      avatar: u.image,
      companyId: u.companyId,
      companyName: u.company?.name,
      biodata: u.biodata as any,
      profileCompleted: u.profileCompleted,
      createdAt: u.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, users: formatted });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Auth error';
    console.error('Error in auth route:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/auth - Login, Register, or Google OAuth Authentication
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, name, email, password, role, phone, headline, companyId, companyName } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email wajib diisi' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // 1. ACTION: GOOGLE AUTHENTICATION
    if (action === 'google_auth') {
      let user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: { company: true }
      });

      if (user) {
        return NextResponse.json({
          success: true,
          message: 'Berhasil masuk dengan Google',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            headline: user.headline,
            avatar: user.image,
            companyId: user.companyId,
            companyName: user.company?.name || companyName,
            biodata: user.biodata as any,
            profileCompleted: user.profileCompleted,
            createdAt: user.createdAt.toISOString(),
          }
        });
      }

      // Register new user via Google
      const avatar = getDefaultUserAvatar(name || cleanEmail);
      user = await prisma.user.create({
        data: {
          id: `user-${Date.now()}`,
          name: name || cleanEmail.split('@')[0],
          email: cleanEmail,
          password: 'google-oauth-authenticated',
          role: role || 'applicant',
          phone: phone || null,
          headline: headline || 'Pencari Kerja / Talenta',
          image: avatar,
          companyId: companyId || null,
        },
        include: { company: true }
      });

      return NextResponse.json({
        success: true,
        message: 'Akun Google berhasil didaftarkan',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          headline: user.headline,
          avatar: user.image || getDefaultUserAvatar(user.name),
          companyId: user.companyId,
          companyName: user.company?.name || companyName,
          biodata: user.biodata as any,
          profileCompleted: user.profileCompleted,
          createdAt: user.createdAt.toISOString(),
        }
      });
    }

    // 2. ACTION: REGISTER (Pendaftaran Akun Baru)
    if (action === 'register') {
      const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail }
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Email sudah terdaftar. Silakan masuk (login) ke akun Anda.' },
          { status: 400 }
        );
      }

      if (!cleanPassword || cleanPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Kata sandi minimal 6 karakter.' },
          { status: 400 }
        );
      }

      const avatar = getDefaultUserAvatar(name || cleanEmail);
      const newUser = await prisma.user.create({
        data: {
          id: `user-${Date.now()}`,
          name: name || cleanEmail.split('@')[0],
          email: cleanEmail,
          password: cleanPassword,
          role: role || 'applicant',
          phone: phone || null,
          headline: headline || (role === 'applicant' ? 'Pencari Kerja / Talenta' : role === 'super_admin' ? 'Super Administrator' : 'Recruiter / Talent Acquisition'),
          image: avatar,
          companyId: companyId || null,
        },
        include: { company: true }
      });

      return NextResponse.json({
        success: true,
        message: 'Pendaftaran akun berhasil!',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          headline: newUser.headline,
          avatar: newUser.image,
          companyId: newUser.companyId,
          companyName: newUser.company?.name || companyName,
          biodata: newUser.biodata as any,
          profileCompleted: newUser.profileCompleted,
          createdAt: newUser.createdAt.toISOString(),
        }
      });
    }

    // 3. ACTION: LOGIN (or default authentication)
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { company: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Alamat email belum terdaftar di sistem. Silakan buat akun baru terlebih dahulu.' },
        { status: 401 }
      );
    }

    // Verify Password
    // Check if account is Google OAuth only (no manual password set)
    if (user.password === 'google-oauth-authenticated' && cleanPassword !== 'google-oauth-authenticated') {
      return NextResponse.json(
        {
          success: false,
          error: 'Akun ini terdaftar menggunakan Akun Google. Silakan klik tombol "Lanjutkan dengan Akun Google" di atas untuk masuk.'
        },
        { status: 401 }
      );
    }

    // Check if password matches
    const expectedPassword = user.password || 'password123';
    if (cleanPassword !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: 'Kata sandi (password) yang Anda masukkan salah. Silakan periksa kembali.' },
        { status: 401 }
      );
    }

    // Password valid! Return user session
    return NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        headline: user.headline,
        avatar: user.image,
        companyId: user.companyId,
        companyName: user.company?.name || companyName,
        biodata: user.biodata as any,
        profileCompleted: user.profileCompleted,
        createdAt: user.createdAt.toISOString(),
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memproses autentikasi';
    console.error('Error in auth post:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
