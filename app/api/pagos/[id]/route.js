import { db } from "@/utils/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getCurrentOrganizationId } from "@/utils/charges";

const editableStatuses = ["pending", "partial", "paid", "overdue", "canceled"];

const ensureAuditTable = async (connection = db) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      organization_id BIGINT UNSIGNED NOT NULL,
      entity_type VARCHAR(60) NOT NULL,
      entity_id BIGINT UNSIGNED NOT NULL,
      action VARCHAR(60) NOT NULL,
      old_data JSON NULL,
      new_data JSON NULL,
      created_by BIGINT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_audit_logs_entity (organization_id, entity_type, entity_id),
      KEY idx_audit_logs_created_at (organization_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

const insertAuditLog = async (connection, { organizationId, entityId, action, oldData, newData, userId }) => {
  await ensureAuditTable(connection);
  await connection.query(
    `
      INSERT INTO audit_logs
        (organization_id, entity_type, entity_id, action, old_data, new_data, created_by)
      VALUES (?, 'charge', ?, ?, ?, ?, ?)
    `,
    [
      organizationId,
      entityId,
      action,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
      userId || null,
    ]
  );
};

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  const organizationId = getCurrentOrganizationId(session);
  if (!organizationId) {
    return new Response("La sesion no tiene organization_id", { status: 400 });
  }

  const { id } = await params;

  try {
    const [rows] = await db.query(
      `
        SELECT
          c.id AS id,
          c.id AS id_pagos,
          c.id AS charge_id,
          c.organization_id,
          c.period_year,
          c.period_month,
          c.due_date,
          c.amount AS monto,
          c.status AS charge_status,
          c.notes AS descripcion,
          f.id AS family_id,
          f.guardian_name AS nombre_apellido,
          f.guardian_name AS guardian_name,
          f.dni,
          f.email AS correo,
          f.phone AS telefono,
          f.address AS direccion,
          f.locality AS localidad,
          s.id AS student_id,
          s.full_name AS student_name,
          co.id AS course_id,
          co.name AS course_name,
          co.level AS course_level,
          COALESCE((
            SELECT SUM(pa.amount)
            FROM payment_allocations pa
            WHERE pa.charge_id = c.id
          ), 0) AS paid_amount,
          GREATEST(
            c.amount - COALESCE((
              SELECT SUM(pa.amount)
              FROM payment_allocations pa
              WHERE pa.charge_id = c.id
            ), 0),
            0
          ) AS balance,
          COALESCE((
            SELECT MAX(p.payment_date)
            FROM payment_allocations pa
            INNER JOIN payments p ON p.id = pa.payment_id
            WHERE pa.charge_id = c.id
          ), c.due_date) AS fecha_pago
        FROM charges c
        INNER JOIN enrollments e ON e.id = c.enrollment_id
        INNER JOIN students s ON s.id = e.student_id
        INNER JOIN families f ON f.id = s.family_id
        INNER JOIN courses co ON co.id = e.course_id
        WHERE c.id = ? AND c.organization_id = ?
        LIMIT 1
      `,
      [id, organizationId]
    );

    let resultRow = rows[0] || null;

    if (!resultRow) {
      const [legacyTable] = await db.query("SHOW TABLES LIKE 'pagos'");
      if (legacyTable.length === 0) {
        return new Response("Pago no encontrado", { status: 404 });
      }

      const [legacyRows] = await db.query(
        `
          SELECT
            id_pagos,
            nombre_apellido,
            dni,
            monto,
            fecha_pago,
            descripcion,
            correo,
            localidad,
            telefono,
            direccion
          FROM pagos
          WHERE id_pagos = ?
          LIMIT 1
        `,
        [id]
      );

      if (legacyRows.length === 0) {
        return new Response("Pago no encontrado", { status: 404 });
      }

      resultRow = {
        id: legacyRows[0].id_pagos,
        id_pagos: legacyRows[0].id_pagos,
        charge_id: legacyRows[0].id_pagos,
        organization_id: organizationId,
        period_year: new Date(legacyRows[0].fecha_pago).getFullYear(),
        period_month: new Date(legacyRows[0].fecha_pago).getMonth() + 1,
        due_date: legacyRows[0].fecha_pago,
        fecha_pago: legacyRows[0].fecha_pago,
        monto: legacyRows[0].monto,
        charge_status: "paid",
        descripcion: legacyRows[0].descripcion,
        family_id: null,
        nombre_apellido: legacyRows[0].nombre_apellido,
        guardian_name: legacyRows[0].nombre_apellido,
        dni: legacyRows[0].dni,
        correo: legacyRows[0].correo,
        telefono: legacyRows[0].telefono,
        direccion: legacyRows[0].direccion,
        localidad: legacyRows[0].localidad,
        student_id: null,
        student_name: legacyRows[0].nombre_apellido,
        course_id: null,
        course_name: "Legado",
        course_level: null,
        paid_amount: legacyRows[0].monto,
        balance: 0,
      };
    }

    const [payments] = resultRow.id_pagos && rows.length > 0
      ? await db.query(
          `
            SELECT
              p.id,
              p.payment_date,
              p.amount,
              p.method,
              p.reference,
              p.notes,
              pa.amount AS allocated_amount
            FROM payment_allocations pa
            INNER JOIN payments p ON p.id = pa.payment_id
            WHERE pa.charge_id = ?
            ORDER BY p.payment_date DESC
          `,
          [id]
        )
      : [];

    await ensureAuditTable();
    const [auditLogs] = rows.length > 0
      ? await db.query(
          `
            SELECT
              al.id,
              al.action,
              al.old_data,
              al.new_data,
              al.created_at,
              u.email AS created_by_email
            FROM audit_logs al
            LEFT JOIN usuarios u ON u.id = al.created_by
            WHERE al.organization_id = ?
              AND al.entity_type = 'charge'
              AND al.entity_id = ?
            ORDER BY al.created_at DESC
            LIMIT 20
          `,
          [organizationId, id]
        )
      : [];

    return new Response(
      JSON.stringify({
        ...resultRow,
        payments,
        audit_logs: auditLogs,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response("Error al obtener el pago", { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  const organizationId = getCurrentOrganizationId(session);
  if (!organizationId) {
    return new Response("La sesion no tiene organization_id", { status: 400 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const amount = Number(body.monto ?? body.amount);
    const dueDate = body.due_date;
    const notes = body.descripcion ?? body.notes ?? null;
    const status = body.status || body.charge_status;

    if (!Number.isFinite(amount) || amount < 0) {
      return new Response("El monto no es valido", { status: 400 });
    }

    if (!dueDate || Number.isNaN(new Date(dueDate).getTime())) {
      return new Response("La fecha de vencimiento no es valida", { status: 400 });
    }

    if (status && !editableStatuses.includes(status)) {
      return new Response("El estado no es valido", { status: 400 });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [rows] = await connection.query(
        `
          SELECT id, amount, due_date, status, notes
          FROM charges
          WHERE id = ? AND organization_id = ?
          LIMIT 1
        `,
        [id, organizationId]
      );

      if (rows.length === 0) {
        await connection.rollback();
        return new Response("Pago no encontrado", { status: 404 });
      }

      const oldData = rows[0];
      const normalizedDate = new Date(dueDate).toISOString().slice(0, 10);
      const nextData = {
        amount,
        due_date: normalizedDate,
        status: status || oldData.status,
        notes,
      };

      await connection.query(
        `
          UPDATE charges
          SET amount = ?,
              due_date = ?,
              status = ?,
              notes = ?
          WHERE id = ? AND organization_id = ?
        `,
        [nextData.amount, nextData.due_date, nextData.status, nextData.notes, id, organizationId]
      );

      await insertAuditLog(connection, {
        organizationId,
        entityId: Number(id),
        action: "updated",
        oldData,
        newData: nextData,
        userId: session.user.id,
      });

      await connection.commit();

      return new Response(JSON.stringify({ message: "Cuota actualizada" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      await connection.rollback();
      return new Response("Error al actualizar el pago", { status: 500 });
    } finally {
      connection.release();
    }
  } catch (error) {
    return new Response("Error al actualizar el pago", { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  const organizationId = getCurrentOrganizationId(session);
  if (!organizationId) {
    return new Response("La sesion no tiene organization_id", { status: 400 });
  }

  const { id } = await params;

  try {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [rows] = await connection.query(
        "SELECT id, amount, due_date, status, notes FROM charges WHERE id = ? AND organization_id = ? LIMIT 1",
        [id, organizationId]
      );

      if (rows.length === 0) {
        await connection.rollback();
        return new Response("Pago no encontrado", { status: 404 });
      }

      await connection.query(
        "UPDATE charges SET status = 'canceled' WHERE id = ? AND organization_id = ?",
        [id, organizationId]
      );

      await insertAuditLog(connection, {
        organizationId,
        entityId: Number(id),
        action: "canceled",
        oldData: rows[0],
        newData: { ...rows[0], status: "canceled" },
        userId: session.user.id,
      });

      await connection.commit();
      return new Response("Pago cancelado con exito", { status: 200 });
    } catch (error) {
      await connection.rollback();
      return new Response("Error al cancelar el pago", { status: 500 });
    } finally {
      connection.release();
    }
  } catch (error) {
    return new Response("Error al cancelar el pago", { status: 500 });
  }
}
