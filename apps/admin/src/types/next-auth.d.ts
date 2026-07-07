import { DefaultSession } from "next-auth";
import { Role } from "@shopli/db";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: Role;
            empresa_id: string;
        } & DefaultSession["user"];
    }

    interface User {
        id?: string;
        role?: Role;
        empresa_id?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        role?: Role;
        empresa_id?: string;
    }
}
