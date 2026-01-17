import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'protocol-department-secret-key-change-in-production';
const TOKEN_EXPIRY = '365d';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  isAdmin?: boolean;
  isSuperUser?: boolean;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // Support multiple password formats for compatibility

  // Format: bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (hashedPassword.startsWith('$2')) {
    return bcrypt.compare(password, hashedPassword);
  }

  // Format: sha256$<salt>$<hash> (from legacy system)
  if (hashedPassword.startsWith('sha256$')) {
    const crypto = await import('crypto');
    const parts = hashedPassword.split('$');
    if (parts.length === 3) {
      const salt = parts[1];
      const storedHash = parts[2];
      const hash = crypto.createHmac('sha256', salt).update(password).digest('hex');
      return hash === storedHash;
    }
  }

  // Format: pbkdf2:sha256$<salt>$<hash>
  if (hashedPassword.startsWith('pbkdf2:sha256$')) {
    const crypto = await import('crypto');
    const parts = hashedPassword.replace('pbkdf2:sha256$', '').split('$');
    if (parts.length === 2) {
      const salt = parts[0];
      const storedHash = parts[1];
      const hash = crypto.pbkdf2Sync(password, salt, 150000, 32, 'sha256').toString('hex');
      return hash === storedHash;
    }
  }

  // Plain text comparison (for development only)
  return password === hashedPassword;
}

export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('auth-token')?.value || null;
}

export async function getCurrentUser(): Promise<TokenPayload | null> {
  const token = await getTokenFromCookies();
  if (!token) return null;
  return verifyToken(token);
}
