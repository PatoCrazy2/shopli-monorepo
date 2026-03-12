import { db } from "@shopli/db";
import bcrypt from "bcryptjs";

async function main() {
    const password = "1234";
    const salt = await bcrypt.genSalt(10);
    const pin_hash = await bcrypt.hash(password, salt);

    const useRole = "DUENO"; // Based on @map("DUEÑO") in schema

    const user = await db.user.upsert({
        where: { email: "admin@shopli.com" },
        update: {
            pin_hash: pin_hash,
            role: "DUENO", // Or whatever the valid TS enum is "DUENO"
            name: "Admin Dueño"
        },
        create: {
            email: "admin@shopli.com",
            pin_hash: pin_hash,
            role: "DUENO",
            name: "Admin Dueño"
        }
    });

    console.log("Seeded user:", user);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
