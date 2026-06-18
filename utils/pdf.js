import { jsPDF } from "jspdf";

const PRIMARY = "#ec4899";
const GRAY = { 100: "#f3f4f6", 200: "#e5e7eb", 400: "#9ca3af", 500: "#6b7280", 600: "#4b5563", 900: "#111827" };
const EMERALD = "#059669";
const RED = "#dc2626";
const AMBER = "#d97706";

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(Number(value) || 0);

const parseDateSafe = (value) => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = parseDateSafe(value);
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
  }).format(date);
};

const formatDateTime = (value) => {
  const date = parseDateSafe(value);
  if (!date) return "Sin fecha";
  const datePart = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(date);
  const timePart = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(date);
  return `${datePart}, ${timePart}`;
};

const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

const statusConfig = {
  paid: { label: "Pagado", color: EMERALD },
  partial: { label: "Parcial", color: AMBER },
  pending: { label: "Pendiente", color: GRAY[500] },
  overdue: { label: "Vencido", color: RED },
  canceled: { label: "Cancelado", color: GRAY[400] },
};

const methodLabels = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  debit: "Debito",
  other: "Otro",
};

export const generatePDF = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    console.error("Error: items no es un array valido", items);
    return;
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ml = 18;
  const mr = pw - 18;
  const contentW = pw - 36;

  items.forEach((item, index) => {
    if (index > 0) doc.addPage();

    const sc = statusConfig[item.charge_status || item.status] || statusConfig.pending;
    const guardianName = item.guardian_name || item.nombre_apellido || "Sin nombre";
    const studentName = item.student_name || "Sin alumno";
    const courseName = item.course_name || "Sin curso";
    const courseLevel = item.course_level || "";
    const period = item.period_year && item.period_month
      ? `${String(item.period_month).padStart(2, "0")}/${item.period_year}`
      : "Sin periodo";
    const dueDate = formatDate(item.due_date || item.fecha_pago);
    const paymentDate = formatDateTime(item.fecha_pago || item.due_date);
    const amount = Number(item.monto || item.amount) || 0;
    const paidAmount = Number(item.paid_amount || item.allocated_amount) || 0;
    const balance = Number(item.balance) || 0;
    const method = methodLabels[item.method] || item.method || "";
    const pagoId = item.id_pagos || item.id || 0;

    let y = ml;

    // --- HEADER ---
    doc.setFillColor(...hexToRgb(PRIMARY));
    doc.roundedRect(ml, y, contentW, 28, 3, 3, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text("Comprobante de pago", ml + 14, y + 11);
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.text(`N° 001-${String(pagoId).padStart(8, "0")}`, ml + 14, y + 20);

    // Status badge
    const statusRgb = hexToRgb(sc.color);
    doc.setFillColor(...statusRgb);
    doc.roundedRect(mr - 48, y + 6, 42, 16, 8, 8, "F");
    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    doc.text(sc.label, mr - 27, y + 15, { align: "center" });

    y += 40;

    // --- DATOS DEL RESPONSABLE ---
    doc.setFillColor(...hexToRgb(GRAY[100]));
    doc.roundedRect(ml, y, contentW, 34, 3, 3, "F");

    doc.setTextColor(...hexToRgb(GRAY[900]));
    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    doc.text("Responsable", ml + 12, y + 8);
    doc.text("Alumno", ml + 85, y + 8);
    doc.text("DNI", mr - 12, y + 8, { align: "right" });

    doc.setFont(undefined, "normal");
    doc.setTextColor(...hexToRgb(GRAY[600]));
    doc.setFontSize(9);
    doc.text(guardianName, ml + 12, y + 18);
    doc.text(studentName, ml + 85, y + 18);
    doc.text(item.dni || "---", mr - 12, y + 18, { align: "right" });

    doc.setFont(undefined, "bold");
    doc.setTextColor(...hexToRgb(GRAY[900]));
    doc.setFontSize(9);
    doc.text("Curso", ml + 12, y + 28);
    doc.setFont(undefined, "normal");
    doc.setTextColor(...hexToRgb(GRAY[600]));
    doc.text(courseLevel ? `${courseName} - ${courseLevel}` : courseName, ml + 30, y + 28);

    y += 46;

    // --- DETALLE DE LA CUOTA ---
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.setTextColor(...hexToRgb(GRAY[900]));
    doc.text("Detalle de la cuota", ml, y);

    y += 4;
    doc.setDrawColor(...hexToRgb(GRAY[200]));
    doc.line(ml, y, mr, y);

    y += 8;

    doc.setTextColor(...hexToRgb(GRAY[500]));
    doc.setFontSize(8);
    doc.setFont(undefined, "bold");
    doc.text("PERIODO", ml + 2, y);
    doc.text("VENCIMIENTO", ml + 52, y);
    doc.text("MOVIMIENTO", mr - 2, y, { align: "right" });

    y += 5;
    doc.setTextColor(...hexToRgb(GRAY[900]));
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(period, ml + 2, y);
    doc.text(dueDate, ml + 52, y);
    doc.text(paymentDate, mr - 2, y, { align: "right" });

    y += 14;

    // --- RESUMEN DE PAGO ---
    const summaryItems = [
      { label: "Monto total", value: formatCurrency(amount), color: GRAY[900], bold: true },
      { label: "Cobrado", value: formatCurrency(paidAmount), color: EMERALD, bold: true },
      { label: "Saldo pendiente", value: formatCurrency(balance), color: balance > 0 ? RED : GRAY[500], bold: true },
    ];

    doc.setFillColor(...hexToRgb(GRAY[100]));
    doc.roundedRect(ml, y, contentW, 30, 3, 3, "F");

    const colW = contentW / 3;
    summaryItems.forEach((item, i) => {
      const x = ml + colW * i + colW / 2;
      doc.setTextColor(...hexToRgb(GRAY[500]));
      doc.setFontSize(8);
      doc.setFont(undefined, "bold");
      doc.text(item.label, x, y + 8, { align: "center" });
      doc.setTextColor(...hexToRgb(item.color));
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text(item.value, x, y + 21, { align: "center" });
    });

    y += 42;

    // --- METODO DE PAGO ---
    if (method) {
      doc.setTextColor(...hexToRgb(GRAY[500]));
      doc.setFontSize(8);
      doc.setFont(undefined, "bold");
      doc.text("METODO DE PAGO", ml, y);

      y += 5;
      doc.setTextColor(...hexToRgb(GRAY[900]));
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text(method, ml, y);

      y += 10;
    }

    // --- OBSERVACIONES ---
    const note = item.descripcion || item.notes;
    if (note) {
      doc.setDrawColor(...hexToRgb(GRAY[200]));
      doc.line(ml, y, mr, y);
      y += 6;

      doc.setTextColor(...hexToRgb(GRAY[500]));
      doc.setFontSize(8);
      doc.setFont(undefined, "bold");
      doc.text("OBSERVACIONES", ml, y);

      y += 5;
      doc.setTextColor(...hexToRgb(GRAY[600]));
      doc.setFontSize(9);
      doc.setFont(undefined, "normal");
      const lines = doc.splitTextToSize(note, contentW);
      doc.text(lines, ml, y);
      y += lines.length * 5 + 6;
    }

    // --- HISTORIAL DE PAGOS ---
    if (Array.isArray(item.payments) && item.payments.length > 0) {
      if (!note) {
        doc.setDrawColor(...hexToRgb(GRAY[200]));
        doc.line(ml, y, mr, y);
        y += 6;
      }

      doc.setTextColor(...hexToRgb(GRAY[500]));
      doc.setFontSize(8);
      doc.setFont(undefined, "bold");
      doc.text("HISTORIAL DE PAGOS", ml, y);
      y += 7;

      doc.setFillColor(...hexToRgb(GRAY[100]));
      doc.roundedRect(ml, y, contentW, 8, 2, 2, "F");
      doc.setTextColor(...hexToRgb(GRAY[400]));
      doc.setFontSize(7);
      doc.setFont(undefined, "bold");
      doc.text("FECHA", ml + 8, y + 5.5);
      doc.text("MONTO", ml + 62, y + 5.5);
      doc.text("METODO", mr - 8, y + 5.5, { align: "right" });
      y += 12;

      item.payments.forEach((payment, pi) => {
        if (pi > 0) y += 6;
        doc.setTextColor(...hexToRgb(GRAY[600]));
        doc.setFontSize(8);
        doc.setFont(undefined, "normal");
        doc.text(formatDateTime(payment.payment_date), ml + 8, y);
        doc.text(formatCurrency(payment.amount || payment.allocated_amount), ml + 62, y);
        doc.text(methodLabels[payment.method] || payment.method || "", mr - 8, y, { align: "right" });
      });

      y += 10;
    }

    // --- FOOTER ---
    const fy = doc.internal.pageSize.getHeight() - 20;

    doc.setDrawColor(...hexToRgb(GRAY[200]));
    doc.line(ml, fy, mr, fy);

    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb(GRAY[400]));
    doc.setFont(undefined, "normal");
    doc.text("Documento generado automaticamente por Shine Pagos", ml, fy + 5);
    doc.text(`Emision: ${formatDateTime(new Date())}`, mr, fy + 5, { align: "right" });
  });

  const fileDate = new Date().toLocaleDateString("es-ES").replace(/\//g, "-");
  doc.save(`comprobante-${fileDate}.pdf`);
};
