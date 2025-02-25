"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { generatePDF } from "@/utils/pdf";

export default function Pagos() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [filtro, setFiltro] = useState({ dni: "", nombre_apellido: "" });
  const [pagos, setPagos] = useState([]);
  const [error, setError] = useState("");

  const handleNuevoPago = () => {
    router.push("/pagos/nuevo-pago");
  };

  const [filtroFecha, setFiltroFecha] = useState("");

  const handleFiltroFechaChange = (e) => {
    setFiltroFecha(e.target.value);
  };

  const handleBuscarPorFecha = () => {
    cargarPagos();
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
      if (filtro.nombre_apellido)
        params.append("nombre_apellido", filtro.nombre_apellido);
      if (filtroFecha) params.append("fechaInicio", filtroFecha);

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

  const handleGeneratePDF = () => {
    if (!Array.isArray(pagos) || pagos.length === 0) {
      setError("No hay pagos para generar un PDF.");
      console.error("Error: pagos no es un array válido", pagos);
      return;
    }
    setError("");
    generatePDF(pagos);
  };

  const handleEliminarPago = async (id) => {
    try {
      const res = await fetch("/api/pagos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        // Recargar la lista de pagos después de eliminar
        cargarPagos();
      } else {
        throw new Error("Error al eliminar el pago");
      }
    } catch (err) {
      setError(err.message);
    }
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

  const formatFechaHora = (fecha) => {
    const date = new Date(fecha);
    // Ajusta la fecha a la zona horaria local
    const offset = date.getTimezoneOffset() * 60000; // Convertir offset a milisegundos
    const localDate = new Date(date.getTime() - offset);

    return localDate.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-200 to-pink-300">
      {/* Logo centrado arriba del título */}
      <div className="flex justify-center mb-4">
        <img
          src="/shine.jpeg"
          alt="Shine Logo"
          className="w-24 h-24 object-contain"
        />
      </div>

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
          <input
            type="date"
            name="fechaInicio"
            value={filtroFecha}
            onChange={handleFiltroFechaChange}
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <button
            onClick={handleBuscar || handleBuscarPorFecha}
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
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Lista de Pagos
          </h2>
          <div className="bg-white shadow-lg rounded-lg p-6">
            {pagos.map((pago) => (
              <div key={pago.id} className="border-b py-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{pago.nombre_apellido}</span>
                  <button
                    onClick={() => handleEliminarPago(pago.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    X
                  </button>
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
                  <span className="font-semibold text-gray-800">
                    Monto: ${pago.monto}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Descripción: {pago.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleGeneratePDF}
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
