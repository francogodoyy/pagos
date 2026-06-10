import { db } from "@/utils/db";
import bcrypt from "bcryptjs";
import Joi from "joi";

const schema = Joi.object({
  organization_name: Joi.string().max(150).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const normalizeSlug = (value) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function POST(req) {
  const body = await req.json();

  const { error } = schema.validate(body);
  if (error) {
    return new Response(error.details[0].message, {
      status: 400,
    });
  }

  const { organization_name, email, password } = body;
  const slug = normalizeSlug(organization_name) || `org-${Date.now()}`;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existingOrg] = await connection.query(
      "SELECT id FROM organizations WHERE slug = ?",
      [slug]
    );

    if (existingOrg.length > 0) {
      await connection.rollback();
      return new Response("Ya existe una organizacion con ese nombre", {
        status: 400,
      });
    }

    const [existingUser] = await connection.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      await connection.rollback();
      return new Response("El usuario ya existe", {
        status: 400,
      });
    }

    const [orgResult] = await connection.query(
      "INSERT INTO organizations (name, slug) VALUES (?, ?)",
      [organization_name.trim(), slug]
    );

    const organizationId = orgResult.insertId;
    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.query(
      "INSERT INTO usuarios (organization_id, email, password, role) VALUES (?, ?, ?, 'owner')",
      [organizationId, email, hashedPassword]
    );

    await connection.commit();

    return new Response(
      JSON.stringify({
        message: "Admin registrado con exito",
        organization_id: organizationId,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    await connection.rollback();
    return new Response("Error al registrar el usuario", { status: 500 });
  } finally {
    connection.release();
  }
}
