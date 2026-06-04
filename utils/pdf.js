import { jsPDF } from "jspdf";

export const generatePDF = (pagos) => {
  if (!Array.isArray(pagos) || pagos.length === 0) {
    console.error("Error: pagos no es un array válido", pagos);
    return;
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();

  pagos.forEach((pago, index) => {
    // Agregar nueva página si no es el primer pago
    if (index > 0) {
      doc.addPage();
    }

    let yPosition = 15;

    // ===== HEADER CON LOGO =====
    try {
      doc.addImage("/shinee.png", "PNG", 20, yPosition - 5, 30, 30);
    } catch (error) {
      console.log("Logo no encontrado, continuando sin él");
    }

    yPosition += 8;
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0); // Negro
    doc.setFont(undefined, "bold");
    

    yPosition += 10;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, "normal");
    


    yPosition += 10;
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0); // Negro
    doc.line(20, yPosition, pageWidth - 20, yPosition);

    yPosition += 10;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, "bold");
    doc.text("COMPROBANTE DE PAGO", 20, yPosition);

    yPosition += 12;

    // ===== DATOS DEL COMPROBANTE =====
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont(undefined, "normal");

    const fechaPago = new Date(pago.fecha_pago);
    const fechaFormato = fechaPago.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    doc.text(`Nro. Comprobante: 001-${String(pago.id_pagos).padStart(8, "0")}`, 20, yPosition);
    doc.text(`Fecha: ${fechaFormato}`, pageWidth - 60, yPosition);

    yPosition += 6;
    doc.text(`Hora: ${fechaPago.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", minute: "2-digit" })}`, 20, yPosition);

    yPosition += 10;
    doc.setLineWidth(0.3);
    doc.setDrawColor(0, 0, 0); // Negro
    doc.line(20, yPosition, pageWidth - 20, yPosition);

    // ===== DATOS DEL ALUMNO =====
    yPosition += 8;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, "bold");
    doc.text("DATOS DEL ALUMNO", 20, yPosition);

    yPosition += 8;
    doc.setFont(undefined, "normal");
    doc.setFontSize(9);

    const datos = [
      [`Nombre: ${pago.nombre_apellido}`, `DNI: ${pago.dni}`],
      [`Correo: ${pago.correo}`, `Teléfono: ${pago.telefono}`],
      [`Localidad: ${pago.localidad}`, ""],
      [`Dirección: ${pago.direccion}`, ""],
    ];

    datos.forEach((row) => {
      doc.text(row[0], 20, yPosition);
      if (row[1]) {
        doc.text(row[1], pageWidth / 2, yPosition);
      }
      yPosition += 5;
    });

    yPosition += 5;
    doc.setLineWidth(0.3);
    doc.setDrawColor(0, 0, 0); // Negro
    doc.line(20, yPosition, pageWidth - 20, yPosition);

    // ===== DETALLE DEL PAGO =====
    yPosition += 8;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, "bold");
    doc.text("DETALLE DEL PAGO", 20, yPosition);

    yPosition += 8;
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");

    // Encabezado de tabla
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPosition - 4, pageWidth - 40, 5, "F");
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0); // Negro
    doc.text("Concepto", 22, yPosition);
    doc.text("Período", 120, yPosition);
    doc.text("Importe", pageWidth - 25, yPosition, { align: "right" });

    yPosition += 8;
    doc.setFont(undefined, "normal");
    doc.setTextColor(0, 0, 0);

    doc.text("Cuota Mensual", 22, yPosition);

    const periodo = `${fechaPago.toLocaleString("es-ES", { month: "long", year: "numeric" })}`;
    doc.text(periodo.charAt(0).toUpperCase() + periodo.slice(1), 120, yPosition);

    const montoFormato = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(pago.monto);
    doc.text(montoFormato, pageWidth - 25, yPosition, { align: "right" });

    yPosition += 10;
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0); // Negro
    doc.line(20, yPosition, pageWidth - 20, yPosition);

    // ===== TOTAL =====
    yPosition += 8;
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0); // Negro
    doc.text("TOTAL", 20, yPosition);
    doc.text(montoFormato, pageWidth - 25, yPosition, { align: "right" });

    yPosition += 12;
    doc.setLineWidth(0.3);
    doc.setDrawColor(0, 0, 0); // Negro
    doc.line(20, yPosition, pageWidth - 20, yPosition);

    // ===== ESTADO =====
    yPosition += 8;
    doc.setFontSize(11);
    doc.setTextColor(34, 139, 34); // Verde oscuro (mantiene el check)
    doc.setFont(undefined, "bold");
    doc.text("✓ PAGO ACREDITADO", 20, yPosition);

    yPosition += 10;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, "normal");

    if (pago.descripcion) {
      doc.text(`Descripción: ${pago.descripcion}`, 20, yPosition);
      yPosition += 6;
    }

    // ===== FOOTER =====
    const footerY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Comprobante de pago generado automáticamente por SHINE INGLÉS", pageWidth / 2, footerY, {
      align: "center",
    });
    doc.text(`Este documento tiene valor probatorio del pago realizado. Fecha de emisión: ${new Date().toLocaleDateString("es-ES")}`, pageWidth / 2, footerY + 5, {
      align: "center",
    });
  });

  // Descargar PDF
  const fecha = new Date().toLocaleDateString("es-ES").replace(/\//g, "-");
  doc.save(`comprobante-pago-${fecha}.pdf`);
};