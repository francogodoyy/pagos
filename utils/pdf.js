import jsPDF from "jspdf";

export function generatePDF(pagos) {
    const doc = new jsPDF();

    doc.text("Historial de pagos", 10, 10);

    pagos.forEach((pago, index) => {
        doc.text(
            `${pago.fecha_pago} - ${pago.descripcion} - $${pago.monto}`,
            10,
            20 + index * 10
        );
    });

    doc.save("historial-pagos.pdf");
}