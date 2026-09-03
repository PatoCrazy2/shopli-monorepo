import crypto from 'node:crypto';
import { Role } from '@shopli/db';

export interface PosTokenPayload {
  empresa_id: string;
  user_id: string;
  role: Role | string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function getSyncJwtSecret(): string {
  const secret = process.env.SYNC_JWT_SECRET || process.env.POS_SYNC_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SYNC_JWT_SECRET is required in production');
    }
    return 'dev-fallback-sync-secret-32-characters-min!!';
  }
  return secret;
}

export function signPosSyncToken(payload: Omit<PosTokenPayload, 'iat' | 'exp'>): string {
  const secret = getSyncJwtSecret();
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: PosTokenPayload = {
    ...payload,
    iat: now,
    exp: now + 30 * 24 * 60 * 60,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${dataToSign}.${signature}`;
}

export function verifyPosSyncToken(token: string): PosTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, signature] = parts;
    const secret = getSyncJwtSecret();
    const dataToSign = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(dataToSign)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payloadStr = base64UrlDecode(encodedPayload);
    const payload: PosTokenPayload = JSON.parse(payloadStr);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    if (!payload.empresa_id || !payload.user_id || typeof payload.tokenVersion !== 'number') {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}