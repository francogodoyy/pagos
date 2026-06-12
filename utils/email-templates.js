const formatMonto = (monto) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(Number(monto) || 0);

const methodLabels = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  debit: "Debito",
  other: "Otro",
};

const statusColors = {
  paid: "#059669",
  partial: "#d97706",
  pending: "#475569",
  overdue: "#dc2626",
  canceled: "#6b7280",
};

export function receiptTemplate({ guardianName, studentName, courseName, periodLabel, monto, paidAmount, balance, chargeStatus, method, dueDate, pagoId, orgName }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
          <tr>
            <td style="background:#ec4899;padding:28px 32px;text-align:center">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff">${orgName || "Shine"}</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#fdf2f8">Comprobante de pago</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:20px;font-size:14px;color:#374151">
                    <p style="margin:0 0 4px;font-weight:600;color:#111827">${guardianName}</p>
                    <p style="margin:0;color:#6b7280">Recibimos tu pago correctamente.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px;background:#f9fafb;border-radius:12px">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="padding:4px 0"><span style="color:#6b7280;font-size:13px">Alumno</span><br><span style="font-weight:600;font-size:14px;color:#111827">${studentName}</span></td></tr>
                      <tr><td style="padding:4px 0"><span style="color:#6b7280;font-size:13px">Curso</span><br><span style="font-weight:600;font-size:14px;color:#111827">${courseName}</span></td></tr>
                      <tr><td style="padding:4px 0"><span style="color:#6b7280;font-size:13px">Periodo</span><br><span style="font-weight:600;font-size:14px;color:#111827">${periodLabel}</span></td></tr>
                      <tr><td style="padding:4px 0"><span style="color:#6b7280;font-size:13px">Vencimiento</span><br><span style="font-weight:600;font-size:14px;color:#111827">${dueDate}</span></td></tr>
                      <tr><td style="padding:4px 0"><span style="color:#6b7280;font-size:13px">Metodo de pago</span><br><span style="font-weight:600;font-size:14px;color:#111827">${methodLabels[method] || method}</span></td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 0">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="text-align:center;padding:8px">
                          <p style="margin:0;font-size:12px;color:#6b7280">Monto</p>
                          <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#111827">${formatMonto(monto)}</p>
                        </td>
                        <td style="text-align:center;padding:8px">
                          <p style="margin:0;font-size:12px;color:#6b7280">Pagado</p>
                          <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#059669">${formatMonto(paidAmount)}</p>
                        </td>
                        <td style="text-align:center;padding:8px">
                          <p style="margin:0;font-size:12px;color:#6b7280">Saldo</p>
                          <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#dc2626">${formatMonto(balance)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0 0;border-top:1px solid #e5e7eb;text-align:center">
                    <span style="display:inline-block;padding:4px 14px;border-radius:999px;font-size:12px;font-weight:600;color:${statusColors[chargeStatus] || '#475569'};background:${chargeStatus === 'paid' ? '#ecfdf5' : '#fef3c7'}">${chargeStatus === 'paid' ? 'Pagado' : chargeStatus === 'partial' ? 'Parcial' : chargeStatus}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 0 0;text-align:center">
                    <p style="margin:0;font-size:11px;color:#9ca3af">ID de operacion: #${pagoId}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function reminderTemplate({ guardianName, studentName, courseName, periodLabel, monto, dueDate }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
          <tr>
            <td style="background:#dc2626;padding:28px 32px;text-align:center">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff">Recordatorio de pago</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:20px;font-size:14px;color:#374151">
                    <p style="margin:0 0 4px;font-weight:600;color:#111827">${guardianName}</p>
                    <p style="margin:0;color:#6b7280">La siguiente cuota se encuentra pendiente de pago:</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="padding:4px 0"><span style="color:#6b7280;font-size:13px">Alumno</span><br><span style="font-weight:600;font-size:14px;color:#111827">${studentName}</span></td></tr>
                      <tr><td style="padding:4px 0"><span style="color:#6b7280;font-size:13px">Curso</span><br><span style="font-weight:600;font-size:14px;color:#111827">${courseName}</span></td></tr>
                      <tr><td style="padding:4px 0"><span style="color:#6b7280;font-size:13px">Periodo</span><br><span style="font-weight:600;font-size:14px;color:#111827">${periodLabel}</span></td></tr>
                      <tr><td style="padding:4px 0"><span style="color:#6b7280;font-size:13px">Vencimiento</span><br><span style="font-weight:600;font-size:14px;color:#111827">${dueDate}</span></td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 0;text-align:center">
                    <p style="margin:0;font-size:12px;color:#6b7280">Monto adeudado</p>
                    <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#dc2626">${formatMonto(monto)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 0 0;border-top:1px solid #e5e7eb;text-align:center">
                    <p style="margin:0;font-size:12px;color:#9ca3af">Si ya realizaste el pago, ignora este mensaje.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
