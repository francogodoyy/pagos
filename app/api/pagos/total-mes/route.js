import { db } from "@/utils/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
  const period = searchParams.get("period");

  if (!period) {
    return new Response("El parametro period es requerido (YYYY-MM)", { status: 400 });
  }

  const [periodYear, periodMonth] = period.split("-").map(Number);
  if (!Number.isInteger(periodYear) || !Number.isInteger(periodMonth)) {
    return new Response("Formato de periodo invalido. Use YYYY-MM", { status: 400 });
  }

  try {
    const [rows] = await db.query(
      `
        SELECT COALESCE(SUM(pa.amount), 0) AS total_paid
        FROM payment_allocations pa
        INNER JOIN charges c ON c.id = pa.charge_id
        WHERE c.organization_id = ?
          AND c.period_year = ?
          AND c.period_month = ?
          AND c.status != 'canceled'
      `,
      [organizationId, periodYear, periodMonth]
    );

    return new Response(
      JSON.stringify({ totalPaid: Number(rows[0]?.total_paid) || 0 }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error al obtener total del mes:", err);
    return new Response("Error interno", { status: 500 });
  }
}
