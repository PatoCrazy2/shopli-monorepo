import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { signPosSyncToken, verifyPosSyncToken } from '../pos-token';
import { isOriginAllowed, getCorsHeaders, getAllowedOrigins } from '../cors';

describe('POS Token Utility (HMAC-SHA256)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.SYNC_JWT_SECRET = 'test-sync-jwt-secret-key-minimum-32-chars-long';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('signs and verifies a valid token payload', () => {
    const payload = {
      empresa_id: 'empresa-uuid-1234',
      user_id: 'user-uuid-5678',
      role: 'CAJERO',
      tokenVersion: 1,
    };

    const token = signPosSyncToken(payload);
    expect(token).toBeDefined();
    expect(token.split('.').length).toBe(3);

    const verified = verifyPosSyncToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.empresa_id).toBe(payload.empresa_id);
    expect(verified?.user_id).toBe(payload.user_id);
    expect(verified?.role).toBe(payload.role);
    expect(verified?.tokenVersion).toBe(payload.tokenVersion);
    expect(verified?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('rejects tampered tokens', () => {
    const payload = {
      empresa_id: 'empresa-uuid-1234',
      user_id: 'user-uuid-5678',
      role: 'CAJERO',
      tokenVersion: 1,
    };

    const token = signPosSyncToken(payload);
    const [header, body, sig] = token.split('.');

    // Tamper with payload
    const tamperedBody = Buffer.from(JSON.stringify({ ...payload, role: 'DUENO' })).toString('base64url');
    const tamperedToken = `${header}.${tamperedBody}.${sig}`;

    const verified = verifyPosSyncToken(tamperedToken);
    expect(verified).toBeNull();
  });

  it('rejects expired tokens', () => {
    const payload = {
      empresa_id: 'empresa-uuid-1234',
      user_id: 'user-uuid-5678',
      role: 'CAJERO',
      tokenVersion: 1,
    };

    const token = signPosSyncToken(payload);
    
    // Mock time to 31 days in future
    const now = Math.floor(Date.now() / 1000);
    vi.spyOn(Date, 'now').mockReturnValue((now + 31 * 24 * 60 * 60) * 1000);

    const verified = verifyPosSyncToken(token);
    expect(verified).toBeNull();
    vi.restoreAllMocks();
  });

  it('invalidates tokens when secret is rotated', () => {
    const token = signPosSyncToken({
      empresa_id: 'emp-1',
      user_id: 'usr-1',
      role: 'CAJERO',
      tokenVersion: 1,
    });

    // Rotate secret
    process.env.SYNC_JWT_SECRET = 'new-rotated-secret-key-32-chars-min!!!!!';

    const verified = verifyPosSyncToken(token);
    expect(verified).toBeNull();
  });
});

describe('CORS Security Utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('allows localhost origins in development', () => {
    process.env.NODE_ENV = 'development';
    expect(isOriginAllowed('http://localhost:5173')).toBe(true);
    expect(isOriginAllowed('http://127.0.0.1:5173')).toBe(true);
    expect(isOriginAllowed('https://malicious-site.com')).toBe(false);
  });

  it('strictly restricts origins to ALLOWED_POS_ORIGINS in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_POS_ORIGINS = 'https://pos.shopli.app,https://caja1.shopli.app';

    expect(isOriginAllowed('https://pos.shopli.app')).toBe(true);
    expect(isOriginAllowed('https://caja1.shopli.app')).toBe(true);
    expect(isOriginAllowed('http://localhost:5173')).toBe(false);
    expect(isOriginAllowed('https://evil-site.com')).toBe(false);
  });

  it('injects Vary: Origin and credentials headers properly', () => {
    process.env.NODE_ENV = 'development';
    const req = new Request('http://localhost:3000/api/pos/sync/pull', {
      headers: { Origin: 'http://localhost:5173' },
    });

    const headers = getCorsHeaders(req);
    expect(headers['Vary']).toBe('Origin');
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
    expect(headers['Access-Control-Allow-Credentials']).toBe('true');
  });

  it('does NOT set Access-Control-Allow-Origin for unauthorized origins', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_POS_ORIGINS = 'https://trusted.com';

    const req = new Request('http://localhost:3000/api/pos/sync/pull', {
      headers: { Origin: 'https://attacker.com' },
    });

    const headers = getCorsHeaders(req);
    expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
  });
});
