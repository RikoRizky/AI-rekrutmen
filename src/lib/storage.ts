'use client';

import { Job, Application, User, AppSettings, UserRole, AiEvaluationResult } from './types';
import { SEED_JOBS, SEED_APPLICATIONS, SEED_USERS, DEFAULT_SETTINGS } from './seed-data';

const JOBS_KEY = 'smartrecruit_jobs';
const APPLICATIONS_KEY = 'smartrecruit_applications';
const USERS_KEY = 'smartrecruit_users';
const CURRENT_USER_KEY = 'smartrecruit_current_user';
const SETTINGS_KEY = 'smartrecruit_settings';

// Custom event to trigger reactive re-renders across components
export const REFRESH_EVENT = 'smartrecruit_data_updated';

export function triggerDataRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REFRESH_EVENT));
  }
}

// Initializer
export function initializeStorage() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(JOBS_KEY)) {
    localStorage.setItem(JOBS_KEY, JSON.stringify(SEED_JOBS));
  }
  if (!localStorage.getItem(APPLICATIONS_KEY)) {
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(SEED_APPLICATIONS));
  }
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
  }
  if (!localStorage.getItem(CURRENT_USER_KEY)) {
    // Default to Pelamar / Applicant so user sees application flow first, with easy switcher
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(SEED_USERS[1])); // Budi Santoso
  }
  if (!localStorage.getItem(SETTINGS_KEY)) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  }
}

// --- USER & AUTH ---

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  if (!stored) {
    initializeStorage();
    return SEED_USERS[1];
  }
  try {
    return JSON.parse(stored);
  } catch {
    return SEED_USERS[1];
  }
}

export function setCurrentUser(user: User) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  triggerDataRefresh();
}

export function getAllUsers(): User[] {
  if (typeof window === 'undefined') return SEED_USERS;
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    initializeStorage();
    return SEED_USERS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return SEED_USERS;
  }
}

export function registerOrLoginUser(name: string, email: string, role: UserRole = 'applicant', phone: string = '', headline: string = ''): User {
  const users = getAllUsers();
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    setCurrentUser(existing);
    return existing;
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    phone,
    role,
    headline: headline || (role === 'applicant' ? 'Job Seeker / Candidate' : 'Recruitment Specialist'),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  setCurrentUser(newUser);
  return newUser;
}

export function switchDemoRole(role: UserRole) {
  if (role === 'hrd') {
    setCurrentUser(SEED_USERS[0]); // Sarah Pratama
  } else {
    setCurrentUser(SEED_USERS[1]); // Budi Santoso
  }
}

// --- JOBS ---

export function getAllJobs(): Job[] {
  if (typeof window === 'undefined') return SEED_JOBS;
  const stored = localStorage.getItem(JOBS_KEY);
  if (!stored) {
    initializeStorage();
    return SEED_JOBS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return SEED_JOBS;
  }
}

export function getJobById(id: string): Job | null {
  const jobs = getAllJobs();
  return jobs.find(j => j.id === id) || null;
}

export function createJob(jobData: Omit<Job, 'id' | 'createdAt' | 'status'>): Job {
  const jobs = getAllJobs();
  const newJob: Job = {
    ...jobData,
    id: `job-${Date.now()}`,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  jobs.unshift(newJob);
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  triggerDataRefresh();
  return newJob;
}

export function toggleJobStatus(id: string): Job | null {
  const jobs = getAllJobs();
  const index = jobs.findIndex(j => j.id === id);
  if (index === -1) return null;

  jobs[index].status = jobs[index].status === 'active' ? 'closed' : 'active';
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  triggerDataRefresh();
  return jobs[index];
}

export function deleteJob(id: string) {
  const jobs = getAllJobs().filter(j => j.id !== id);
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  triggerDataRefresh();
}

// --- APPLICATIONS ---

export function getAllApplications(): Application[] {
  if (typeof window === 'undefined') return SEED_APPLICATIONS;
  const stored = localStorage.getItem(APPLICATIONS_KEY);
  if (!stored) {
    initializeStorage();
    return SEED_APPLICATIONS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return SEED_APPLICATIONS;
  }
}

export function getApplicationsForJob(jobId: string): Application[] {
  const all = getAllApplications();
  const filtered = all.filter(a => a.jobId === jobId);
  // CRITICAL REQUIREMENT: Sort descending by AI overallScore (most relevant first)
  return filtered.sort((a, b) => (b.aiEvaluation?.overallScore || 0) - (a.aiEvaluation?.overallScore || 0));
}

export function getApplicationsForUser(userId: string): Application[] {
  const all = getAllApplications();
  return all.filter(a => a.userId === userId).sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
}

export function submitApplication(appData: Omit<Application, 'id' | 'appliedDate' | 'status'>): Application {
  const apps = getAllApplications();
  const newApp: Application = {
    ...appData,
    id: `app-${Date.now()}`,
    appliedDate: new Date().toISOString(),
    status: 'applied'
  };

  apps.unshift(newApp);
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
  triggerDataRefresh();
  return newApp;
}

export function updateApplicationStatus(id: string, status: Application['status'], notes?: string): Application | null {
  const apps = getAllApplications();
  const index = apps.findIndex(a => a.id === id);
  if (index === -1) return null;

  apps[index].status = status;
  if (notes !== undefined) {
    apps[index].hrNotes = notes;
  }

  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
  triggerDataRefresh();
  return apps[index];
}

export function updateApplicationAiEvaluation(id: string, evaluation: AiEvaluationResult): Application | null {
  const apps = getAllApplications();
  const index = apps.findIndex(a => a.id === id);
  if (index === -1) return null;

  apps[index].aiEvaluation = evaluation;
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
  triggerDataRefresh();
  return apps[index];
}

// --- SETTINGS ---

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) {
    initializeStorage();
    return DEFAULT_SETTINGS;
  }
  try {
    const parsed = JSON.parse(stored);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      geminiApiKey: parsed.geminiApiKey || DEFAULT_SETTINGS.geminiApiKey,
      aiModel: parsed.aiModel || DEFAULT_SETTINGS.aiModel
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function updateSettings(newSettings: Partial<AppSettings>) {
  if (typeof window === 'undefined') return;
  const current = getSettings();
  const updated = { ...current, ...newSettings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  triggerDataRefresh();
  return updated;
}

// Reset data to seeds
export function resetDataToSeed() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(JOBS_KEY, JSON.stringify(SEED_JOBS));
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(SEED_APPLICATIONS));
  localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  triggerDataRefresh();
}
