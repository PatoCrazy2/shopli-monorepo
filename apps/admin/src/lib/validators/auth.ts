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
