// En /utils/pdf.js
export const generatePDF = (pagos) => {
    const doc = new jsPDF();
    pagos.forEach((pago, index) => {
      const y = 10 + index * 40;
      doc.text(`Nombre: ${pago.nombre_apellido}`, 10, y);
      doc.text(`DNI: ${pago.dni}`, 10, y + 10);
      doc.text(`Correo: ${pago.correo}`, 10, y + 20);
      doc.text(`Localidad: ${pago.localidad}`, 10, y + 30);
      doc.text(`Teléfono: ${pago.telefono}`, 10, y + 40);
      doc.text(`Dirección: ${pago.direccion}`, 10, y + 50);
      doc.text(`Monto: $${pago.monto}`, 10, y + 60);
    });
    doc.save("pagos.pdf");
  };