import { CompanyInvitationToken } from './types';

// Helper for generating secure random tokens
export function generateSecureToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function createInvitationToken(email: string, packageType: string): CompanyInvitationToken {
  const token = `cptk_${generateSecureToken(24)}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours expiry
  
  return {
    id: `token-${Date.now()}`,
    token,
    email,
    packageType,
    isUsed: false,
    expiresAt,
    createdAt: new Date().toISOString()
  };
}

export function isTokenValid(tokenObj: CompanyInvitationToken | null | undefined): { valid: boolean; reason?: string } {
  if (!tokenObj) {
    return { valid: false, reason: 'Token pendaftaran tidak ditemukan.' };
  }
  if (tokenObj.isUsed) {
    return { valid: false, reason: 'Link pendaftaran ini sudah pernah digunakan.' };
  }
  const now = new Date().getTime();
  const expiry = new Date(tokenObj.expiresAt).getTime();
  if (now > expiry) {
    return { valid: false, reason: 'Link pendaftaran ini sudah kedaluwarsa (maksimal 24 jam).' };
  }
  return { valid: true };
}
