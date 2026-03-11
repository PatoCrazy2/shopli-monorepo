import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { pathname } = req.nextUrl;

    const isLoginPage = pathname === "/login";
    const isDashboardRoute = pathname.startsWith("/dashboard");

    // Si hay sesión y está en /login -> redirect a /dashboard
    if (isLoginPage) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        return NextResponse.next();
    }

    // Role verification (Only DUENO and ENCARGADO can access the Dashboard)
    // Se toma req.auth.user.role porque req.auth es la sesion y hemos extendido Session en types
    if (isDashboardRoute && isLoggedIn) {
        // En Auth.js v5 beta req.auth type contains our User session, including role defined in types
        const userRole = (req.auth as any)?.user?.role;
        if (userRole && userRole !== "DUEÑO" && userRole !== "ENCARGADO") {
            // El CAJERO o un rol no válido no deben poder entrar al dashboard
            return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
        }
    }

    // Si no hay sesión -> redirect a /login para rutas protegidas
    if (isDashboardRoute) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL("/login", req.url));
        }
    }

    return NextResponse.next();
});

export const config = {
    // Excluimos explícitamente las rutas internas de Next.js, archivos estáticos y /api/auth/* para evitar bucles.
    // Omitimos excluir '/login' de este matcher para que el middleware logre capturar la ruta 
    // y accionar la redirección a /dashboard cuando ya hay sesión.
    matcher: ["/((?!api/auth|api/pos|_next/static|_next/image|favicon.ico).*)"],
};

