import { db } from "@/utils/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcryptjs";

function checkRole(session, allowedRoles) {
  if (!session) return false;
  return allowedRoles.includes(session.user?.role);
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!checkRole(session, ["owner", "admin"])) {
    return new Response("No autorizado", { status: 401 });
  }

  const organizationId = Number(session.user.organization_id);

  try {
    const [rows] = await db.query(
      `
        SELECT id, email, role, status, created_at
        FROM usuarios
        WHERE organization_id = ?
        ORDER BY created_at DESC
      `,
      [organizationId]
    );

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[USUARIOS GET]", err);
    return new Response("Error interno", { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!checkRole(session, ["owner"])) {
    return new Response("Solo el propietario puede crear usuarios", { status: 403 });
  }

  const organizationId = Number(session.user.organization_id);

  try {
    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
      return new Response("Faltan datos: email, password, role", { status: 400 });
    }

    if (!["admin", "assistant"].includes(role)) {
      return new Response("Rol invalido. Debe ser admin o assistant", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO usuarios (organization_id, email, password, role) VALUES (?, ?, ?, ?)`,
      [organizationId, email, hashedPassword, role]
    );

    return new Response(
      JSON.stringify({
        id: result.insertId,
        email,
        role,
        status: "active",
        message: "Usuario creado con exito",
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return new Response("El email ya esta registrado", { status: 409 });
    }
    console.error("[USUARIOS POST]", err);
    return new Response("Error interno", { status: 500 });
  }
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!checkRole(session, ["owner"])) {
    return new Response("Solo el propietario puede modificar usuarios", { status: 403 });
  }

  const organizationId = Number(session.user.organization_id);

  try {
    const { id, role, status } = await req.json();

    if (!id) return new Response("ID requerido", { status: 400 });

    const [existing] = await db.query(
      "SELECT id, role FROM usuarios WHERE id = ? AND organization_id = ?",
      [id, organizationId]
    );
    if (existing.length === 0) {
      return new Response("Usuario no encontrado", { status: 404 });
    }

    if (existing[0].role === "owner") {
      return new Response("No se puede modificar al propietario", { status: 403 });
    }

    if (role && !["admin", "assistant"].includes(role)) {
      return new Response("Rol invalido", { status: 400 });
    }
    if (status && !["active", "disabled"].includes(status)) {
      return new Response("Status invalido", { status: 400 });
    }

    const updates = [];
    const params = [];
    if (role) { updates.push("role = ?"); params.push(role); }
    if (status) { updates.push("status = ?"); params.push(status); }
    if (updates.length === 0) {
      return new Response("Nada que actualizar", { status: 400 });
    }

    params.push(id, organizationId);
    await db.query(
      `UPDATE usuarios SET ${updates.join(", ")} WHERE id = ? AND organization_id = ?`,
      params
    );

    return new Response(JSON.stringify({ message: "Usuario actualizado" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[USUARIOS PUT]", err);
    return new Response("Error interno", { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!checkRole(session, ["owner"])) {
    return new Response("Solo el propietario puede eliminar usuarios", { status: 403 });
  }

  const organizationId = Number(session.user.organization_id);

  try {
    const { id } = await req.json();
    if (!id) return new Response("ID requerido", { status: 400 });

    const [existing] = await db.query(
      "SELECT id, role FROM usuarios WHERE id = ? AND organization_id = ?",
      [id, organizationId]
    );
    if (existing.length === 0) {
      return new Response("Usuario no encontrado", { status: 404 });
    }
    if (existing[0].role === "owner") {
      return new Response("No se puede eliminar al propietario", { status: 403 });
    }

    await db.query("UPDATE usuarios SET status = 'disabled' WHERE id = ?", [id]);

    return new Response(JSON.stringify({ message: "Usuario desactivado" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[USUARIOS DELETE]", err);
    return new Response("Error interno", { status: 500 });
  }
}
