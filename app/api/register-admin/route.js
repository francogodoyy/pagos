import { db } from "@/utils/db";
import bcrypt from "bcryptjs";
import Joi from "joi";

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

export async function POST(req) {
  const body = await req.json();

  const { error } = schema.validate(body);

  if (error) {
    return new Response(error.details[0].message, {
      status: 400,
    });
  }

  const { email, password } = body;

  // Verificar cuántos admins existen
  const [admins] = await db.query(
    "SELECT COUNT(*) AS total FROM usuarios WHERE role = 'admin'"
  );

  if (admins[0].total >= 2) {
    return new Response(
      "Ya se alcanzó el límite de administradores",
      { status: 403 }
    );
  }

  // Verificar si el usuario ya existe
  const [rows] = await db.query(
    "SELECT id FROM usuarios WHERE email = ?",
    [email]
  );

  if (rows.length > 0) {
    return new Response("El usuario ya existe", {
      status: 400,
    });
  }

  // Crear admin
  const hashedPassword = await bcrypt.hash(password, 10);

  await db.query(
    "INSERT INTO usuarios (email, password, role) VALUES (?, ?, 'admin')",
    [email, hashedPassword]
  );

  return new Response(
    "Admin registrado con éxito",
    { status: 201 }
  );
}