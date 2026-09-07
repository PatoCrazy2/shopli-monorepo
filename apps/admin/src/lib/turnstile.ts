interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Valida un token de Cloudflare Turnstile contra el endpoint oficial de Cloudflare.
 * Soporta bypass en test o preview si no está configurada la llave secreta.
 */
export async function verifyTurnstileToken(token: string | null | undefined, remoteIp?: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Si no hay secret configurado en desarrollo, preview de Vercel o testing, permitir para no bloquear
  if (!secretKey) {
    if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview') {
      return true;
    }
    console.error('TURNSTILE_SECRET_KEY no configurada en producción.');
    return false;
  }

  if (!token) {
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data: TurnstileVerifyResponse = await res.json();
    return !!data.success;
  } catch (error) {
    console.error('Error al verificar Turnstile token:', error);
    return false;
  }
}
