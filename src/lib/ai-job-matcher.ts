import { Job, DocumentAttachment, UserBiodata, User, Application, FitLevel } from './types';

export interface JobMatchRecommendation {
  job: Job;
  matchScore: number; // 0 - 100
  matchLevel: 'Sangat Cocok' | 'Cocok' | 'Potensial' | 'Cukup';
  matchedSkills: string[];
  missingSkills: string[];
  recommendationReason: string;
  isApplied?: boolean;
}

export interface CalculateJobMatchesParams {
  jobs: Job[];
  documents: DocumentAttachment[];
  biodata?: UserBiodata;
  user: User;
  existingApplications?: Application[];
  existingAppliedJobIds?: string[];
}

/**
 * Normalizes education string to rank (1 = SMA/SMK, 2 = D3, 3 = S1, 4 = S2, 5 = S3)
 */
function getEduRank(eduStr?: string | null): number {
  if (!eduStr) return 1;
  const s = eduStr.toLowerCase();
  if (s.includes('s3') || s.includes('doktor')) return 5;
  if (s.includes('s2') || s.includes('magister') || s.includes('master')) return 4;
  if (s.includes('s1') || s.includes('sarjana') || s.includes('d4') || s.includes('bachelor')) return 3;
  if (s.includes('d3') || s.includes('diploma')) return 2;
  return 1; // SMA/SMK
}

/**
 * Maps numeric AI score to human-readable recommendation level
 */
export function mapScoreToMatchLevel(score: number): 'Sangat Cocok' | 'Cocok' | 'Potensial' | 'Cukup' {
  if (score >= 85) return 'Sangat Cocok';
  if (score >= 70) return 'Cocok';
  if (score >= 50) return 'Potensial';
  return 'Cukup';
}

/**
 * Calculates AI Compatibility Match Score across multiple jobs for uploaded candidate documents.
 * Prioritizes actual stored AI screening evaluation if candidate has already applied to ensure 100% consistency.
 */
export async function calculateJobRecommendations({
  jobs,
  documents,
  biodata,
  user,
  existingApplications = [],
  existingAppliedJobIds = []
}: CalculateJobMatchesParams): Promise<JobMatchRecommendation[]> {
  const cvDoc = documents.find((d) => d.type === 'cv');
  const coverLetterDoc = documents.find((d) => d.type === 'cover_letter');
  const certDocs = documents.filter((d) => d.type === 'certificate');

  const combinedCandidateText = [
    cvDoc?.extractedText || '',
    coverLetterDoc?.extractedText || '',
    ...certDocs.map((c) => c.extractedText || c.name),
    biodata?.educationMajor || '',
    biodata?.institutionName || '',
    biodata?.socials?.additionalBio || '',
    user.headline || ''
  ].join(' ').toLowerCase();

  const userEduRank = getEduRank(biodata?.lastEducation || 'S1');

  // Extract candidate experience years from text
  const yearMatches = combinedCandidateText.match(/(\d+)[\s+]*(?:tahun|thn|years|yrs)/gi) || [];
  let maxYearsFound = 0;
  for (const ym of yearMatches) {
    const num = parseInt(ym, 10);
    if (!isNaN(num) && num > maxYearsFound && num <= 40) {
      maxYearsFound = num;
    }
  }

  const results: JobMatchRecommendation[] = [];

  for (const job of jobs) {
    const keySkills = job.keySkills || [];
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    // Check skills
    for (const skill of keySkills) {
      const cleanSkill = skill.trim().toLowerCase();
      if (cleanSkill.length > 0 && combinedCandidateText.includes(cleanSkill)) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }

    // Check if the user has an existing application with an actual AI evaluation
    const existingApp = existingApplications.find((a) => a.jobId === job.id);
    const isApplied = Boolean(existingApp) || existingAppliedJobIds.includes(job.id);

    if (existingApp && existingApp.aiEvaluation && typeof existingApp.aiEvaluation.overallScore === 'number' && existingApp.aiEvaluation.overallScore > 0) {
      const evalData = existingApp.aiEvaluation;
      const appScore = evalData.overallScore;
      const matchLevel = mapScoreToMatchLevel(appScore);

      let reason = evalData.recommendationReason || evalData.executiveSummary || '';
      if (!reason) {
        if (matchedSkills.length > 0) {
          reason = `Keahlian Anda dalam ${matchedSkills.slice(0, 3).join(', ')} sangat sesuai dengan kebutuhan posisi ${job.title} di ${job.companyName}.`;
        } else {
          reason = `Latar belakang pengalaman dan berkas lamaran Anda selaras dengan kriteria posisi ini di ${job.companyName}.`;
        }
      }

      results.push({
        job,
        matchScore: appScore,
        matchLevel,
        matchedSkills: evalData.matchedSkills && evalData.matchedSkills.length > 0 ? evalData.matchedSkills : matchedSkills,
        missingSkills: evalData.missingSkills && evalData.missingSkills.length > 0 ? evalData.missingSkills : missingSkills,
        recommendationReason: reason,
        isApplied: true
      });
      continue;
    }

    // For unapplied jobs, calculate score using standard 4-dimension model harmonious with ai-evaluator.ts
    // 1. Technical & Skills Match (0 - 100)
    let technicalScore = 40;
    if (keySkills.length > 0) {
      const ratio = matchedSkills.length / keySkills.length;
      technicalScore = Math.round(ratio * 70 + 30);
    } else {
      technicalScore = 75;
    }

    // 2. Experience Match (0 - 100)
    let experienceScore = 75;
    const expLevel = job.experienceLevel || '';
    if (expLevel.includes('Senior') || expLevel.includes('5+')) {
      if (maxYearsFound >= 5 || combinedCandidateText.includes('senior') || combinedCandidateText.includes('lead')) {
        experienceScore = 92;
      } else if (maxYearsFound >= 3 || combinedCandidateText.includes('mid-level')) {
        experienceScore = 68;
      } else {
        experienceScore = 45;
      }
    } else if (expLevel.includes('Mid-Level') || expLevel.includes('3-5') || expLevel.includes('2-4')) {
      if (maxYearsFound >= 3 || combinedCandidateText.includes('mid') || combinedCandidateText.includes('experienced')) {
        experienceScore = 90;
      } else if (maxYearsFound >= 1) {
        experienceScore = 75;
      } else {
        experienceScore = 50;
      }
    } else {
      experienceScore = maxYearsFound >= 1 ? 90 : 80;
    }

    // 3. Education Match (0 - 100)
    const jobEduRank = getEduRank(job.minEducation);
    let educationScore = 60;
    const hasBachelorOrHigher = userEduRank >= 3 || combinedCandidateText.includes('s1') || combinedCandidateText.includes('sarjana') || combinedCandidateText.includes('s2') || combinedCandidateText.includes('universitas');
    const hasCertificate = certDocs.length > 0 || combinedCandidateText.includes('sertifikat') || combinedCandidateText.includes('certified');

    if (userEduRank >= jobEduRank) {
      if (hasBachelorOrHigher && hasCertificate) {
        educationScore = 95;
      } else if (hasBachelorOrHigher) {
        educationScore = 85;
      } else if (hasCertificate) {
        educationScore = 75;
      } else {
        educationScore = 70;
      }
    } else {
      educationScore = Math.max(40, 60 - (jobEduRank - userEduRank) * 15);
    }

    // 4. Motivation & Documents Match (0 - 100)
    let motivationScore = 65;
    if (coverLetterDoc && coverLetterDoc.extractedText && coverLetterDoc.extractedText.length > 200) {
      motivationScore = 92;
    } else if (coverLetterDoc) {
      motivationScore = 78;
    }

    // Aggregate Score
    const totalScore = Math.round(
      technicalScore * 0.35 +
      experienceScore * 0.30 +
      educationScore * 0.20 +
      motivationScore * 0.15
    );

    const safeScore = Math.min(99, Math.max(35, totalScore));
    const matchLevel = mapScoreToMatchLevel(safeScore);

    // Recommendation reason
    let recommendationReason = '';
    if (matchedSkills.length > 0) {
      recommendationReason = `Keahlian Anda dalam ${matchedSkills.slice(0, 3).join(', ')} sangat sesuai dengan kebutuhan posisi ${job.title} di ${job.companyName}.`;
    } else if (experienceScore >= 80) {
      recommendationReason = `Latar belakang pengalaman dan kualifikasi berkas Anda selaras dengan kriteria posisi ini di ${job.companyName}.`;
    } else {
      recommendationReason = `Posisi ${job.title} di ${job.companyName} membuka kesempatan yang potensial bagi profil pendidikan Anda.`;
    }

    results.push({
      job,
      matchScore: safeScore,
      matchLevel,
      matchedSkills,
      missingSkills,
      recommendationReason,
      isApplied
    });
  }

  // Sort descending by highest matchScore
  results.sort((a, b) => b.matchScore - a.matchScore);

  return results;
}
