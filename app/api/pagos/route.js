import { db } from "@/utils/db";
import Joi from "joi";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const pagoSchema = Joi.object({
  nombre_apellido: Joi.string().max(100).required(),
  dni: Joi.string()
    .length(8)
    .pattern(/^\d{8}$/)
    .required(),
  monto: Joi.number().min(0).required(),
  fecha_pago: Joi.date().iso().required(),
  descripcion: Joi.string().max(255).optional(),
  correo: Joi.string().email().required(),
  localidad: Joi.string().max(100).required(),
  telefono: Joi.string().max(20).required(),
  direccion: Joi.string().max(255).required(),
});

export async function POST(req) {
  // Verificar sesión
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  try {
    const data = await req.json();
    console.log("Data recibida:", data);

    const { error, value } = pagoSchema.validate(data);
    if (error) {
      return new Response(`Error de validación: ${error.message}`, {
        status: 400,
      });
    }

    const {
      dni,
      nombre_apellido,
      monto,
      fecha_pago,
      descripcion,
      correo,
      localidad,
      telefono,
      direccion,
    } = value;

    await db.query(
      "INSERT INTO pagos (nombre_apellido, dni, monto, fecha_pago, descripcion, correo, localidad, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        nombre_apellido,
        dni,
        monto,
        fecha_pago,
        descripcion,
        correo,
        localidad,
        telefono,
        direccion,
      ]
    );
    return new Response("Pago registrado con éxito", { status: 201 });
  } catch (error) {
    return new Response("Error interno en el servidor", { status: 500 });
  }
}

export async function GET(req) {
  // Verificar sesión
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dni = searchParams.get("dni");
  const nombre_apellido = searchParams.get("nombre_apellido");
  const fechaInicio = searchParams.get("fechaInicio");
  const limit = parseInt(searchParams.get("limit")) || 50;
  const offset = parseInt(searchParams.get("offset")) || 0;

  let query = "SELECT * FROM pagos";
  const params = [];

  if (dni) {
    query += " WHERE dni = ?";
    params.push(dni);
  } else if (nombre_apellido) {
    query += " WHERE nombre_apellido LIKE ?";
    params.push(`%${nombre_apellido}%`);
  }

  if (fechaInicio) {
    query += (params.length > 0 ? " AND" : " WHERE") + " DATE(fecha_pago) = ?";
    params.push(fechaInicio);
  }

  // Paginación
  query += " LIMIT ? OFFSET ?";
  params.push(limit, offset);

  try {
    const [rows] = await db.query(query, params);
    return new Response(JSON.stringify(rows), { status: 200 });
  } catch (err) {
    return new Response("Error al obtener los pagos", { status: 500 });
  }
}

export async function DELETE(req) {
  // Verificar sesión
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return new Response("ID de pago no proporcionado", { status: 400 });
    }

    // 
    await db.query("DELETE FROM pagos WHERE id_pagos = ?", [id]);

    return new Response("Pago eliminado con éxito", { status: 200 });
  } catch (error) {
    return new Response("Error al eliminar el pago", { status: 500 });
  }
}