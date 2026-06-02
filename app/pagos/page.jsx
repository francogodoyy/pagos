"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Pagos() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [filtro, setFiltro] = useState({ dni: "", nombre_apellido: "" });
  const [filtroFecha, setFiltroFecha] = useState("");
  const [pagos, setPagos] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "admin") {
      router.push("/admin/login");
    }
  }, [session, status, router]);

  useEffect(() => {
    cargarPagos();
  }, []);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 to-pink-300">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  const cargarPagos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtro.dni) params.append("dni", filtro.dni);
      if (filtro.nombre_apellido) params.append("nombre_apellido", filtro.nombre_apellido);
      if (filtroFecha) params.append("fechaInicio", filtroFecha);

      const res = await fetch(`/api/pagos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPagos(data);
        setError("");
      } else {
        throw new Error("Error al cargar los pagos.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltro({ ...filtro, [name]: value });
  };

  const handleBuscar = () => {
    if (filtro.dni && !/^\d{8}$/.test(filtro.dni)) {
      setError("El DNI debe tener 8 dígitos.");
      return;
    }
    setError("");
    cargarPagos();
  };

  const handleLimpiar = () => {
    setFiltro({ dni: "", nombre_apellido: "" });
    setFiltroFecha("");
    setError("");
    setTimeout(() => cargarPagos(), 0);
  };

  const formatFecha = (fecha) => {
    const date = new Date(fecha);
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatMonto = (monto) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(monto);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 to-pink-300">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src="/shinee.png" alt="Shine Logo" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Historial de pagos</h1>
              <p className="text-sm text-gray-500">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/nuevo-pago")}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
          >
            + Nuevo pago
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm flex flex-wrap gap-3 items-center">
          <input
            type="text"
            name="nombre_apellido"
            placeholder="Buscar por nombre..."
            value={filtro.nombre_apellido}
            onChange={handleFiltroChange}
            className="flex-1 min-w-[160px] border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          <input
            type="text"
            name="dni"
            placeholder="Buscar por DNI..."
            value={filtro.dni}
            onChange={handleFiltroChange}
            className="flex-1 min-w-[140px] border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          <button
            onClick={handleBuscar}
            className="bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition duration-200"
          >
            Buscar
          </button>
          {(filtro.dni || filtro.nombre_apellido || filtroFecha) && (
            <button
              onClick={handleLimpiar}
              className="text-gray-400 hover:text-gray-600 text-sm underline"
            >
              Limpiar
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Encabezado tabla */}
          <div className="grid grid-cols-[2fr_1.2fr_1fr_1.2fr_40px] gap-4 px-6 py-3 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
            <span>Nombre</span>
            <span>DNI</span>
            <span>Fecha</span>
            <span>Monto</span>
            <span></span>
          </div>

          {/* Filas */}
          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">Cargando pagos...</div>
          ) : pagos.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">No se encontraron pagos.</div>
          ) : (
            pagos.map((pago) => (
              <div
                key={pago.id_pagos}
                onClick={() => router.push(`/pagos/${pago.id_pagos}`)}
                className="grid grid-cols-[2fr_1.2fr_1fr_1.2fr_40px] gap-4 px-6 py-4 border-b border-gray-50 items-center hover:bg-pink-50 cursor-pointer transition duration-150 last:border-b-0"
              >
                <span className="font-medium text-gray-800 text-sm">{pago.nombre_apellido}</span>
                <span className="text-gray-400 text-sm">{pago.dni}</span>
                <span className="text-gray-400 text-sm">{formatFecha(pago.fecha_pago)}</span>
                <span className="font-medium text-green-700 text-sm">{formatMonto(pago.monto)}</span>
                <span className="text-gray-300 text-lg">›</span>
              </div>
            ))
          )}
        </div>

        {pagos.length > 0 && (
          <p className="text-xs text-gray-400 text-right mt-3">
            {pagos.length} pago{pagos.length !== 1 ? "s" : ""} encontrado{pagos.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
