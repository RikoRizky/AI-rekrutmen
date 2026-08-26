import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Check if a stored password string is already a valid bcrypt hash
 */
export function isPasswordHashed(password: string | null | undefined): boolean {
  if (!password) return false;
  // bcrypt hashes start with $2a$, $2b$, or $2y$ and are ~60 characters long
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(password);
}

/**
 * Verify plaintext password against stored password (handles both bcrypt hashes and legacy plaintext fallback)
 */
export async function verifyPassword(plainPassword: string, storedPassword: string | null | undefined): Promise<boolean> {
  if (!storedPassword) return false;
  
  if (isPasswordHashed(storedPassword)) {
    try {
      return await bcrypt.compare(plainPassword, storedPassword);
    } catch {
      return false;
    }
  }

  // Fallback for legacy unhashed passwords in database
  return plainPassword === storedPassword;
}
