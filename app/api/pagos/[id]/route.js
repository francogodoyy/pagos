import { db } from "@/utils/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  const { id } = await params;

  try {
    const [rows] = await db.query("SELECT * FROM pagos WHERE id_pagos = ?", [id]);

    if (rows.length === 0) {
      return new Response("Pago no encontrado", { status: 404 });
    }

    return new Response(JSON.stringify(rows[0]), { status: 200 });
  } catch (error) {
    return new Response("Error al obtener el pago", { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  const { id } = await params;

  try {
    await db.query("DELETE FROM pagos WHERE id_pagos = ?", [id]);
    return new Response("Pago eliminado con éxito", { status: 200 });
  } catch (error) {
    return new Response("Error al eliminar el pago", { status: 500 });
  }
}