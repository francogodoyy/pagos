"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { generatePDF } from "@/utils/pdf";
import { useRouter } from "next/navigation";

export default function Pagos() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [filtro, setFiltro] = useState({ dni: "", nombre_apellido: "" });
  const [pagos, setPagos] = useState([]);
  const [error, setError] = useState("");

  const handleNuevoPago = () => {
    router.push("/pagos/nuevo-pago");
  };

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/admin/login");
    } else if (session.user.role !== "admin") {
      router.push("/admin/login");
    }
  }, [session, status, router]);

  if (status === "loading" || !session) {
    return <p>Cargando...</p>;
  }

  const cargarPagos = async () => {
    try {
      const params = new URLSearchParams();
      if (filtro.dni) params.append("dni", filtro.dni);
      if (filtro.nombre_apellido) params.append("nombre_apellido", filtro.nombre_apellido);

      const res = await fetch(`/api/pagos?${params.toString()}`);

      if (res.ok) {
        const data = await res.json();
        setPagos(data);
        setError(""); // Limpiar errores si todo va bien
      } else {
        throw new Error("Error al cargar los pagos.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarPagos();
  }, []);

  const handlePDF = () => {
    if (pagos.length === 0) {
      setError("No hay pagos para generar un PDF.");
      return;
    }
    setError(""); // Limpiar errores si no hay problemas
    generatePDF(pagos);
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltro({ ...filtro, [name]: value });
  };

  const handleBuscar = () => {
    // Validación antes de realizar la búsqueda
    if (filtro.dni && !/^\d{8}$/.test(filtro.dni)) {
      setError("El DNI debe tener 8 dígitos.");
      return;
    }

    setError(""); // Limpiar errores si la validación es exitosa
    cargarPagos();
  };

  // Función para formatear la fecha y hora
  const formatFechaHora = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Historial de Pagos
      </h1>
      <div className="flex justify-center mb-6">
        <div className="flex space-x-4">
          <input
            type="text"
            name="nombre_apellido"
            placeholder="Filtrar por Nombre o Apellido"
            value={filtro.nombre_apellido}
            onChange={handleFiltroChange}
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <input
            type="text"
            name="dni"
            placeholder="Filtrar por DNI"
            value={filtro.dni}
            onChange={handleFiltroChange}
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <button
            onClick={handleBuscar}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 focus:outline-none focus:shadow-outline"
          >
            Buscar
          </button>
          <button
            onClick={handleNuevoPago}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
          >
            Registrar Nuevo Pago
          </button>
        </div>
      </div>

      {error && <p className="text-center text-red-500 mb-4">{error}</p>}

      {pagos.length > 0 ? (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Lista de Pagos</h2>
          <div className="bg-white shadow-md rounded p-4">
            {pagos.map((pago) => (
              <div
                key={pago.id}
                className="border-b py-4 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{pago.nombre_apellido}</span>
                  <span className="text-sm text-gray-600">DNI: {pago.dni}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Correo: {pago.correo}</p>
                  <p>Localidad: {pago.localidad}</p>
                  <p>Teléfono: {pago.telefono}</p>
                  <p>Dirección: {pago.direccion}</p>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Fecha y Hora: {formatFechaHora(pago.fecha_pago)}</span>
                  <span>Monto: ${pago.monto}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Descripción: {pago.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handlePDF}
            className="mt-6 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Generar PDF
          </button>
        </div>
      ) : (
        <p className="text-center text-gray-700">No se encontraron pagos.</p>
      )}
    </div>
  );
}