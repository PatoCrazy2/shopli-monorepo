import NextAuth, { type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db, Role } from "@shopli/db";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: (credentials.email as string).toLowerCase().trim(),
          },
        });

        if (!user || !user.pin_hash) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.pin_hash
        );

        if (passwordsMatch) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            empresa_id: user.empresa_id,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        const normalizedEmail = user.email.toLowerCase().trim();

        // Buscar si ya existe el usuario
        const existingUser = await db.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (existingUser) {
          // El usuario ya existe, actualizar sus datos si es necesario y asignar al objeto user
          user.id = existingUser.id;
          user.role = existingUser.role;
          user.empresa_id = existingUser.empresa_id;
        } else {
          // Crear nuevo usuario automáticamente como DUEÑO sin empresa para que pase al onboarding
          const newUser = await db.user.create({
            data: {
              name: user.name || "Usuario",
              email: normalizedEmail,
              role: Role.DUENO,
              empresa_id: null,
            },
          });
          user.id = newUser.id;
          user.role = newUser.role;
          user.empresa_id = newUser.empresa_id;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.empresa_id = user.empresa_id ?? null;
      }

      // Si el token aún no tiene empresa_id asignado, verificar en la BD si completó el onboarding
      if (token.id && !token.empresa_id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { empresa_id: true, role: true },
        });

        if (dbUser?.empresa_id) {
          token.empresa_id = dbUser.empresa_id;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.empresa_id = (token.empresa_id as string) ?? null;
      }
      return session;
    },
  },
});

