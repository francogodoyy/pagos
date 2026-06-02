import { db } from "@/utils/db";
import bcrypt from "bcryptjs";
import Joi from "joi";

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

export async function POST(req) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Prohibido en producción", { status: 403 });
  }

  const body = await req.json();

  const { error } = schema.validate(body);
  if (error) {
    return new Response(error.details[0].message, { status: 400 });
  }

  const { email, password } = body;

  const [rows] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
  if (rows.length > 0) {
    return new Response("El usuario ya existe", { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.query("INSERT INTO usuarios (email, password, role) VALUES (?, ?, 'admin')",
    [email, hashedPassword]
  );

  return new Response("Admin registrado con éxito", { status: 201 });
}

//función para limitar admins
const [rows] = await db.query("SELECT COUNT(*) as total from usuarios");
const total = rows[0].total;

if (total >=2 ){
  return new Response("Límite de administradores alcazado", { status: 403 });
}