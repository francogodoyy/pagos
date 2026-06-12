import { db } from "@/utils/db";
import Joi from "joi";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendEmail } from "@/utils/email";
import { receiptTemplate } from "@/utils/email-templates";

const paymentSchema = Joi.object({
  guardian_name: Joi.string().max(150).allow("", null).optional(),
  nombre_apellido: Joi.string().max(150).allow("", null).optional(),
  student_name: Joi.string().max(150).allow("", null).optional(),
  course_name: Joi.string().max(150).allow("", null).optional(),
  course_level: Joi.string().max(100).allow("", null).optional(),
  family_id: Joi.number().integer().positive().allow(null).optional(),
  student_id: Joi.number().integer().positive().allow(null).optional(),
  course_id: Joi.number().integer().positive().allow(null).optional(),
  dni: Joi.string().max(20).required(),
  monto: Joi.number().min(0).required(),
  payment_date: Joi.string().isoDate().allow("", null).optional(),
  fecha_pago: Joi.string().isoDate().allow("", null).optional(),
  due_date: Joi.string().isoDate().allow("", null).optional(),
  period_year: Joi.number().integer().min(2000).max(2100).optional(),
  period_month: Joi.number().integer().min(1).max(12).optional(),
  descripcion: Joi.string().max(500).allow("", null).optional(),
  notes: Joi.string().max(500).allow("", null).optional(),
  correo: Joi.string().email().allow("", null).optional(),
  email: Joi.string().email().allow("", null).optional(),
  telefono: Joi.string().max(30).allow("", null).optional(),
  phone: Joi.string().max(30).allow("", null).optional(),
  direccion: Joi.string().max(255).allow("", null).optional(),
  address: Joi.string().max(255).allow("", null).optional(),
  localidad: Joi.string().max(120).allow("", null).optional(),
  locality: Joi.string().max(120).allow("", null).optional(),
  method: Joi.string().valid("cash", "transfer", "card", "debit", "other").optional(),
  reference: Joi.string().max(120).allow("", null).optional(),
});

const pickFirst = (...values) => values.find((value) => value !== undefined && value !== null && value !== "");

const parseDateTime = (value) => {
  if (!value) return new Date();
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const toMysqlDateTime = (date) => {
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const getPeriodFromDate = (date) => ({
  period_year: date.getFullYear(),
  period_month: date.getMonth() + 1,
});

const buildChargeStatus = (chargeAmount, paidAmount, dueDate) => {
  const now = new Date();
  const due = dueDate ? new Date(dueDate) : null;
  const overdue = due && !Number.isNaN(due.getTime()) && due < now;

  if (paidAmount >= chargeAmount) return "paid";
  if (paidAmount > 0) return overdue ? "overdue" : "partial";
  return overdue ? "overdue" : "pending";
};

const getCurrentOrganizationId = (session) => {
  const organizationId = session?.user?.organization_id;
  return organizationId ? Number(organizationId) : null;
};

const getPaymentSummaryQuery = (whereClause = "", extraParams = []) => {
  const sql = `
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
      (
        SELECT MAX(p.payment_date)
        FROM payment_allocations pa
        INNER JOIN payments p ON p.id = pa.payment_id
        WHERE pa.charge_id = c.id
      ) AS fecha_pago,
      (
        SELECT p.method
        FROM payment_allocations pa
        INNER JOIN payments p ON p.id = pa.payment_id
        WHERE pa.charge_id = c.id
        ORDER BY p.payment_date DESC
        LIMIT 1
      ) AS method,
      (
        SELECT p.reference
        FROM payment_allocations pa
        INNER JOIN payments p ON p.id = pa.payment_id
        WHERE pa.charge_id = c.id
        ORDER BY p.payment_date DESC
        LIMIT 1
      ) AS reference,
      (
        SELECT p.notes
        FROM payment_allocations pa
        INNER JOIN payments p ON p.id = pa.payment_id
        WHERE pa.charge_id = c.id
        ORDER BY p.payment_date DESC
        LIMIT 1
      ) AS payment_notes
    FROM charges c
    INNER JOIN enrollments e ON e.id = c.enrollment_id
    INNER JOIN students s ON s.id = e.student_id
    INNER JOIN families f ON f.id = s.family_id
    INNER JOIN courses co ON co.id = e.course_id
    ${whereClause}
    ORDER BY c.due_date DESC, c.id DESC
  `;

  return { sql, params: extraParams };
};

async function sendEmailReceipt({ organizationId, chargeId, paymentId, chargeStatus, chargeAmount, newPaid, allocationAmount, method }) {
  try {
    const [rows] = await db.query(
      `
        SELECT
          f.email, f.guardian_name, s.full_name AS student_name,
          co.name AS course_name, c.period_year, c.period_month,
          c.due_date, o.name AS org_name
        FROM charges c
        INNER JOIN enrollments e ON e.id = c.enrollment_id
        INNER JOIN students s ON s.id = e.student_id
        INNER JOIN families f ON f.id = s.family_id
        INNER JOIN courses co ON co.id = e.course_id
        INNER JOIN organizations o ON o.id = c.organization_id
        WHERE c.id = ? AND c.organization_id = ?
        LIMIT 1
      `,
      [chargeId, organizationId]
    );

    if (!rows[0]?.email) return;

    const charge = rows[0];
    const periodLabel = `${String(charge.period_month).padStart(2, "0")}/${charge.period_year}`;
    const rawDate = charge.due_date;
    let dueDate = "Sin fecha";
    if (rawDate) {
      const d = rawDate instanceof Date ? rawDate : new Date(rawDate);
      if (!Number.isNaN(d.getTime())) {
        dueDate = new Intl.DateTimeFormat("es-ES", {
          day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
        }).format(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
      }
    }

    const html = receiptTemplate({
      guardianName: charge.guardian_name,
      studentName: charge.student_name,
      courseName: charge.course_name,
      periodLabel,
      monto: chargeAmount,
      paidAmount: newPaid,
      balance: Math.max(chargeAmount - newPaid, 0),
      chargeStatus,
      method,
      dueDate,
      pagoId: paymentId,
      orgName: charge.org_name,
    });

    await sendEmail({
      to: charge.email,
      subject: `Comprobante de pago - ${charge.student_name} - ${periodLabel}`,
      html,
    });
  } catch (err) {
    console.error("[EMAIL RECEIPT ERROR]", err);
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  const organizationId = getCurrentOrganizationId(session);
  if (!organizationId) {
    return new Response("La sesion no tiene organization_id", { status: 400 });
  }

  try {
    const data = await req.json();
    const { error, value } = paymentSchema.validate(data, { stripUnknown: true });

    if (error) {
      return new Response(`Error de validacion: ${error.message}`, { status: 400 });
    }

    const guardianName = pickFirst(value.guardian_name, value.nombre_apellido, value.student_name);
    const studentName = pickFirst(value.student_name, value.nombre_apellido, value.guardian_name, value.dni);
    const courseName = pickFirst(value.course_name, "Curso general");
    const courseLevel = pickFirst(value.course_level, null);
    const email = pickFirst(value.email, value.correo, null);
    const phone = pickFirst(value.phone, value.telefono, null);
    const address = pickFirst(value.address, value.direccion, null);
    const locality = pickFirst(value.locality, value.localidad, null);
    const notes = pickFirst(value.notes, value.descripcion, null);
    const method = pickFirst(value.method, "cash");
    const reference = pickFirst(value.reference, null);

    const paymentDate = parseDateTime(pickFirst(value.payment_date, value.fecha_pago));
    const dueDate = parseDateTime(pickFirst(value.due_date, value.payment_date, value.fecha_pago));
    const period = {
      ...getPeriodFromDate(dueDate),
      ...(value.period_year ? { period_year: Number(value.period_year) } : {}),
      ...(value.period_month ? { period_month: Number(value.period_month) } : {}),
    };

    const amount = Number(value.monto);
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      let familyId = value.family_id ? Number(value.family_id) : null;
      let familyRows = [];

      if (familyId) {
        [familyRows] = await connection.query(
          "SELECT * FROM families WHERE organization_id = ? AND id = ? LIMIT 1",
          [organizationId, familyId]
        );
      } else {
        [familyRows] = await connection.query(
          "SELECT * FROM families WHERE organization_id = ? AND dni = ? LIMIT 1",
          [organizationId, value.dni]
        );
      }

      if (familyRows.length > 0) {
        familyId = familyRows[0].id;
        await connection.query(
          `
            UPDATE families
            SET guardian_name = COALESCE(?, guardian_name),
                email = COALESCE(?, email),
                phone = COALESCE(?, phone),
                address = COALESCE(?, address),
                locality = COALESCE(?, locality),
                notes = COALESCE(?, notes)
            WHERE id = ?
          `,
          [guardianName, email, phone, address, locality, notes, familyId]
        );
      } else {
        const [familyResult] = await connection.query(
          `
            INSERT INTO families
              (organization_id, guardian_name, dni, email, phone, address, locality, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [organizationId, guardianName || value.dni, value.dni, email, phone, address, locality, notes]
        );
        familyId = familyResult.insertId;
      }

      let studentId = value.student_id ? Number(value.student_id) : null;
      let studentRows = [];

      if (studentId) {
        [studentRows] = await connection.query(
          "SELECT * FROM students WHERE organization_id = ? AND id = ? LIMIT 1",
          [organizationId, studentId]
        );
      } else {
        [studentRows] = await connection.query(
          "SELECT * FROM students WHERE organization_id = ? AND family_id = ? AND full_name = ? LIMIT 1",
          [organizationId, familyId, studentName]
        );
      }

      if (studentRows.length > 0) {
        studentId = studentRows[0].id;
        if (!value.family_id && studentRows[0].family_id) {
          familyId = studentRows[0].family_id;
        }
      } else {
        const [studentResult] = await connection.query(
          "INSERT INTO students (organization_id, family_id, full_name, active) VALUES (?, ?, ?, 1)",
          [organizationId, familyId, studentName]
        );
        studentId = studentResult.insertId;
      }

      let courseId = value.course_id ? Number(value.course_id) : null;
      let courseRows = [];

      if (courseId) {
        [courseRows] = await connection.query(
          "SELECT * FROM courses WHERE organization_id = ? AND id = ? LIMIT 1",
          [organizationId, courseId]
        );
      } else {
        [courseRows] = await connection.query(
          "SELECT * FROM courses WHERE organization_id = ? AND name = ? LIMIT 1",
          [organizationId, courseName]
        );
      }

      if (courseRows.length > 0) {
        courseId = courseRows[0].id;
        await connection.query(
          `
            UPDATE courses
            SET level = COALESCE(?, level),
                monthly_fee = CASE WHEN ? IS NULL THEN monthly_fee ELSE ? END
            WHERE id = ?
          `,
          [courseLevel, amount, amount, courseId]
        );
      } else {
        const [courseResult] = await connection.query(
          `
            INSERT INTO courses (organization_id, name, level, monthly_fee, billing_day, active)
            VALUES (?, ?, ?, ?, 1, 1)
          `,
          [organizationId, courseName, courseLevel, amount]
        );
        courseId = courseResult.insertId;
      }

      const [enrollmentRows] = await connection.query(
        `
          SELECT *
          FROM enrollments
          WHERE organization_id = ? AND student_id = ? AND course_id = ? AND status = 'active'
          LIMIT 1
        `,
        [organizationId, studentId, courseId]
      );

      let enrollmentId;
      if (enrollmentRows.length > 0) {
        enrollmentId = enrollmentRows[0].id;
      } else {
        const [enrollmentResult] = await connection.query(
          `
            INSERT INTO enrollments (organization_id, student_id, course_id, start_date, status)
            VALUES (?, ?, ?, CURDATE(), 'active')
          `,
          [organizationId, studentId, courseId]
        );
        enrollmentId = enrollmentResult.insertId;
      }

      const [chargeRows] = await connection.query(
        `
          SELECT *
          FROM charges
          WHERE enrollment_id = ? AND period_year = ? AND period_month = ?
          LIMIT 1
        `,
        [enrollmentId, period.period_year, period.period_month]
      );

      let chargeId;
      if (chargeRows.length > 0) {
        chargeId = chargeRows[0].id;
        await connection.query(
          `
            UPDATE charges
            SET due_date = COALESCE(?, due_date),
                amount = ?,
                notes = COALESCE(?, notes)
            WHERE id = ?
          `,
          [toMysqlDateTime(dueDate).split(" ")[0], amount, notes, chargeId]
        );
      } else {
        const [chargeResult] = await connection.query(
          `
            INSERT INTO charges
              (organization_id, enrollment_id, period_year, period_month, due_date, amount, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
          `,
          [organizationId, enrollmentId, period.period_year, period.period_month, toMysqlDateTime(dueDate).split(" ")[0], amount, notes]
        );
        chargeId = chargeResult.insertId;
      }

      const paymentDateSql = toMysqlDateTime(paymentDate);
      const [paymentResult] = await connection.query(
        `
          INSERT INTO payments
            (organization_id, family_id, payment_date, amount, method, reference, notes, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          organizationId,
          familyId,
          paymentDateSql,
          amount,
          method,
          reference,
          notes,
          session.user.id || null,
        ]
      );

      const paymentId = paymentResult.insertId;
      const [chargeDetailRows] = await connection.query(
        "SELECT amount, due_date FROM charges WHERE id = ? LIMIT 1",
        [chargeId]
      );
      const chargeAmount = Number(chargeDetailRows[0].amount);

      const [paidRows] = await connection.query(
        "SELECT COALESCE(SUM(amount), 0) AS total_paid FROM payment_allocations WHERE charge_id = ?",
        [chargeId]
      );
      const currentPaid = Number(paidRows[0].total_paid);
      const allocationAmount = Math.min(amount, Math.max(chargeAmount - currentPaid, 0));

      await connection.query(
        "INSERT INTO payment_allocations (payment_id, charge_id, amount) VALUES (?, ?, ?)",
        [paymentId, chargeId, allocationAmount]
      );

      const newPaid = currentPaid + allocationAmount;
      const chargeStatus = buildChargeStatus(chargeAmount, newPaid, chargeDetailRows[0].due_date);
      await connection.query("UPDATE charges SET status = ? WHERE id = ?", [chargeStatus, chargeId]);

      await connection.commit();

      sendEmailReceipt({
        organizationId,
        chargeId,
        paymentId,
        chargeStatus,
        chargeAmount,
        newPaid,
        allocationAmount,
        method,
      });

      return new Response(
        JSON.stringify({
          message: "Pago registrado con exito",
          organization_id: organizationId,
          family_id: familyId,
          student_id: studentId,
          course_id: courseId,
          enrollment_id: enrollmentId,
          charge_id: chargeId,
          payment_id: paymentId,
          allocated_amount: allocationAmount,
          status: chargeStatus,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      await connection.rollback();
      console.error("Error al registrar el pago:", error);
      return new Response("Error interno en el servidor", { status: 500 });
    } finally {
      connection.release();
    }
  } catch (error) {
    return new Response("Error interno en el servidor", { status: 500 });
  }
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  const organizationId = getCurrentOrganizationId(session);
  if (!organizationId) {
    return new Response("La sesion no tiene organization_id", { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const dni = searchParams.get("dni");
  const guardianName = searchParams.get("guardian_name") || searchParams.get("nombre_apellido");
  const studentName = searchParams.get("student_name");
  const courseName = searchParams.get("course_name");
  const status = searchParams.get("status");
  const fechaInicio = searchParams.get("fechaInicio");
  const period = searchParams.get("period");
  const limit = Number.parseInt(searchParams.get("limit")) || 50;
  const offset = Number.parseInt(searchParams.get("offset")) || 0;

  const conditions = ["c.organization_id = ?"];
  const params = [organizationId];

  if (dni) {
    conditions.push("f.dni = ?");
    params.push(dni);
  }

  if (guardianName) {
    conditions.push("f.guardian_name LIKE ?");
    params.push(`%${guardianName}%`);
  }

  if (studentName) {
    conditions.push("s.full_name LIKE ?");
    params.push(`%${studentName}%`);
  }

  if (courseName) {
    conditions.push("co.name LIKE ?");
    params.push(`%${courseName}%`);
  }

  if (status) {
    conditions.push("c.status = ?");
    params.push(status);
  }

  if (fechaInicio) {
    conditions.push("DATE(c.due_date) = ?");
    params.push(fechaInicio);
  }

  if (period) {
    const [periodYear, periodMonth] = period.split("-").map(Number);
    if (Number.isInteger(periodYear) && Number.isInteger(periodMonth)) {
      conditions.push("c.period_year = ? AND c.period_month = ?");
      params.push(periodYear, periodMonth);
    }
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const { sql, params: queryParams } = getPaymentSummaryQuery(whereClause, params);

  const paginatedSql = `${sql} LIMIT ? OFFSET ?`;

  try {
    const countSql = `
      SELECT COUNT(*) AS total
      FROM charges c
      INNER JOIN enrollments e ON e.id = c.enrollment_id
      INNER JOIN students s ON s.id = e.student_id
      INNER JOIN families f ON f.id = s.family_id
      INNER JOIN courses co ON co.id = e.course_id
      ${whereClause}
    `;

    const [countRows] = await db.query(countSql, params);
    const total = Number(countRows[0]?.total) || 0;

    queryParams.push(limit, offset);
    const [rows] = await db.query(paginatedSql, queryParams);
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    return new Response(
      JSON.stringify({
        items: rows,
        total,
        limit,
        offset,
        totalPages,
        hasMore: offset + rows.length < total,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error al obtener los pagos:", err);
    return new Response("Error al obtener los pagos", { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  const organizationId = getCurrentOrganizationId(session);
  if (!organizationId) {
    return new Response("La sesion no tiene organization_id", { status: 400 });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return new Response("ID no proporcionado", { status: 400 });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [chargeRows] = await connection.query(
        "SELECT id FROM charges WHERE id = ? AND organization_id = ? LIMIT 1",
        [id, organizationId]
      );

      if (chargeRows.length === 0) {
        await connection.rollback();
        return new Response("Pago no encontrado", { status: 404 });
      }

      await connection.query("DELETE FROM charges WHERE id = ?", [id]);
      await connection.commit();

      return new Response("Pago eliminado con exito", { status: 200 });
    } catch (error) {
      await connection.rollback();
      return new Response("Error al eliminar el pago", { status: 500 });
    } finally {
      connection.release();
    }
  } catch (error) {
    return new Response("Error al eliminar el pago", { status: 500 });
  }
}
