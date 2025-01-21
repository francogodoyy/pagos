import {db} from "@/utils/db";
import bcrypt from "bcryptjs";


export async function POST(req) {
    if (process.env.NODE_ENV === "production") {
        return new Response("Prohibido en producción", { status: 403});
    }

    const {email, password } = await req.json();

    //verificar que no exista un usuario con el mismo correo

    const [existingUser] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    if (existingUser.length > 0 ) {
        return new Response("El usuario ya existe", {status: 400 });
    }

    //Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    //Insert new user as admin
    await db.query("INSERT INTO usuarios (email, password, role) VALUES (?, ?, 'admin')", [email, hashedPassword,]);

    return new Response("Admin registrado con exito", {status: 201});

  
}