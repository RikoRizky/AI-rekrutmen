'use client';

import {
  Job,
  Application,
  User,
  Company,
  CompanyInvitationToken,
  Transaction,
  AppSettings,
  UserRole,
  ApplicationStatus,
  AiEvaluationResult,
  UserBiodata
} from './types';
import {
  SEED_JOBS,
  SEED_APPLICATIONS,
  SEED_USERS,
  SEED_COMPANIES,
  SEED_TRANSACTIONS,
  DEFAULT_SETTINGS,
  SUBSCRIPTION_PACKAGES
} from './seed-data';
import { isTokenValid } from './token';

const JOBS_KEY = 'smartrecruit_jobs';
const APPLICATIONS_KEY = 'smartrecruit_applications';
const USERS_KEY = 'smartrecruit_users';
const COMPANIES_KEY = 'smartrecruit_companies';
const TRANSACTIONS_KEY = 'smartrecruit_transactions';
const TOKENS_KEY = 'smartrecruit_tokens';
const CURRENT_USER_KEY = 'smartrecruit_current_user';
const SETTINGS_KEY = 'smartrecruit_settings';

export const REFRESH_EVENT = 'smartrecruit_data_updated';

export function triggerDataRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REFRESH_EVENT));
  }
}

const STORAGE_VERSION_KEY = 'smartrecruit_storage_v2';

export function initializeStorage() {
  if (typeof window === 'undefined') return;

  const currentVersion = localStorage.getItem(STORAGE_VERSION_KEY);
  if (currentVersion !== '2.1') {
    // Reset/migrate to new 3-role multi-tenant seed data
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(SEED_COMPANIES));
    localStorage.setItem(JOBS_KEY, JSON.stringify(SEED_JOBS));
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(SEED_APPLICATIONS));
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_VERSION_KEY, '3.0');
    triggerDataRefresh();
    return;
  }

  if (!localStorage.getItem(COMPANIES_KEY)) {
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(SEED_COMPANIES));
  }
  if (!localStorage.getItem(JOBS_KEY)) {
    localStorage.setItem(JOBS_KEY, JSON.stringify(SEED_JOBS));
  }
  if (!localStorage.getItem(APPLICATIONS_KEY)) {
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(SEED_APPLICATIONS));
  }
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
  }
  if (!localStorage.getItem(TRANSACTIONS_KEY)) {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(SEED_TRANSACTIONS));
  }
  if (!localStorage.getItem(TOKENS_KEY)) {
    localStorage.setItem(TOKENS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(SETTINGS_KEY)) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  }
}

// --- USER & AUTH ---

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  triggerDataRefresh();
}

export function logoutUser() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CURRENT_USER_KEY);
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

export function registerOrLoginUser(
  name: string,
  email: string,
  role: UserRole = 'applicant',
  phone: string = '',
  headline: string = '',
  companyId?: string,
  companyName?: string,
  password?: string
): User {
  const users = getAllUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    setCurrentUser(existing);
    return existing;
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    password: password || 'password123',
    phone,
    role,
    companyId,
    companyName,
    headline:
      headline ||
      (role === 'applicant'
        ? 'Pencari Kerja / Talenta'
        : role === 'super_admin'
        ? 'Super Administrator'
        : 'Recruiter / Talent Acquisition'),
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=059669,047857,0f172a&textColor=ffffff`,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  setCurrentUser(newUser);
  return newUser;
}

// --- COMPANIES ---

export function getAllCompanies(): Company[] {
  if (typeof window === 'undefined') return SEED_COMPANIES;
  const stored = localStorage.getItem(COMPANIES_KEY);
  if (!stored) {
    initializeStorage();
    return SEED_COMPANIES;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return SEED_COMPANIES;
  }
}

export function getCompanyById(id: string): Company | null {
  const companies = getAllCompanies();
  return companies.find((c) => c.id === id) || null;
}

export function registerNewCompany(
  companyData: Omit<Company, 'id' | 'createdAt' | 'isVerified'>,
  adminUser: { name: string; email: string; phone?: string; password?: string }
): { company: Company; user: User } {
  const companies = getAllCompanies();
  const newCompanyId = `comp-${Date.now()}`;
  
  const newCompany: Company = {
    ...companyData,
    id: newCompanyId,
    isVerified: true,
    createdAt: new Date().toISOString()
  };

  companies.push(newCompany);
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));

  const user = registerOrLoginUser(
    adminUser.name,
    adminUser.email,
    'company_admin',
    adminUser.phone || '',
    `Talent Acquisition Lead at ${newCompany.name}`,
    newCompany.id,
    newCompany.name
  );

  triggerDataRefresh();
  return { company: newCompany, user };
}

// --- TOKEN PENGUNDANG / ONE-TIME LINK ---

export function getAllTokens(): CompanyInvitationToken[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(TOKENS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function addInvitationToken(token: CompanyInvitationToken) {
  const tokens = getAllTokens();
  tokens.push(token);
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export function findInvitationToken(tokenStr: string): CompanyInvitationToken | null {
  const tokens = getAllTokens();
  return tokens.find((t) => t.token === tokenStr) || null;
}

export function consumeInvitationToken(tokenStr: string): boolean {
  const tokens = getAllTokens();
  const idx = tokens.findIndex((t) => t.token === tokenStr);
  if (idx !== -1 && !tokens[idx].isUsed) {
    tokens[idx].isUsed = true;
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    triggerDataRefresh();
    return true;
  }
  return false;
}

// --- TRANSACTIONS ---

export function getAllTransactions(): Transaction[] {
  if (typeof window === 'undefined') return SEED_TRANSACTIONS;
  const stored = localStorage.getItem(TRANSACTIONS_KEY);
  if (!stored) {
    initializeStorage();
    return SEED_TRANSACTIONS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return SEED_TRANSACTIONS;
  }
}

export function addTransaction(transaction: Transaction) {
  const transactions = getAllTransactions();
  transactions.unshift(transaction);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  triggerDataRefresh();
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
  return jobs.find((j) => j.id === id) || null;
}

export function getJobsByCompanyId(companyId: string): Job[] {
  const jobs = getAllJobs();
  return jobs.filter((j) => j.companyId === companyId);
}

export function createJob(jobData: Omit<Job, 'id' | 'createdAt'>): Job {
  const jobs = getAllJobs();
  const newJob: Job = {
    ...jobData,
    id: `job-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  jobs.unshift(newJob);
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  triggerDataRefresh();
  return newJob;
}

export function updateJob(id: string, updates: Partial<Job>): Job | null {
  const jobs = getAllJobs();
  const index = jobs.findIndex((j) => j.id === id);
  if (index === -1) return null;

  jobs[index] = { ...jobs[index], ...updates };
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  triggerDataRefresh();
  return jobs[index];
}

export function deleteJob(id: string): boolean {
  const jobs = getAllJobs();
  const filtered = jobs.filter((j) => j.id !== id);
  if (filtered.length !== jobs.length) {
    localStorage.setItem(JOBS_KEY, JSON.stringify(filtered));
    triggerDataRefresh();
    return true;
  }
  return false;
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

export function getApplicationsByJobId(jobId: string): Application[] {
  return getAllApplications().filter((a) => a.jobId === jobId);
}

export function getApplicationsByCompanyId(companyId: string): Application[] {
  return getAllApplications().filter((a) => a.companyId === companyId);
}

export function getApplicationsByUserId(userId: string): Application[] {
  return getAllApplications().filter((a) => a.userId === userId);
}

export function updateUserBiodata(userId: string, biodata: UserBiodata, avatarUrl?: string): User | null {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  users[index] = {
    ...users[index],
    name: biodata.fullName || users[index].name,
    avatar: avatarUrl || users[index].avatar,
    biodata,
    profileCompleted: true
  };

  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(users[index]);
  }

  triggerDataRefresh();
  return users[index];
}

export function submitApplication(
  applicationData: Omit<Application, 'id' | 'appliedDate' | 'status'> & { status?: ApplicationStatus }
): Application {
  const applications = getAllApplications();
  
  // Try to auto-attach user's biodata and AI background report if available
  let applicantBiodata = applicationData.applicantBiodata;
  if (!applicantBiodata && applicationData.userId) {
    const user = getAllUsers().find((u) => u.id === applicationData.userId);
    if (user && user.biodata) {
      applicantBiodata = user.biodata;
    }
  }

  const newApplication: Application = {
    ...applicationData,
    applicantBiodata,
    id: `app-${Date.now()}`,
    appliedDate: new Date().toISOString(),
    status: applicationData.status || 'applied'
  };

  applications.unshift(newApplication);
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
  triggerDataRefresh();
  return newApplication;
}

export function updateApplicationStatus(id: string, status: ApplicationStatus, hrNotes?: string): Application | null {
  const applications = getAllApplications();
  const index = applications.findIndex((a) => a.id === id);
  if (index === -1) return null;

  applications[index] = {
    ...applications[index],
    status,
    ...(hrNotes !== undefined ? { hrNotes } : {})
  };

  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
  triggerDataRefresh();
  return applications[index];
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
    return JSON.parse(stored);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  triggerDataRefresh();
}
