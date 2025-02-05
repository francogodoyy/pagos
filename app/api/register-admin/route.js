import { db } from "@/utils/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
    if (process.env.NODE_ENV === "production") {
        return new Response("Prohibido en producción", { status: 403 });
    }

    const { email, password } = await req.json();

    // Verificar si el usuario ya existe
    const [rows] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    if (rows.length > 0) { 
        return new Response("El usuario ya existe", { status: 400 });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo usuario como admin
    await db.query("INSERT INTO usuarios (email, password, role) VALUES (?, ?, 'admin')", 
        [email, hashedPassword]
    );

    return new Response("Admin registrado con éxito", { status: 201 });
}
