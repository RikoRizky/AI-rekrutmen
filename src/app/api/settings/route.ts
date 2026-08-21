import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_SETTINGS } from '@/lib/seed-data';

// GET /api/settings
export async function GET() {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { id: 'default' }
    });

    if (!setting) {
      return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
    }

    return NextResponse.json({
      success: true,
      settings: {
        geminiApiKey: setting.geminiApiKey || DEFAULT_SETTINGS.geminiApiKey,
        aiModel: setting.aiModel,
        minPassingScore: setting.minPassingScore,
        enableInstantEvaluation: setting.enableInstantEvaluation,
        sendEmailNotifications: setting.sendEmailNotifications,
        autoScreening: setting.autoScreening,
        midtransServerKey: setting.midtransServerKey || DEFAULT_SETTINGS.midtransServerKey,
        midtransClientKey: setting.midtransClientKey || DEFAULT_SETTINGS.midtransClientKey,
        resendApiKey: setting.resendApiKey || DEFAULT_SETTINGS.resendApiKey,
      }
    });
  } catch (error: unknown) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
  }
}

// POST /api/settings
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const updated = await prisma.appSetting.upsert({
      where: { id: 'default' },
      update: {
        geminiApiKey: body.geminiApiKey || undefined,
        aiModel: body.aiModel || undefined,
        minPassingScore: body.minPassingScore !== undefined ? Number(body.minPassingScore) : undefined,
        enableInstantEvaluation: body.enableInstantEvaluation !== undefined ? Boolean(body.enableInstantEvaluation) : undefined,
        sendEmailNotifications: body.sendEmailNotifications !== undefined ? Boolean(body.sendEmailNotifications) : undefined,
        autoScreening: body.autoScreening !== undefined ? Boolean(body.autoScreening) : undefined,
        midtransServerKey: body.midtransServerKey || undefined,
        midtransClientKey: body.midtransClientKey || undefined,
        resendApiKey: body.resendApiKey || undefined,
      },
      create: {
        id: 'default',
        geminiApiKey: body.geminiApiKey || null,
        aiModel: body.aiModel || 'gemini-2.5-flash',
        minPassingScore: body.minPassingScore || 70,
        enableInstantEvaluation: body.enableInstantEvaluation ?? true,
        sendEmailNotifications: body.sendEmailNotifications ?? true,
        autoScreening: body.autoScreening ?? true,
        midtransServerKey: body.midtransServerKey || null,
        midtransClientKey: body.midtransClientKey || null,
        resendApiKey: body.resendApiKey || null,
      }
    });

    return NextResponse.json({ success: true, message: 'Pengaturan berhasil disimpan ke database MySQL!', settings: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan pengaturan';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
