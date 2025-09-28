import { sign, verify } from 'hono/jwt';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'candidate' | 'recruiter';
  iat: number;
  exp: number;
}

export async function generateToken(userId: string, email: string, role: 'candidate' | 'recruiter'): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    userId,
    email,
    role,
    iat: now,
    exp: now + (24 * 60 * 60),
  };
  return await sign(payload, JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const payload = await verify(token, JWT_SECRET);
  return payload as any;
}

export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export function generateSessionToken(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
