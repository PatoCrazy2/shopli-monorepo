import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Role } from "@shopli/db";

export default async function proxy(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");

    // Si no hay token y no es página de login, redirige a /login limpia
    if (!token && !isAuthPage) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.search = ""; // Asegura limpieza absoluta
        return NextResponse.redirect(loginUrl);
    }

    // Si ya estamos en login pero trae callbackUrl sucio, lo limpiamos y recargamos
    if (!token && isAuthPage && req.nextUrl.search) {
        const cleanLoginUrl = new URL("/login", req.url);
        cleanLoginUrl.search = "";
        return NextResponse.redirect(cleanLoginUrl);
    }

    // Role verification according to core.md (DUEÑO and ENCARGADO only)
    if (token && token.role !== Role.DUENO && token.role !== Role.ENCARGADO) {
        // Si de alguna manera alguien entró con rol bloqueado, limparlo o mandarlo lejos.
        // Al POS no tiene acceso porque es otro app, pero no podemos dejarlo aquí.
        return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    }

    // Si hay token válido (DUEÑO/ENCARGADO) y estamos en /login, no lo dejes entrar al login de nuevo
    if (token && isAuthPage) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}

export const config = {
    // Proteger por defecto solo rutas de Admin Dashboard, no afectar /api usado por el POS.
    matcher: ["/((?!api/|auth/|_next/static|_next/image|favicon.ico).*)"],
};
