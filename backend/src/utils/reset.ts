import crypto from 'crypto';
import { hashPassword, verifyPassword } from './auth';

export function generateRawToken(): string {
  // 32 bytes = 43 chars base64url aprox
  return crypto.randomBytes(32).toString('base64url');
}

export async function hashToken(token: string): Promise<string> {
  // reutilizamos bcrypt de hashPassword
  return hashPassword(token);
}

export async function compareToken(raw: string, hashed: string): Promise<boolean> {
  return verifyPassword(raw, hashed);
}
