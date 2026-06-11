import { db } from "@/utils/db";

// Esta ruta es llamada automáticamente por Vercel Cron todos los días a las 00:00hs (UTC).
// Está protegida por un token secreto para que nadie más pueda ejecutarla.
export async function GET(req) {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("No autorizado", { status: 401 });
  }

  try {
    // Marca como 'overdue' todas las cuotas pendientes o parciales cuya fecha de vencimiento ya pasó.
    // Solo afecta cuotas que no están pagadas ni canceladas.
    const [result] = await db.query(`
      UPDATE charges
      SET status = 'overdue'
      WHERE
        due_date < CURDATE()
        AND status IN ('pending', 'partial')
    `);

    const updatedCount = result.affectedRows ?? 0;

    console.log(`[Cron] Cuotas marcadas como vencidas: ${updatedCount}`);

    return new Response(
      JSON.stringify({
        ok: true,
        message: `Se actualizaron ${updatedCount} cuota(s) como vencidas.`,
        updatedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Cron] Error al actualizar cuotas vencidas:", error);
    return new Response("Error interno al actualizar cuotas vencidas", { status: 500 });
  }
}
