import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/applications - List applications with optional filter by userId, jobId, companyId
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const jobId = searchParams.get('jobId');
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');

    const where: any = {};
    if (userId) where.userId = userId;
    if (jobId) where.jobId = jobId;
    if (companyId) {
      where.OR = [
        { companyId },
        { job: { companyId } }
      ];
    }
    if (status && status !== 'all') where.status = status;

    const applications = await prisma.application.findMany({
      where,
      orderBy: { appliedDate: 'desc' },
      include: {
        documents: true,
        aiEvaluation: true,
        job: {
          select: {
            title: true,
            department: true,
            companyId: true,
            companyName: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            headline: true,
            biodata: true,
          }
        }
      }
    });

    const formatted = applications.map((app) => ({
      id: app.id,
      jobId: app.jobId,
      jobTitle: app.jobTitle || app.job?.title || 'Lowongan',
      jobDepartment: app.jobDepartment || app.job?.department || '',
      companyId: app.companyId || app.job?.companyId || '',
      companyName: app.companyName || app.job?.companyName || '',
      userId: app.userId,
      applicantName: app.applicantName || app.user?.name || '',
      applicantEmail: app.applicantEmail || app.user?.email || '',
      applicantPhone: app.applicantPhone || app.user?.phone || '',
      applicantHeadline: app.applicantHeadline || app.user?.headline || '',
      applicantBiodata: (app.applicantBiodata as any) || (app.user?.biodata as any) || undefined,
      appliedDate: app.appliedDate.toISOString(),
      status: app.status,
      hrNotes: app.hrNotes || undefined,
      documents: app.documents.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        size: d.size || 0,
        extractedText: d.extractedText || '',
        fileDataUrl: d.fileUrl || undefined,
        uploadedAt: d.uploadedAt.toISOString(),
      })),
      aiEvaluation: app.aiEvaluation
        ? {
            overallScore: app.aiEvaluation.overallScore,
            technicalScore: app.aiEvaluation.technicalScore,
            experienceScore: app.aiEvaluation.experienceScore,
            educationScore: app.aiEvaluation.educationScore,
            motivationScore: app.aiEvaluation.motivationScore,
            cultureFitScore: app.aiEvaluation.cultureFitScore || undefined,
            fitLevel: app.aiEvaluation.fitLevel,
            recommendation: app.aiEvaluation.recommendation,
            executiveSummary: app.aiEvaluation.executiveSummary,
            recommendationReason: app.aiEvaluation.recommendationReason,
            strengths: (app.aiEvaluation.strengths as any) || [],
            gaps: (app.aiEvaluation.gaps as any) || [],
            matchedSkills: (app.aiEvaluation.matchedSkills as any) || [],
            missingSkills: (app.aiEvaluation.missingSkills as any) || [],
            additionalSkills: (app.aiEvaluation.additionalSkills as any) || [],
            suggestedInterviewQuestions: (app.aiEvaluation.suggestedQuestions as any) || [],
            detailedQuestions: (app.aiEvaluation.detailedQuestions as any) || [],
            riskFactors: (app.aiEvaluation.riskFactors as any) || [],
            isRealAi: app.aiEvaluation.isRealAi,
            modelUsed: app.aiEvaluation.modelUsed,
            latencyMs: app.aiEvaluation.latencyMs || undefined,
            analyzedAt: app.aiEvaluation.analyzedAt.toISOString(),
          }
        : null
    }));

    return NextResponse.json({ success: true, applications: formatted });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch applications';
    console.error('Error fetching applications:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/applications - Submit an application with documents & AI evaluation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      jobId,
      jobTitle,
      jobDepartment,
      companyId,
      companyName,
      userId,
      applicantName,
      applicantEmail,
      applicantPhone,
      applicantHeadline,
      applicantBiodata,
      documents,
      aiEvaluation,
      status
    } = body;

    if (!jobId || !applicantName || !applicantEmail) {
      return NextResponse.json(
        { success: false, error: 'Job ID, Nama pelamar, dan Email wajib diisi.' },
        { status: 400 }
      );
    }

    // Ensure User exists
    let effectiveUserId = userId;
    if (!effectiveUserId || effectiveUserId.startsWith('guest-') || effectiveUserId.startsWith('user-')) {
      const existingUser = await prisma.user.findUnique({
        where: { email: applicantEmail }
      });
      if (existingUser) {
        effectiveUserId = existingUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            name: applicantName,
            email: applicantEmail,
            phone: applicantPhone || null,
            headline: applicantHeadline || null,
            role: 'applicant',
            biodata: applicantBiodata ? JSON.parse(JSON.stringify(applicantBiodata)) : null,
            profileCompleted: !!applicantBiodata,
          }
        });
        effectiveUserId = newUser.id;
      }
    }

    // Create or Upsert Application
    const applicationId = body.id || `app-${Date.now()}`;
    
    // Remove any existing duplicate record for this user on this job to ensure 100% clean single record
    const existingOldApps = await prisma.application.findMany({
      where: {
        jobId,
        OR: [
          { userId: effectiveUserId },
          { applicantEmail },
          { id: applicationId }
        ]
      },
      select: { id: true }
    });

    if (existingOldApps.length > 0) {
      const oldIds = existingOldApps.map((o) => o.id);
      await prisma.aiEvaluation.deleteMany({ where: { applicationId: { in: oldIds } } }).catch(() => {});
      await prisma.document.deleteMany({ where: { applicationId: { in: oldIds } } }).catch(() => {});
      await prisma.application.deleteMany({ where: { id: { in: oldIds } } }).catch(() => {});
    }

    const targetJob = await prisma.job.findUnique({ where: { id: jobId } });
    const finalCompanyId = targetJob?.companyId || companyId || undefined;
    const finalCompanyName = targetJob?.companyName || companyName || undefined;
    const finalJobTitle = targetJob?.title || jobTitle || undefined;
    const finalJobDept = targetJob?.department || jobDepartment || undefined;

    const newApplication = await prisma.application.create({
      data: {
        id: applicationId,
        jobId,
        jobTitle: finalJobTitle,
        jobDepartment: finalJobDept,
        companyId: finalCompanyId,
        companyName: finalCompanyName,
        userId: effectiveUserId,
        applicantName,
        applicantEmail,
        applicantPhone: applicantPhone || null,
        applicantHeadline: applicantHeadline || null,
        applicantBiodata: applicantBiodata ? JSON.parse(JSON.stringify(applicantBiodata)) : null,
        status: status || 'applied',
      }
    });

    // Create Documents
    if (documents && Array.isArray(documents) && documents.length > 0) {
      for (const doc of documents) {
        await prisma.document.create({
          data: {
            id: doc.id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            applicationId: newApplication.id,
            name: doc.name,
            type: doc.type,
            size: doc.size || null,
            fileUrl: doc.fileDataUrl || doc.fileUrl || null,
            extractedText: doc.extractedText || null,
          }
        });
      }
    }

    // Create AI Evaluation
    if (aiEvaluation) {
      try {
        await prisma.aiEvaluation.create({
          data: {
            id: `ai-${newApplication.id}`,
            applicationId: newApplication.id,
            overallScore: Number(aiEvaluation.overallScore) || 0,
            technicalScore: Number(aiEvaluation.technicalScore) || 0,
            experienceScore: Number(aiEvaluation.experienceScore) || 0,
            educationScore: Number(aiEvaluation.educationScore) || 0,
            motivationScore: Number(aiEvaluation.motivationScore) || 0,
            cultureFitScore: aiEvaluation.cultureFitScore !== undefined && aiEvaluation.cultureFitScore !== null
              ? Number(aiEvaluation.cultureFitScore)
              : null,
            fitLevel: aiEvaluation.fitLevel || 'Moderate Match',
            recommendation: aiEvaluation.recommendation || 'CONSIDER',
            executiveSummary: aiEvaluation.executiveSummary || '',
            recommendationReason: aiEvaluation.recommendationReason || '',
            strengths: Array.isArray(aiEvaluation.strengths) ? aiEvaluation.strengths : [],
            gaps: Array.isArray(aiEvaluation.gaps) ? aiEvaluation.gaps : [],
            matchedSkills: Array.isArray(aiEvaluation.matchedSkills) ? aiEvaluation.matchedSkills : [],
            missingSkills: Array.isArray(aiEvaluation.missingSkills) ? aiEvaluation.missingSkills : [],
            additionalSkills: Array.isArray(aiEvaluation.additionalSkills) ? aiEvaluation.additionalSkills : [],
            suggestedQuestions: Array.isArray(aiEvaluation.suggestedInterviewQuestions) ? aiEvaluation.suggestedInterviewQuestions : [],
            detailedQuestions: aiEvaluation.detailedQuestions ? JSON.parse(JSON.stringify(aiEvaluation.detailedQuestions)) : null,
            riskFactors: Array.isArray(aiEvaluation.riskFactors) ? aiEvaluation.riskFactors : [],
            isRealAi: aiEvaluation.isRealAi ?? true,
            modelUsed: aiEvaluation.modelUsed || 'gemini-2.5-flash',
            latencyMs: aiEvaluation.latencyMs ? Math.round(Number(aiEvaluation.latencyMs)) : null,
          }
        });
      } catch (aiErr) {
        console.error('Error saving aiEvaluation to database:', aiErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Lamaran berhasil dikirim dan disimpan ke database MySQL!',
      applicationId: newApplication.id
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengirimkan lamaran';
    console.error('Error submitting application:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
