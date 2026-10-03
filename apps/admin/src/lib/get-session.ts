import { cache } from "react";
import { auth } from "./auth";

/**
 * Obtiene la sesión actual del usuario memoizada por request mediante React.cache.
 * Evita decodificar o parsear el token JWT múltiples veces en un mismo ciclo de renderizado
 * (layout, componentes server, queries paralelas en RSC).
 */
export const getSession = cache(async () => {
  return auth();
});
