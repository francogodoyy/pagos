import { db } from "@/utils/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("No autorizado", { status: 401 });

  const organizationId = session.user?.organization_id
    ? Number(session.user.organization_id)
    : null;
  if (!organizationId)
    return new Response("La sesion no tiene organization_id", { status: 400 });

  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const [collectedRows] = await db.query(
      `
        SELECT COALESCE(SUM(pa.amount), 0) AS total
        FROM payment_allocations pa
        INNER JOIN charges c ON c.id = pa.charge_id
        WHERE c.organization_id = ?
          AND c.period_year = ?
          AND c.period_month = ?
          AND c.status != 'canceled'
      `,
      [organizationId, currentYear, currentMonth]
    );

    const [pendingRows] = await db.query(
      `
        SELECT COALESCE(SUM(c.amount - COALESCE(paid.paid, 0)), 0) AS total
        FROM charges c
        LEFT JOIN (
          SELECT charge_id, SUM(amount) AS paid
          FROM payment_allocations
          GROUP BY charge_id
        ) paid ON paid.charge_id = c.id
        WHERE c.organization_id = ?
          AND c.status IN ('pending', 'partial', 'overdue')
      `,
      [organizationId]
    );

    const [overdueRows] = await db.query(
      `
        SELECT COALESCE(SUM(c.amount - COALESCE(paid.paid, 0)), 0) AS total
        FROM charges c
        LEFT JOIN (
          SELECT charge_id, SUM(amount) AS paid
          FROM payment_allocations
          GROUP BY charge_id
        ) paid ON paid.charge_id = c.id
        WHERE c.organization_id = ?
          AND c.status = 'overdue'
      `,
      [organizationId]
    );

    const [studentRows] = await db.query(
      "SELECT COUNT(*) AS total FROM students WHERE organization_id = ? AND active = 1",
      [organizationId]
    );

    const [historyRows] = await db.query(
      `
        SELECT c.period_year, c.period_month, COALESCE(SUM(pa.amount), 0) AS total
        FROM charges c
        LEFT JOIN payment_allocations pa ON pa.charge_id = c.id
        WHERE c.organization_id = ?
          AND (c.period_year > ? OR (c.period_year = ? AND c.period_month >= ?))
          AND c.status != 'canceled'
        GROUP BY c.period_year, c.period_month
        ORDER BY c.period_year ASC, c.period_month ASC
      `,
      [
        organizationId,
        currentYear - 1,
        currentYear,
        currentMonth,
      ]
    );

    let monthlyHistory = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const found = historyRows.find(
        (r) => r.period_year === y && r.period_month === m
      );
      monthlyHistory.push({
        year: y,
        month: m,
        label: `${String(m).padStart(2, "0")}/${y}`,
        total: found ? Number(found.total) : 0,
      });
    }

    const [statusRows] = await db.query(
      `
        SELECT c.status, COUNT(*) AS count
        FROM charges c
        WHERE c.organization_id = ?
          AND c.status != 'canceled'
        GROUP BY c.status
      `,
      [organizationId]
    );

    return new Response(
      JSON.stringify({
        monthlyCollected: Number(collectedRows[0]?.total) || 0,
        totalPending: Number(pendingRows[0]?.total) || 0,
        totalOverdue: Number(overdueRows[0]?.total) || 0,
        activeStudents: Number(studentRows[0]?.total) || 0,
        monthlyHistory,
        statusDistribution: statusRows.map((r) => ({
          status: r.status,
          count: Number(r.count),
        })),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[DASHBOARD ERROR]", err);
    return new Response("Error interno", { status: 500 });
  }
}
