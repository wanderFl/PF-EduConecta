import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
const SALT_ROUNDS = 10;

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  external_id?: string | null;
}

export const hashPassword = async (password: string): Promise<string> => {
  try {
    const hashedPassword = await hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {

    
    const isValid = await compare(password, hashedPassword);
    
    return isValid;
  } catch (error) {
    console.error('Error verifying password:', error);
    throw error;
  }
};

export const generateToken = (payload: TokenPayload): string => {
  return sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};