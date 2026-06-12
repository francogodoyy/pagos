import { db } from "@/utils/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import * as XLSX from "xlsx";

const statusLabels = {
  paid: "Pagado",
  partial: "Parcial",
  pending: "Pendiente",
  overdue: "Vencido",
  canceled: "Cancelado",
};

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  const organizationId = session?.user?.organization_id
    ? Number(session.user.organization_id)
    : null;
  if (!organizationId) {
    return new Response("La sesion no tiene organization_id", { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const dni = searchParams.get("dni");
  const guardianName = searchParams.get("guardian_name");
  const courseName = searchParams.get("course_name");
  const status = searchParams.get("status");
  const period = searchParams.get("period");

  const conditions = ["c.organization_id = ?"];
  const params = [organizationId];

  if (dni) { conditions.push("f.dni = ?"); params.push(dni); }
  if (guardianName) { conditions.push("f.guardian_name LIKE ?"); params.push(`%${guardianName}%`); }
  if (courseName) { conditions.push("co.name LIKE ?"); params.push(`%${courseName}%`); }
  if (status) { conditions.push("c.status = ?"); params.push(status); }
  if (period) {
    const [periodYear, periodMonth] = period.split("-").map(Number);
    if (Number.isInteger(periodYear) && Number.isInteger(periodMonth)) {
      conditions.push("c.period_year = ? AND c.period_month = ?");
      params.push(periodYear, periodMonth);
    }
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  try {
    const [rows] = await db.query(
      `
        SELECT
          f.guardian_name AS responsable,
          f.dni,
          s.full_name AS alumno,
          co.name AS curso,
          co.level AS nivel,
          CONCAT(LPAD(c.period_month, 2, '0'), '/', c.period_year) AS periodo,
          c.due_date AS vencimiento,
          c.amount AS monto,
          COALESCE((
            SELECT SUM(pa.amount)
            FROM payment_allocations pa
            WHERE pa.charge_id = c.id
          ), 0) AS cobrado,
          GREATEST(c.amount - COALESCE((
            SELECT SUM(pa.amount)
            FROM payment_allocations pa
            WHERE pa.charge_id = c.id
          ), 0), 0) AS saldo,
          c.status AS estado
        FROM charges c
        INNER JOIN enrollments e ON e.id = c.enrollment_id
        INNER JOIN students s ON s.id = e.student_id
        INNER JOIN families f ON f.id = s.family_id
        INNER JOIN courses co ON co.id = e.course_id
        ${whereClause}
        ORDER BY c.due_date DESC, c.id DESC
      `,
      params
    );

    const data = rows.map((r) => ({
      Responsable: r.responsable,
      DNI: r.dni,
      Alumno: r.alumno,
      Curso: r.curso,
      Nivel: r.nivel || "",
      Periodo: r.periodo,
      Vencimiento: r.vencimiento ? new Date(r.vencimiento).toLocaleDateString("es-ES") : "",
      Monto: Number(r.monto),
      Cobrado: Number(r.cobrado),
      Saldo: Number(r.saldo),
      Estado: statusLabels[r.estado] || r.estado,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    const colWidths = [
      { wch: 25 }, { wch: 14 }, { wch: 25 }, { wch: 18 },
      { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 14 },
    ];
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Cuotas");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const filename = `cuotas_${new Date().toISOString().split("T")[0]}.xlsx`;

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[EXPORT ERROR]", err);
    return new Response("Error al exportar", { status: 500 });
  }
}
