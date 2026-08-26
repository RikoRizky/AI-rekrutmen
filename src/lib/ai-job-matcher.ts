import { Job, DocumentAttachment, UserBiodata, User } from './types';
import { evaluateApplicantWithAi } from './ai-evaluator';

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
 * Calculates AI Compatibility Match Score across multiple jobs for uploaded candidate documents.
 */
export async function calculateJobRecommendations({
  jobs,
  documents,
  biodata,
  user,
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

  const results: JobMatchRecommendation[] = [];

  for (const job of jobs) {
    const jobEduRank = getEduRank(job.minEducation);
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

    // Skill Score (0-60 points)
    const skillRatio = keySkills.length > 0 ? matchedSkills.length / keySkills.length : 0.8;
    let skillScore = skillRatio * 60;

    // Requirement keyword match (0-20 points)
    let reqMatches = 0;
    const requirements = job.requirements || [];
    for (const req of requirements) {
      const words = req.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      const hasWord = words.some((w) => combinedCandidateText.includes(w));
      if (hasWord) reqMatches++;
    }
    const reqRatio = requirements.length > 0 ? reqMatches / requirements.length : 0.7;
    const reqScore = reqRatio * 20;

    // Education Match (0-15 points)
    let eduScore = 15;
    if (userEduRank < jobEduRank) {
      eduScore = Math.max(5, 15 - (jobEduRank - userEduRank) * 5);
    }

    // Additional relevance bonus (Certificates/Cover letter) (0-5 points)
    let bonusScore = 0;
    if (certDocs.length > 0) bonusScore += 3;
    if (coverLetterDoc) bonusScore += 2;

    let totalScore = Math.round(skillScore + reqScore + eduScore + bonusScore);
    totalScore = Math.min(99, Math.max(35, totalScore));

    // Determine Level
    let matchLevel: 'Sangat Cocok' | 'Cocok' | 'Potensial' | 'Cukup' = 'Cukup';
    if (totalScore >= 85) matchLevel = 'Sangat Cocok';
    else if (totalScore >= 70) matchLevel = 'Cocok';
    else if (totalScore >= 55) matchLevel = 'Potensial';

    // Generate concise recommendation reason
    let recommendationReason = '';
    if (matchedSkills.length > 0) {
      recommendationReason = `Keahlian Anda dalam ${matchedSkills.slice(0, 3).join(', ')} sangat sesuai dengan kebutuhan posisi ${job.title} di ${job.companyName}.`;
    } else if (reqMatches > 0) {
      recommendationReason = `Latar belakang pengalaman dan kualifikasi berkas Anda selaras dengan kriteria posisi ini di ${job.companyName}.`;
    } else {
      recommendationReason = `Posisi ${job.title} di ${job.companyName} membuka kesempatan yang potensial bagi profil pendidikan Anda.`;
    }

    const isApplied = existingAppliedJobIds.includes(job.id);

    results.push({
      job,
      matchScore: totalScore,
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
