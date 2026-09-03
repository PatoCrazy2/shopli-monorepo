/**
 * Obtiene los orígenes permitidos según el entorno.
 */
export function getAllowedOrigins(): string[] {
  const customOrigins = process.env.ALLOWED_POS_ORIGINS
    ? process.env.ALLOWED_POS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  if (process.env.NODE_ENV !== 'production') {
    return [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      ...customOrigins,
    ];
  }

  return customOrigins;
}

/**
 * Valida si un origen específico está permitido.
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const allowed = getAllowedOrigins();
  return allowed.includes(origin);
}

/**
 * Devuelve los headers de CORS adecuados para una petición específica.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  const allowed = isOriginAllowed(origin);

  const headers: Record<string, string> = {
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
    'Access-Control-Allow-Headers':
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-pos-sync-secret, x-test-bypass',
  };

  if (allowed && origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

/**
 * Manejador estándar de preflight OPTIONS.
 */
export function handleCorsPreflight(req: Request): Response {
  const headers = getCorsHeaders(req);
  return new Response(null, {
    status: 204,
    headers,
  });
}
