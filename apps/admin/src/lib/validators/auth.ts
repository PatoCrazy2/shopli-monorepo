// Dominios de correos temporales / desechables conocidos
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "sharklasers.com",
  "throwawaymail.com",
  "yopmail.com",
  "trashmail.com",
  "dispostable.com",
  "fakeinbox.com",
  "temp-mail.org",
  "mohmal.com",
  "crazymailing.com",
  "getairmail.com",
  "mytempemail.com",
]);

// Typos comunes en dominios populares
export const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmaill.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
};

export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

// Validación profesional de entregabilidad de correo comprobando existencia de registros MX por DNS
export async function checkEmailMxRecord(email: string): Promise<{ valid: boolean; reason?: string }> {
  if (!email || !email.includes("@")) {
    return { valid: false, reason: "Formato de correo inválido" };
  }

  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) {
    return { valid: false, reason: "Dominio de correo inválido" };
  }

  if (isDisposableEmail(email)) {
    return { valid: false, reason: "Proveedor de correo temporal o desechable no permitido" };
  }

  try {
    const dns = await import("node:dns/promises");
    const addresses = await dns.resolveMx(domain);
    if (!addresses || addresses.length === 0) {
      return { valid: false, reason: "El dominio ingresado no tiene servidores de correo activos (registros MX)" };
    }

    // Comprobar si los servidores MX de destino pertenecen a infraestructura de servicios desechables conocidos
    const disposableMxKeywords = ["mailinator", "guerrillamail", "trashmail", "tempmail", "yopmail", "sharklasers"];
    const hasDisposableMx = addresses.some((mx) =>
      disposableMxKeywords.some((keyword) => mx.exchange.toLowerCase().includes(keyword))
    );

    if (hasDisposableMx) {
      return { valid: false, reason: "Proveedor de correo temporal no permitido" };
    }

    return { valid: true };
  } catch (error: any) {
    // Si el DNS falla con ENOTFOUND o ENODATA, el dominio no existe o no tiene MX
    if (error.code === "ENOTFOUND" || error.code === "ENODATA") {
      return { valid: false, reason: "El dominio del correo no existe o no acepta correos entrantes" };
    }
    // En caso de timeout de red o error de conectividad local, no bloquear
    return { valid: true };
  }
}

export function suggestEmailDomain(email: string): string | null {
  if (!email || !email.includes("@")) return null;
  const parts = email.split("@");
  if (parts.length !== 2) return null;
  const [local, domain] = parts;
  if (!domain || !local) return null;
  const lowerDomain = domain.toLowerCase().trim();
  const suggested = COMMON_DOMAIN_TYPOS[lowerDomain];
  if (suggested) {
    return `${local}@${suggested}`;
  }
  return null;
}

export interface PasswordRulesState {
  hasMinLength: boolean;
  hasNumber: boolean;
  hasLetter: boolean;
  isValid: boolean;
}

export function checkPasswordRules(password: string): PasswordRulesState {
  const hasMinLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const isValid = hasMinLength && hasNumber && hasLetter;

  return {
    hasMinLength,
    hasNumber,
    hasLetter,
    isValid,
  };
}
