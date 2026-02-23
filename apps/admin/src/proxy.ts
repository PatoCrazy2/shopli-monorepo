import { withAuth } from "next-auth/middleware";

export default withAuth({
    callbacks: {
        authorized({ req, token }) {
            return !!token;
        },
    },
});

export const config = {
    // Proteger por defecto solo rutas de Admin Dashboard, no afectar /api usado por el POS.
    matcher: ["/((?!api/|auth/|_next/static|_next/image|favicon.ico).*)"],
};
