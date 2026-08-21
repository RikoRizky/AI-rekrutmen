import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
  SEED_COMPANIES,
  SEED_USERS,
  SEED_JOBS,
  SEED_APPLICATIONS,
  SEED_TRANSACTIONS,
  DEFAULT_SETTINGS
} from '../src/lib/seed-data';

const connectionUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/smart_recruit';
const adapter = new PrismaMariaDb(connectionUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding into smart_recruit MySQL...');

  // 1. Companies
  console.log('Inserting companies...');
  for (const company of SEED_COMPANIES) {
    await prisma.company.upsert({
      where: { id: company.id },
      update: {
        name: company.name,
        slug: company.slug,
        logo: company.logo || null,
        description: company.description,
        industry: company.industry,
        website: company.website || null,
        address: company.address,
        isVerified: company.isVerified,
        activeSubscription: company.activeSubscription || 'Starter',
        subscriptionExpiresAt: company.subscriptionExpiresAt ? new Date(company.subscriptionExpiresAt) : null,
        jobQuota: company.jobQuota || 10,
      },
      create: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        logo: company.logo || null,
        description: company.description,
        industry: company.industry,
        website: company.website || null,
        address: company.address,
        isVerified: company.isVerified,
        activeSubscription: company.activeSubscription || 'Starter',
        subscriptionExpiresAt: company.subscriptionExpiresAt ? new Date(company.subscriptionExpiresAt) : null,
        jobQuota: company.jobQuota || 10,
        createdAt: new Date(company.createdAt),
      }
    });
  }

  // 2. Users
  console.log('Inserting users...');
  for (const user of SEED_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        phone: user.phone || null,
        headline: user.headline || null,
        image: user.avatar || null,
        companyId: user.companyId || null,
        biodata: user.biodata ? (JSON.parse(JSON.stringify(user.biodata)) as Prisma.InputJsonValue) : Prisma.JsonNull,
        profileCompleted: user.profileCompleted || false,
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password || 'password123',
        role: user.role,
        phone: user.phone || null,
        headline: user.headline || null,
        image: user.avatar || null,
        companyId: user.companyId || null,
        biodata: user.biodata ? (JSON.parse(JSON.stringify(user.biodata)) as Prisma.InputJsonValue) : Prisma.JsonNull,
        profileCompleted: user.profileCompleted || false,
        createdAt: new Date(user.createdAt),
      }
    });
  }

  // 3. Jobs
  console.log('Inserting jobs...');
  for (const job of SEED_JOBS) {
    await prisma.job.upsert({
      where: { id: job.id },
      update: {
        companyId: job.companyId,
        companyName: job.companyName,
        companyLogo: job.companyLogo || null,
        companyIndustry: job.companyIndustry || null,
        title: job.title,
        department: job.department,
        location: job.location,
        type: job.type,
        experienceLevel: job.experienceLevel,
        salaryRange: job.salaryRange || null,
        description: job.description,
        requirements: job.requirements as Prisma.InputJsonValue,
        responsibilities: job.responsibilities as Prisma.InputJsonValue,
        keySkills: job.keySkills as Prisma.InputJsonValue,
        minEducation: job.minEducation || null,
        status: job.status,
        deadline: job.deadline ? new Date(job.deadline) : null,
      },
      create: {
        id: job.id,
        companyId: job.companyId,
        companyName: job.companyName,
        companyLogo: job.companyLogo || null,
        companyIndustry: job.companyIndustry || null,
        title: job.title,
        department: job.department,
        location: job.location,
        type: job.type,
        experienceLevel: job.experienceLevel,
        salaryRange: job.salaryRange || null,
        description: job.description,
        requirements: job.requirements as Prisma.InputJsonValue,
        responsibilities: job.responsibilities as Prisma.InputJsonValue,
        keySkills: job.keySkills as Prisma.InputJsonValue,
        minEducation: job.minEducation || null,
        status: job.status,
        deadline: job.deadline ? new Date(job.deadline) : null,
        createdAt: new Date(job.createdAt),
      }
    });
  }

  // 4. Applications & AI Evaluations & Documents
  console.log('Inserting applications...');
  for (const app of SEED_APPLICATIONS) {
    await prisma.application.upsert({
      where: { id: app.id },
      update: {
        jobId: app.jobId,
        jobTitle: app.jobTitle,
        jobDepartment: app.jobDepartment,
        companyId: app.companyId,
        companyName: app.companyName,
        userId: app.userId,
        applicantName: app.applicantName,
        applicantEmail: app.applicantEmail,
        applicantPhone: app.applicantPhone,
        applicantHeadline: app.applicantHeadline,
        applicantBiodata: app.applicantBiodata ? (JSON.parse(JSON.stringify(app.applicantBiodata)) as Prisma.InputJsonValue) : Prisma.JsonNull,
        status: app.status,
        hrNotes: app.hrNotes || null,
      },
      create: {
        id: app.id,
        jobId: app.jobId,
        jobTitle: app.jobTitle,
        jobDepartment: app.jobDepartment,
        companyId: app.companyId,
        companyName: app.companyName,
        userId: app.userId,
        applicantName: app.applicantName,
        applicantEmail: app.applicantEmail,
        applicantPhone: app.applicantPhone,
        applicantHeadline: app.applicantHeadline,
        applicantBiodata: app.applicantBiodata ? (JSON.parse(JSON.stringify(app.applicantBiodata)) as Prisma.InputJsonValue) : Prisma.JsonNull,
        status: app.status,
        appliedDate: new Date(app.appliedDate),
        hrNotes: app.hrNotes || null,
      }
    });

    // Delete existing documents & evaluation for clean upsert
    await prisma.document.deleteMany({ where: { applicationId: app.id } });
    await prisma.aiEvaluation.deleteMany({ where: { applicationId: app.id } });

    // Documents
    if (app.documents && app.documents.length > 0) {
      for (const doc of app.documents) {
        await prisma.document.create({
          data: {
            id: doc.id,
            applicationId: app.id,
            name: doc.name,
            type: doc.type,
            size: doc.size || null,
            fileUrl: doc.fileDataUrl || null,
            extractedText: doc.extractedText || null,
            uploadedAt: new Date(doc.uploadedAt),
          }
        });
      }
    }

    // AI Evaluation
    if (app.aiEvaluation) {
      const ai = app.aiEvaluation;
      await prisma.aiEvaluation.create({
        data: {
          id: `ai-${app.id}`,
          applicationId: app.id,
          overallScore: ai.overallScore,
          technicalScore: ai.technicalScore,
          experienceScore: ai.experienceScore,
          educationScore: ai.educationScore,
          motivationScore: ai.motivationScore,
          cultureFitScore: ai.cultureFitScore || null,
          fitLevel: ai.fitLevel,
          recommendation: ai.recommendation,
          executiveSummary: ai.executiveSummary,
          recommendationReason: ai.recommendationReason,
          strengths: ai.strengths as Prisma.InputJsonValue,
          gaps: ai.gaps as Prisma.InputJsonValue,
          matchedSkills: ai.matchedSkills as Prisma.InputJsonValue,
          missingSkills: ai.missingSkills as Prisma.InputJsonValue,
          additionalSkills: (ai.additionalSkills || []) as Prisma.InputJsonValue,
          suggestedQuestions: (ai.suggestedInterviewQuestions || []) as Prisma.InputJsonValue,
          detailedQuestions: ai.detailedQuestions ? (JSON.parse(JSON.stringify(ai.detailedQuestions)) as Prisma.InputJsonValue) : Prisma.JsonNull,
          riskFactors: (ai.riskFactors || []) as Prisma.InputJsonValue,
          isRealAi: ai.isRealAi ?? true,
          modelUsed: ai.modelUsed || 'gemini-2.5-flash',
          latencyMs: ai.latencyMs || null,
          analyzedAt: new Date(ai.analyzedAt),
        }
      });
    }
  }

  // 5. Transactions
  console.log('Inserting transactions...');
  for (const trx of SEED_TRANSACTIONS) {
    await prisma.transaction.upsert({
      where: { orderId: trx.orderId },
      update: {
        companyEmail: trx.companyEmail,
        companyName: trx.companyName,
        packageName: trx.packageName,
        amount: trx.amount,
        paymentType: trx.paymentType,
        status: trx.status,
        paidAt: trx.paidAt ? new Date(trx.paidAt) : null,
      },
      create: {
        id: trx.id,
        orderId: trx.orderId,
        companyEmail: trx.companyEmail,
        companyName: trx.companyName,
        packageName: trx.packageName,
        amount: trx.amount,
        paymentType: trx.paymentType,
        status: trx.status,
        paidAt: trx.paidAt ? new Date(trx.paidAt) : null,
        createdAt: new Date(trx.createdAt),
      }
    });
  }

  // 6. Settings
  console.log('Inserting default settings...');
  await prisma.appSetting.upsert({
    where: { id: 'default' },
    update: {
      geminiApiKey: DEFAULT_SETTINGS.geminiApiKey || null,
      aiModel: DEFAULT_SETTINGS.aiModel || 'gemini-2.5-flash',
      minPassingScore: DEFAULT_SETTINGS.minPassingScore || 70,
      autoScreening: DEFAULT_SETTINGS.autoScreening ?? true,
      midtransServerKey: DEFAULT_SETTINGS.midtransServerKey || null,
      midtransClientKey: DEFAULT_SETTINGS.midtransClientKey || null,
      resendApiKey: DEFAULT_SETTINGS.resendApiKey || null,
    },
    create: {
      id: 'default',
      geminiApiKey: DEFAULT_SETTINGS.geminiApiKey || null,
      aiModel: DEFAULT_SETTINGS.aiModel || 'gemini-2.5-flash',
      minPassingScore: DEFAULT_SETTINGS.minPassingScore || 70,
      autoScreening: DEFAULT_SETTINGS.autoScreening ?? true,
      midtransServerKey: DEFAULT_SETTINGS.midtransServerKey || null,
      midtransClientKey: DEFAULT_SETTINGS.midtransClientKey || null,
      resendApiKey: DEFAULT_SETTINGS.resendApiKey || null,
    }
  });

  console.log('✅ Seed completed successfully into smart_recruit MySQL database!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
