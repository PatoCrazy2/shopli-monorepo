import { AdminLoginForm } from "./AdminLoginForm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
    const session = await auth();

    if (session) {
        redirect("/");
    }

    return (
        <main className="min-h-screen grid items-center justify-center bg-gray-50 selection:bg-black selection:text-white font-sans p-4">
            <AdminLoginForm />
        </main>
    );
}
