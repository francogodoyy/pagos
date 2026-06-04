"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { generatePDF } from "@/utils/pdf";


export default function DetallePago() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [pago, setPago] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "admin") {
      router.push("/admin/login");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!id) return;
    cargarPago();
  }, [id]);

  const cargarPago = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pagos/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPago(data);
      } else if (res.status === 404) {
        setError("Pago no encontrado.");
      } else {
        throw new Error("Error al cargar el pago.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async () => {
    try {
      const res = await fetch(`/api/pagos/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/pagos");
      } else {
        throw new Error("Error al eliminar el pago.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGeneratePDF = () => {
    if (!pago) return;
    generatePDF([pago]);
  };

  const formatFechaHora = (fecha) => {
  const fechaPago = new Date(fecha);
  const fechaFormato = fechaPago.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const horaFormato = fechaPago.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${fechaFormato}, ${horaFormato}`;
};

  const formatMonto = (monto) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(monto);
  };

  const getIniciales = (nombre) => {
    if (!nombre) return "??";
    const partes = nombre.trim().split(" ");
    return partes.length >= 2
      ? (partes[0][0] + partes[1][0]).toUpperCase()
      : partes[0].slice(0, 2).toUpperCase();
  };

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 to-pink-300">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 to-pink-300">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Topbar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/pagos")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition duration-150"
          >
            ← Volver
          </button>
          <span className="text-xs bg-green-100 text-green-700 font-medium px-3 py-1 rounded-full">
            Pago registrado
          </span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-sm text-gray-400 shadow-sm">
            Cargando detalle...
          </div>
        ) : pago ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">

              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-semibold text-sm flex-shrink-0">
                  {getIniciales(pago.nombre_apellido)}
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-800">{pago.nombre_apellido}</h1>
                  <p className="text-sm text-gray-400">DNI {pago.dni} · {formatFechaHora(pago.fecha_pago)}</p>
                </div>
              </div>

              {/* Monto destacado */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5">
                <p className="text-xs text-green-600 mb-1">Monto abonado</p>
                <p className="text-3xl font-semibold text-green-800">{formatMonto(pago.monto)}</p>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Correo</p>
                  <p className="text-sm font-medium text-gray-700 truncate">{pago.correo}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Teléfono</p>
                  <p className="text-sm font-medium text-gray-700">{pago.telefono}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Localidad</p>
                  <p className="text-sm font-medium text-gray-700">{pago.localidad}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Dirección</p>
                  <p className="text-sm font-medium text-gray-700">{pago.direccion}</p>
                </div>
              </div>

              {/* Descripción */}
              {pago.descripcion && (
                <div className="bg-gray-50 rounded-lg p-3 mb-5">
                  <p className="text-xs text-gray-400 mb-1">Descripción</p>
                  <p className="text-sm text-gray-700">{pago.descripcion}</p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handleGeneratePDF}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-lg text-sm transition duration-200"
                >
                  📄 Generar PDF
                </button>
                {!confirmandoEliminar ? (
                  <button
                    onClick={() => setConfirmandoEliminar(true)}
                    className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 px-4 rounded-lg text-sm transition duration-200"
                  >
                    🗑 Eliminar
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleEliminar}
                      className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg text-sm transition duration-200"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmandoEliminar(false)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-2 px-4 rounded-lg text-sm transition duration-200"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
