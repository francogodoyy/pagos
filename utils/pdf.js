import { jsPDF } from "jspdf";

const formatCurrency = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  const datePart = date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart}, ${timePart}`;
};

export const generatePDF = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    console.error("Error: items no es un array valido", items);
    return;
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  items.forEach((item, index) => {
    if (index > 0) {
      doc.addPage();
    }

    const guardianName = item.guardian_name || item.nombre_apellido || "Sin nombre";
    const studentName = item.student_name || "Sin alumno";
    const courseName = item.course_name || "Sin curso";
    const courseLevel = item.course_level || "Nivel no definido";
    const period = item.period_year && item.period_month
      ? `${String(item.period_month).padStart(2, "0")}/${item.period_year}`
      : "Sin periodo";
    const dueDate = formatDate(item.due_date || item.fecha_pago);
    const paymentDate = formatDateTime(item.fecha_pago || item.due_date);
    const amount = formatCurrency(item.monto || item.amount);
    const paidAmount = formatCurrency(item.paid_amount || item.allocated_amount || 0);
    const balance = formatCurrency(item.balance || 0);
    const status = item.charge_status || item.status || "pending";

    let y = 18;

    try {
      doc.addImage("/shinee.png", "PNG", 18, y - 6, 28, 28);
    } catch (error) {
      console.log("Logo no encontrado, continuando sin el");
    }

    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.text("Comprobante de cuota", 60, y + 2);

    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.setTextColor(90, 90, 90);
    doc.text(`Nro. Comprobante: 001-${String(item.id_pagos || item.id || 0).padStart(8, "0")}`, 60, y + 10);
    doc.text(`Estado: ${status}`, 60, y + 15);

    y = 42;
    doc.setDrawColor(230, 230, 230);
    doc.line(18, y, pageWidth - 18, y);

    y += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Datos principales", 18, y);

    y += 8;
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.text(`Responsable: ${guardianName}`, 18, y);
    y += 6;
    doc.text(`Alumno: ${studentName}`, 18, y);
    y += 6;
    doc.text(`DNI: ${item.dni || "Sin DNI"}`, 18, y);
    y += 6;
    doc.text(`Curso: ${courseName} - ${courseLevel}`, 18, y);

    y += 10;
    doc.setDrawColor(230, 230, 230);
    doc.line(18, y, pageWidth - 18, y);

    y += 10;
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Detalle de la cuota", 18, y);

    y += 8;
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.text(`Periodo: ${period}`, 18, y);
    doc.text(`Vencimiento: ${dueDate}`, pageWidth / 2, y);

    y += 6;
    doc.text(`Ultimo movimiento: ${paymentDate}`, 18, y);

    y += 10;
    doc.setFillColor(247, 247, 247);
    doc.roundedRect(18, y - 4, pageWidth - 36, 28, 2, 2, "F");
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text("Monto total", 22, y + 3);
    doc.text("Cobrado", 82, y + 3);
    doc.text("Saldo", 130, y + 3);
    doc.text(amount, pageWidth - 22, y + 3, { align: "right" });
    doc.setFont(undefined, "normal");
    doc.text(paidAmount, 82, y + 9);
    doc.text(balance, 130, y + 9);

    y += 20;
    doc.setDrawColor(230, 230, 230);
    doc.line(18, y, pageWidth - 18, y);

    y += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text("Observaciones", 18, y);

    y += 7;
    doc.setFont(undefined, "normal");
    const note = item.descripcion || item.notes || "Sin observaciones";
    const lines = doc.splitTextToSize(note, pageWidth - 36);
    doc.text(lines, 18, y);
    y += lines.length * 5 + 8;

    if (Array.isArray(item.payments) && item.payments.length > 0) {
      doc.setFont(undefined, "bold");
      doc.text("Historial de pagos", 18, y);
      y += 7;
      doc.setFont(undefined, "normal");

      item.payments.forEach((payment) => {
        const paymentLine = `${formatDateTime(payment.payment_date)} | ${formatCurrency(payment.amount)} | ${payment.method || "cash"}`;
        const paymentLines = doc.splitTextToSize(paymentLine, pageWidth - 36);
        doc.text(paymentLines, 18, y);
        y += paymentLines.length * 5 + 2;
      });
    }

    const footerY = doc.internal.pageSize.getHeight() - 18;
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      "Documento generado automaticamente por la plataforma de gestion de cuotas.",
      pageWidth / 2,
      footerY,
      { align: "center" }
    );
    doc.text(
      `Fecha de emision: ${formatDate(new Date())}`,
      pageWidth / 2,
      footerY + 5,
      { align: "center" }
    );
  });

  const fileDate = new Date().toLocaleDateString("es-ES").replace(/\//g, "-");
  doc.save(`comprobante-cuota-${fileDate}.pdf`);
};
