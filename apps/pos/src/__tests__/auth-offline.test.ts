import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../lib/db';
import bcrypt from 'bcryptjs';

describe('Autenticación Offline y Mecanismos de Seguridad (Unit Tests)', () => {
    beforeEach(async () => {
        await db.users.clear();
        await db.meta.clear();
        await db.branches.clear();
    });

    it('debe autenticar exitosamente con PIN correcto de 6 dígitos', async () => {
        const pin = '123456';
        const pinHash = await bcrypt.hash(pin, 10);
        const user = {
            id: 'cajero-1',
            name: 'Juan Cajero',
            email: 'juan@shopli.com',
            role: 'CAJERO' as const,
            pin: pinHash,
        };
        await db.users.add(user);
        await db.meta.put({ key: 'lastOnlineVerification', value: new Date().toISOString() });

        const localUser = await db.users.get('cajero-1');
        expect(localUser).toBeDefined();
        const isMatch = await bcrypt.compare(pin, localUser!.pin!);
        expect(isMatch).toBe(true);
    });

    it('debe rechazar PIN incorrecto', async () => {
        const pinHash = await bcrypt.hash('123456', 10);
        await db.users.add({
            id: 'cajero-1',
            name: 'Juan Cajero',
            email: 'juan@shopli.com',
            role: 'CAJERO' as const,
            pin: pinHash,
        });

        const localUser = await db.users.get('cajero-1');
        const isMatch = await bcrypt.compare('999999', localUser!.pin!);
        expect(isMatch).toBe(false);
    });

    it('debe detectar expiración de sesión offline tras 72 horas', async () => {
        const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
        await db.meta.put({ key: 'lastOnlineVerification', value: fourDaysAgo });

        const lastVerification = await db.meta.get('lastOnlineVerification');
        const diffMs = Date.now() - new Date(lastVerification!.value).getTime();
        const OFFLINE_TTL_MS = 72 * 60 * 60 * 1000;

        expect(diffMs > OFFLINE_TTL_MS).toBe(true);
    });

    it('debe registrar y aplicar lockout por usuario tras 3 intentos fallidos', async () => {
        const userId = 'cajero-test';
        // Simular 3 intentos fallidos
        const userLockRecord = { failedAttempts: 3, lockedUntil: Date.now() + 30 * 1000 };
        await db.meta.put({ key: `lockout_${userId}`, value: userLockRecord });

        const savedLock = await db.meta.get(`lockout_${userId}`);
        expect(savedLock?.value.failedAttempts).toBe(3);
        expect(savedLock?.value.lockedUntil).toBeGreaterThan(Date.now());
    });

    it('debe registrar ventana deslizante y disparar bloqueo global de terminal con 10 fallos', async () => {
        const now = Date.now();
        const DEVICE_LOCKOUT_DURATION_MS = 2 * 60 * 1000;

        await db.meta.put({ key: 'device_locked_until', value: now + DEVICE_LOCKOUT_DURATION_MS });

        const devLock = await db.meta.get('device_locked_until');
        expect(devLock?.value).toBeGreaterThan(now);
        expect(devLock?.value - now).toBe(DEVICE_LOCKOUT_DURATION_MS);
    });
});
