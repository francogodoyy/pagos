import { db } from "@/utils/db";
import Joi from "joi";

const pagoSchema = Joi.object({
  nombre_apellido: Joi.string().max(100).required(),
  dni: Joi.string()
    .length(8)
    .pattern(/^\d{8}$/)
    .required(),
  monto: Joi.number().min(0).required(),
  fecha_pago: Joi.date().iso().required(),
  descripcion: Joi.string().max(255).optional(),
  correo: Joi.string().email().required(), // Nuevo campo
  localidad: Joi.string().max(100).required(), // Nuevo campo
  telefono: Joi.string().max(20).required(), // Nuevo campo
  direccion: Joi.string().max(255).required(), // Nuevo campo
});

export async function POST(req) {
  try {
    const data = await req.json();

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

    // Insertar en la base de datos
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
  const { searchParams } = new URL(req.url);
  const dni = searchParams.get("dni");
  const nombre_apellido = searchParams.get("nombre_apellido");
  const fechaInicio = searchParams.get("fechaInicio");
  const fechaFin = searchParams.get("fechaFin");

  let query = "SELECT * FROM pagos";
  const params = [];

  if (dni) {
    query += " WHERE dni = ?";
    params.push(dni);
  } else if (nombre_apellido) {
    query += " WHERE nombre_apellido LIKE ?";
    params.push(`%${nombre_apellido}%`);
  }

  if (fechaInicio && fechaFin) {
    query +=
      (params.length > 0 ? " AND" : " WHERE") + " fecha_pago BETWEEN ? AND ?";
    params.push(fechaInicio, fechaFin);
  }

  try {
    const [rows] = await db.query(query, params);
    return new Response(JSON.stringify(rows), { status: 200 });
  } catch (err) {
    return new Response("Error al obtener los pagos", { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return new Response("ID de pago no proporcionado", { status: 400 });
    }

    // Eliminar el pago de la base de datos
    await db.query("DELETE FROM pagos WHERE id = ?", [id]);

    return new Response("Pago eliminado con éxito", { status: 200 });
  } catch (error) {
    return new Response("Error al eliminar el pago", { status: 500 });
  }
}
