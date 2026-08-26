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
  UserBiodata,
  CompanyScaleCategory
} from './types';
import {
  SEED_JOBS,
  SEED_APPLICATIONS,
  SEED_USERS,
  SEED_COMPANIES,
  SEED_TRANSACTIONS,
  DEFAULT_SETTINGS,
} from './seed-data';

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

let isSyncing = false;

export async function syncFromDatabase() {
  if (typeof window === 'undefined' || isSyncing) return;
  isSyncing = true;
  try {
    const [jobsRes, companiesRes, appsRes, usersRes, trxRes, settingsRes] = await Promise.all([
      fetch('/api/jobs').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/companies').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/applications').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/auth').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/transactions').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/settings').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);

    let modified = false;

    if (jobsRes?.success && Array.isArray(jobsRes.jobs)) {
      localStorage.setItem(JOBS_KEY, JSON.stringify(jobsRes.jobs));
      modified = true;
    }
    if (companiesRes?.success && Array.isArray(companiesRes.companies)) {
      localStorage.setItem(COMPANIES_KEY, JSON.stringify(companiesRes.companies));
      modified = true;
    }
    if (appsRes?.success && Array.isArray(appsRes.applications)) {
      localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(appsRes.applications));
      modified = true;
    }
    if (usersRes?.success && Array.isArray(usersRes.users)) {
      localStorage.setItem(USERS_KEY, JSON.stringify(usersRes.users));
      modified = true;

      // Sync currentUser if exists
      const currentUser = getCurrentUser();
      if (currentUser) {
        const found = usersRes.users.find((u: User) => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase());
        if (found) {
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(found));
        }
      }
    }
    if (trxRes?.success && Array.isArray(trxRes.transactions)) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(trxRes.transactions));
      modified = true;
    }
    if (settingsRes?.success && settingsRes.settings) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsRes.settings));
      modified = true;
    }

    if (modified) {
      triggerDataRefresh();
    }
  } catch (e) {
    console.error('Error syncing data from MySQL:', e);
  } finally {
    isSyncing = false;
  }
}

export function initializeStorage() {
  if (typeof window === 'undefined') return;

  // Set default initial cache if empty
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

  // Trigger background sync from MySQL database
  syncFromDatabase();
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
    return SEED_USERS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return SEED_USERS;
  }
}

export async function loginUserAsync(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Gagal masuk. Periksa email dan password Anda.' };
    }

    if (data.user) {
      setCurrentUser(data.user);
      // Update local users cache
      const users = getAllUsers();
      const idx = users.findIndex((u) => u.id === data.user.id || u.email.toLowerCase() === data.user.email.toLowerCase());
      if (idx !== -1) {
        users[idx] = data.user;
      } else {
        users.push(data.user);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    }
    return { success: true, user: data.user };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kendala jaringan saat login';
    return { success: false, error: message };
  }
}

export async function registerUserAsync(
  name: string,
  email: string,
  password: string,
  role: UserRole = 'applicant',
  phone: string = '',
  headline: string = ''
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', name, email, password, role, phone, headline })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Gagal mendaftar akun.' };
    }

    if (data.user) {
      setCurrentUser(data.user);
      const users = getAllUsers();
      users.push(data.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    }
    return { success: true, user: data.user };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kendala jaringan saat mendaftar';
    return { success: false, error: message };
  }
}

export async function loginWithGoogleAsync(
  name: string,
  email: string,
  avatarUrl?: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'google_auth', name, email, role: 'applicant' })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Gagal autentikasi dengan akun Google.' };
    }

    const finalUser = {
      ...data.user,
      avatar: avatarUrl || data.user.avatar
    };

    setCurrentUser(finalUser);
    const users = getAllUsers();
    const idx = users.findIndex((u) => u.id === finalUser.id || u.email.toLowerCase() === finalUser.email.toLowerCase());
    if (idx !== -1) {
      users[idx] = finalUser;
    } else {
      users.push(finalUser);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    return { success: true, user: finalUser };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal login via Google';
    return { success: false, error: message };
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
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'google_auth', name, email, password, role, phone, headline, companyId, companyName })
    }).catch(console.error);
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

  fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'register', ...newUser })
  }).then(r => r.json()).then(res => {
    if (res?.user) {
      setCurrentUser(res.user);
    }
  }).catch(console.error);

  return newUser;
}

// --- COMPANIES ---

export function getAllCompanies(): Company[] {
  if (typeof window === 'undefined') return SEED_COMPANIES;
  const stored = localStorage.getItem(COMPANIES_KEY);
  if (!stored) {
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

export function getCompanyScaleCategory(
  activeSubscription?: string | null,
  companyName?: string,
  industry?: string
): CompanyScaleCategory {
  const combined = `${activeSubscription || ''} ${companyName || ''} ${industry || ''}`.toLowerCase();
  if (combined.includes('umk') || combined.includes('starter') || combined.includes('mikro') || combined.includes('kecil')) {
    return 'UMK';
  }
  if (
    combined.includes('industri') ||
    combined.includes('enterprise') ||
    combined.includes('manufaktur') ||
    combined.includes('pabrik') ||
    combined.includes('automotive') ||
    combined.includes('telekomunikasi') ||
    combined.includes('astra') ||
    combined.includes('telkom')
  ) {
    return 'Industri';
  }
  return 'Perusahaan';
}

export function getDefaultUserAvatar(name: string): string {
  const cleanName = (name || 'Pelamar').trim();
  const initials = cleanName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'PL';

  const colors = [
    { from: '#059669', to: '#047857', ring: '#10b981', badgeBg: '#064e3b' }, // Emerald Green
    { from: '#0d9488', to: '#0f766e', ring: '#2dd4bf', badgeBg: '#134e4a' }, // Teal
    { from: '#10b981', to: '#059669', ring: '#34d399', badgeBg: '#064e3b' }, // Mint
    { from: '#15803d', to: '#166534', ring: '#4ade80', badgeBg: '#14532d' }, // Forest Green
    { from: '#0f766e', to: '#115e59', ring: '#2dd4bf', badgeBg: '#134e4a' }  // Deep Teal
  ];
  const charCodeSum = cleanName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const color = colors[charCodeSum % colors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="userGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color.from}" />
        <stop offset="100%" stop-color="${color.to}" />
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="36" fill="#090d16" />
    <circle cx="64" cy="64" r="54" fill="url(#userGrad)" />
    <!-- Candidate Silhouette -->
    <circle cx="64" cy="46" r="18" fill="#ffffff" fill-opacity="0.95" />
    <path d="M36 96c0-15.464 12.536-28 28-28s28 12.536 28 28" fill="#ffffff" fill-opacity="0.95" />
    <!-- Candidate Initials Pill Badge -->
    <rect x="36" y="90" width="56" height="24" rx="12" fill="${color.badgeBg}" stroke="${color.ring}" stroke-width="2" />
    <text x="64" y="106" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getDefaultCompanyLogo(name: string): string {
  const cleanName = (name || 'PT Perusahaan').trim();
  
  // Intelligent Company Initials Extraction (strip PT, CV, etc.)
  const withoutPrefix = cleanName.replace(/^(PT\.?|CV\.?|UD\.?|INC\.?|CORP\.?|LTD\.?)\s+/i, '').trim();
  let initials = '';
  if (withoutPrefix.length > 0 && withoutPrefix.length <= 4) {
    initials = withoutPrefix.toUpperCase();
  } else {
    const words = withoutPrefix.split(' ').filter(Boolean);
    if (words.length === 1) {
      initials = words[0].slice(0, 3).toUpperCase();
    } else {
      initials = words.map((w) => w[0]).slice(0, 3).join('').toUpperCase();
    }
  }
  if (!initials) initials = 'PT';

  const colors = [
    { from: '#1e3a8a', to: '#172554', accent: '#38bdf8', glow: '#60a5fa', badgeBg: '#0f172a' }, // Deep Navy Blue
    { from: '#0369a1', to: '#075985', accent: '#38bdf8', glow: '#7dd3fc', badgeBg: '#0c4a6e' }, // Sapphire Ocean
    { from: '#312e81', to: '#1e1b4b', accent: '#818cf8', glow: '#a5b4fc', badgeBg: '#1e1b4b' }, // Royal Indigo
    { from: '#1e293b', to: '#0f172a', accent: '#60a5fa', glow: '#93c5fd', badgeBg: '#020617' }, // Corporate Steel
    { from: '#1e40af', to: '#1e3a8a', accent: '#67e8f9', glow: '#a5f3fc', badgeBg: '#172554' }  // Cobalt Blue
  ];
  const charCodeSum = cleanName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const color = colors[charCodeSum % colors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="compGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color.from}" />
        <stop offset="100%" stop-color="${color.to}" />
      </linearGradient>
    </defs>
    <!-- Background Frame -->
    <rect width="128" height="128" rx="28" fill="url(#compGrad)" />
    <!-- Corporate Skyscraper Vector -->
    <path d="M38 90V44l26-14 26 14v46H38z" fill="#ffffff" fill-opacity="0.18" />
    <path d="M46 52h8v7h-8zm0 11h8v7h-8zm0 11h8v7h-8zm28-22h8v7h-8zm0 11h8v7h-8zm0 11h8v7h-8z" fill="#ffffff" fill-opacity="0.8" />
    <path d="M60 40h8v50h-8z" fill="#ffffff" fill-opacity="0.35" />
    <!-- Company Name Badge -->
    <rect x="24" y="88" width="80" height="28" rx="14" fill="${color.badgeBg}" stroke="${color.accent}" stroke-width="2" />
    <text x="64" y="106" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.2">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function updateCompany(id: string, updateData: Partial<Company>): Company | null {
  const companies = getAllCompanies();
  const index = companies.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const updated: Company = {
    ...companies[index],
    ...updateData
  };
  companies[index] = updated;
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));

  // Sync with jobs
  const jobs = getAllJobs();
  let jobsModified = false;
  jobs.forEach((j) => {
    if (j.companyId === id) {
      if (updateData.name) j.companyName = updateData.name;
      if (updateData.logo) j.companyLogo = updateData.logo;
      if (updateData.address) j.location = updateData.address;
      jobsModified = true;
    }
  });
  if (jobsModified) {
    localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  }

  // Sync with current user
  const currentUser = getCurrentUser();
  if (currentUser && (currentUser.companyId === id || currentUser.companyName === companies[index].name)) {
    if (updateData.name) currentUser.companyName = updateData.name;
    if (updateData.logo) currentUser.avatar = updateData.logo;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  }

  triggerDataRefresh();

  // Asynchronously save to MySQL database
  fetch('/api/companies', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updateData })
  }).catch(console.error);

  return updated;
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
    logo: companyData.logo || getDefaultCompanyLogo(companyData.name),
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

  if (newCompany.logo) {
    user.avatar = newCompany.logo;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }

  triggerDataRefresh();

  // Asynchronously save to MySQL database
  fetch('/api/companies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...companyData,
      adminName: adminUser.name,
      adminEmail: adminUser.email,
      adminPhone: adminUser.phone,
      adminPassword: adminUser.password,
    })
  }).catch(console.error);

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
  
  fetch('/api/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(token)
  }).catch(console.error);
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

    fetch('/api/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'consume', token: tokenStr })
    }).catch(console.error);

    return true;
  }
  return false;
}

// --- TRANSACTIONS ---

export function getAllTransactions(): Transaction[] {
  if (typeof window === 'undefined') return SEED_TRANSACTIONS;
  const stored = localStorage.getItem(TRANSACTIONS_KEY);
  if (!stored) {
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

  // Asynchronously save to MySQL database
  fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction)
  }).catch(console.error);
}

// --- JOBS ---

export function getAllJobs(): Job[] {
  if (typeof window === 'undefined') return SEED_JOBS;
  const stored = localStorage.getItem(JOBS_KEY);
  if (!stored) {
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

export function getJobsByCompanyId(companyId: string, companyName?: string): Job[] {
  const jobs = getAllJobs();
  return jobs.filter((j) => {
    if (j.companyId === companyId) return true;
    if (companyName && j.companyName && j.companyName.toLowerCase().trim() === companyName.toLowerCase().trim()) return true;
    return false;
  });
}

export async function createJob(jobData: Omit<Job, 'id' | 'createdAt'>): Promise<Job> {
  const jobs = getAllJobs();
  const tempId = `job-${Date.now()}`;
  let newJob: Job = {
    ...jobData,
    id: tempId,
    createdAt: new Date().toISOString()
  };

  try {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.job) {
        newJob = data.job;
      }
    }
  } catch (err) {
    console.warn('MySQL save error for createJob:', err);
  }

  // Prepend new job to local cache (avoid duplicates)
  const filtered = jobs.filter((j) => j.id !== newJob.id && j.id !== tempId);
  filtered.unshift(newJob);
  localStorage.setItem(JOBS_KEY, JSON.stringify(filtered));
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

  // Asynchronously update in MySQL database
  fetch(`/api/jobs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  }).catch(console.error);

  return jobs[index];
}

export function deleteJob(id: string): boolean {
  const jobs = getAllJobs();
  const filtered = jobs.filter((j) => j.id !== id);
  if (filtered.length !== jobs.length) {
    localStorage.setItem(JOBS_KEY, JSON.stringify(filtered));
    triggerDataRefresh();

    // Asynchronously delete in MySQL database
    fetch(`/api/jobs/${id}`, {
      method: 'DELETE'
    }).catch(console.error);

    return true;
  }
  return false;
}

// --- APPLICATIONS ---

export function getAllApplications(): Application[] {
  if (typeof window === 'undefined') return SEED_APPLICATIONS;
  const stored = localStorage.getItem(APPLICATIONS_KEY);
  if (!stored) {
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
    phone: biodata.phone || users[index].phone,
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

  // Asynchronously save to MySQL database
  fetch('/api/auth/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, biodata, avatarUrl })
  }).catch(console.error);

  return users[index];
}

export function submitApplication(
  applicationData: Omit<Application, 'id' | 'appliedDate' | 'status'> & { status?: ApplicationStatus }
): Application {
  const applications = getAllApplications();
  
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

  // Asynchronously save application + documents + AI evaluation to MySQL database
  fetch('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newApplication)
  }).then(r => r.json()).catch(console.error);

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

  // Asynchronously save to MySQL database
  fetch(`/api/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, hrNotes })
  }).catch(console.error);

  return applications[index];
}

// --- SETTINGS ---

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) {
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

  // Asynchronously save to MySQL database
  fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  }).catch(console.error);
}

// --- DEADLINE & COUNTDOWN UTILITIES ---

export interface DeadlineInfo {
  isExpired: boolean;
  label: string;
  daysLeft: number;
  badgeClass: string;
  isUrgent: boolean;
}

export function getJobDeadlineCountdown(deadlineStr?: string): DeadlineInfo {
  if (!deadlineStr) {
    return {
      isExpired: false,
      label: 'Batas: Terbuka',
      daysLeft: 999,
      badgeClass: 'text-slate-400 bg-slate-950 border-slate-800',
      isUrgent: false
    };
  }

  const deadlineDate = new Date(deadlineStr);
  if (isNaN(deadlineDate.getTime())) {
    return {
      isExpired: false,
      label: 'Batas: Terbuka',
      daysLeft: 999,
      badgeClass: 'text-slate-400 bg-slate-950 border-slate-800',
      isUrgent: false
    };
  }

  if (deadlineStr.length <= 10) {
    deadlineDate.setHours(23, 59, 59, 999);
  }

  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      isExpired: true,
      label: 'Pendaftaran Ditutup',
      daysLeft: 0,
      badgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      isUrgent: true
    };
  }

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays > 30) {
    const months = Math.floor(totalDays / 30);
    const remDays = totalDays % 30;
    const label = remDays > 0 ? `Sisa ${months} bln ${remDays} hr` : `Sisa ${months} bulan lagi`;
    return {
      isExpired: false,
      label,
      daysLeft: totalDays,
      badgeClass: 'text-slate-300 bg-slate-950 border-slate-800',
      isUrgent: false
    };
  }

  if (totalDays > 7) {
    return {
      isExpired: false,
      label: `Sisa ${totalDays} hari lagi`,
      daysLeft: totalDays,
      badgeClass: 'text-slate-300 bg-slate-950 border-slate-800',
      isUrgent: false
    };
  }

  if (totalDays >= 1) {
    return {
      isExpired: false,
      label: totalDays === 1 ? 'Sisa 1 hari lagi!' : `Sisa ${totalDays} hari lagi!`,
      daysLeft: totalDays,
      badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      isUrgent: true
    };
  }

  if (totalHours >= 1) {
    return {
      isExpired: false,
      label: `Sisa ${totalHours} jam lagi!`,
      daysLeft: 0,
      badgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse',
      isUrgent: true
    };
  }

  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  return {
    isExpired: false,
    label: `Sisa ${minutes} menit lagi!`,
    daysLeft: 0,
    badgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse',
    isUrgent: true
  };
}
