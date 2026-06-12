import { db } from "@/utils/db";
import { sendEmail } from "@/utils/email";
import { reminderTemplate } from "@/utils/email-templates";

export async function GET(req) {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("No autorizado", { status: 401 });
  }

  try {
    const [overdueCharges] = await db.query(
      `
        SELECT
          c.id, c.period_year, c.period_month, c.due_date, c.amount,
          f.email, f.guardian_name,
          s.full_name AS student_name,
          co.name AS course_name
        FROM charges c
        INNER JOIN enrollments e ON e.id = c.enrollment_id
        INNER JOIN students s ON s.id = e.student_id
        INNER JOIN families f ON f.id = s.family_id
        INNER JOIN courses co ON co.id = e.course_id
        WHERE c.due_date < CURDATE()
          AND c.status IN ('pending', 'partial')
      `
    );

    const [result] = await db.query(`
      UPDATE charges
      SET status = 'overdue'
      WHERE
        due_date < CURDATE()
        AND status IN ('pending', 'partial')
    `);

    const updatedCount = result.affectedRows ?? 0;

    let emailSent = 0;
    for (const charge of overdueCharges) {
      if (!charge.email) continue;

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

      const html = reminderTemplate({
        guardianName: charge.guardian_name,
        studentName: charge.student_name,
        courseName: charge.course_name,
        periodLabel,
        monto: charge.amount,
        dueDate,
      });

      await sendEmail({
        to: charge.email,
        subject: `Recordatorio de pago - ${charge.student_name} - ${periodLabel}`,
        html,
      });
      emailSent++;
    }

    console.log(`[Cron] Cuotas vencidas: ${updatedCount} | Emails enviados: ${emailSent}`);

    return new Response(
      JSON.stringify({
        ok: true,
        message: `Se actualizaron ${updatedCount} cuota(s) como vencidas. Emails enviados: ${emailSent}`,
        updatedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Cron] Error al actualizar cuotas vencidas:", error);
    return new Response("Error interno al actualizar cuotas vencidas", { status: 500 });
  }
}
