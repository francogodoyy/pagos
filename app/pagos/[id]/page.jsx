"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { generatePDF } from "@/utils/pdf";

const statusStyles = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
  partial: "bg-amber-50 text-amber-700 border-amber-100",
  pending: "bg-slate-50 text-slate-700 border-slate-200",
  overdue: "bg-red-50 text-red-700 border-red-100",
  canceled: "bg-gray-100 text-gray-600 border-gray-200",
};

const statusLabels = {
  paid: "Pagado",
  partial: "Parcial",
  pending: "Pendiente",
  overdue: "Vencido",
  canceled: "Cancelado",
};

function SectionCard({ title, value, helper, accent = false }) {
  return (
    <div
      className={`rounded-2xl p-4 ${
        accent ? "border border-emerald-100 bg-emerald-50" : "border border-gray-100 bg-white"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
        {title}
      </p>
      <p className={`mt-2 text-sm font-semibold ${accent ? "text-emerald-800" : "text-gray-800"}`}>
        {value}
      </p>
      {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}

function TimelineItem({ item, formatFechaHora, formatMonto }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-gray-800">
          {formatFechaHora(item.payment_date)}
        </p>
        <p className="text-sm font-semibold text-emerald-700">
          {formatMonto(item.amount)}
        </p>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
        <span className="rounded-full bg-white px-2 py-1">
          Medio: {item.method || "cash"}
        </span>
        <span className="rounded-full bg-white px-2 py-1">
          Aplicado: {formatMonto(item.allocated_amount)}
        </span>
      </div>
      {item.reference && (
        <p className="mt-2 text-xs text-gray-500">Referencia: {item.reference}</p>
      )}
      {item.notes && <p className="mt-1 text-xs text-gray-500">Nota: {item.notes}</p>}
    </div>
  );
}

export default function DetallePago() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [pago, setPago] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);
  const [isBorrando, setIsBorrando] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    monto: "",
    due_date: "",
    status: "pending",
    descripcion: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !["admin", "owner", "assistant"].includes(session.user.role)) {
      router.push("/admin/login");
    }
  }, [session, status, router]);

  const formatFechaHora = (fecha) => {
    if (!fecha) return "Sin fecha";
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

  const formatFecha = (fecha) => {
    if (!fecha) return "Sin fecha";

    if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      const [year, month, day] = fecha.split("-").map(Number);
      return new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(year, month - 1, day)));
    }

    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return "Sin fecha";

    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  };

  const toInputDate = (fecha) => {
    if (!fecha) return "";
    if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}/.test(fecha)) {
      return fecha.slice(0, 10);
    }

    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  const formatPeriodo = (year, month) => {
    if (!year || !month) return "Sin periodo";
    return `${String(month).padStart(2, "0")}/${year}`;
  };

  const formatMonto = (monto) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(Number(monto) || 0);

  const getIniciales = (nombre) => {
    if (!nombre) return "??";
    const partes = nombre.trim().split(" ");
    return partes.length >= 2
      ? (partes[0][0] + partes[1][0]).toUpperCase()
      : partes[0].slice(0, 2).toUpperCase();
  };

  const cargarPago = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pagos/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPago(data);
        setEditData({
          monto: String(data.monto ?? ""),
          due_date: toInputDate(data.due_date),
          status: data.charge_status || "pending",
          descripcion: data.descripcion || "",
        });
        setError("");
      } else if (res.status === 404) {
        setError("Cuota no encontrada.");
      } else {
        const message = await res.text();
        throw new Error(message || "Error al cargar la cuota.");
      }
    } catch (err) {
      setError(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    cargarPago();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleEliminar = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/pagos/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setConfirmandoEliminar(false);
        await cargarPago();
      } else {
        const message = await res.text();
        throw new Error(message || "Error al cancelar la cuota.");
      }
    } catch (err) {
      setError(err.message || "Error inesperado");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBorrar = async () => {
    setIsBorrando(true);
    try {
      const res = await fetch("/api/pagos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(id) }),
      });

      if (res.ok) {
        setConfirmandoBorrar(false);
        router.push("/pagos");
      } else {
        const message = await res.text();
        throw new Error(message || "Error al eliminar la cuota.");
      }
    } catch (err) {
      setError(err.message || "Error inesperado");
    } finally {
      setIsBorrando(false);
    }
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardarCambios = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/pagos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Error al actualizar la cuota.");
      }

      setIsEditing(false);
      await cargarPago();
    } catch (err) {
      setError(err.message || "Error inesperado");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePDF = () => {
    if (!pago) return;
    generatePDF([pago]);
  };

  const timeline = useMemo(
    () => (Array.isArray(pago?.payments) ? pago.payments : []),
    [pago]
  );

  const auditLogs = useMemo(
    () => (Array.isArray(pago?.audit_logs) ? pago.audit_logs : []),
    [pago]
  );

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 to-pink-300">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.18),_transparent_40%),linear-gradient(135deg,#fdf2f8_0%,#fde7f3_45%,#fff1f2_100%)] flex items-center justify-center px-4">
        <div className="rounded-2xl border border-white/70 bg-white/80 px-5 py-4 text-sm text-gray-600 shadow-[0_18px_50px_rgba(236,72,153,0.08)] backdrop-blur">
          Cargando detalle...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.18),_transparent_40%),linear-gradient(135deg,#fdf2f8_0%,#fde7f3_45%,#fff1f2_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(236,72,153,0.10)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => router.push("/pagos")}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition duration-200 hover:border-pink-200 hover:bg-pink-50 focus:outline-none focus:ring-4 focus:ring-pink-100"
            >
              Volver
            </button>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-500">
                Detalle de cuota
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-900">
                {pago?.guardian_name || pago?.nombre_apellido || "Cuota"}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {pago?.student_name || "Sin alumno"} | DNI {pago?.dni || "Sin dato"}
              </p>
            </div>
          </div>

          {pago && (
            <span
              className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
                statusStyles[pago.charge_status] || statusStyles.pending
              }`}
            >
              {statusLabels[pago.charge_status] || "Pendiente"}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!pago ? null : (
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-[0_20px_60px_rgba(236,72,153,0.10)] backdrop-blur">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-lg font-semibold text-pink-700">
                      {getIniciales(pago.guardian_name || pago.nombre_apellido)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-500">
                        Resumen de cuenta
                      </p>
                      <p className="mt-2 text-lg font-semibold text-gray-900">
                        {pago.course_name || "Sin curso"}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {pago.course_level || "Nivel no definido"} | Periodo {formatPeriodo(pago.period_year, pago.period_month)}
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        Vence {formatFecha(pago.due_date)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-left lg:text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                      Monto
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-emerald-800">
                      {formatMonto(pago.monto)}
                    </p>
                    <p className="mt-1 text-sm text-emerald-700/80">
                      Cobrado: {formatMonto(pago.paid_amount)} | Saldo: {formatMonto(pago.balance)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <SectionCard
                    title="Periodo"
                    value={formatPeriodo(pago.period_year, pago.period_month)}
                  />
                  <SectionCard
                    title="Vencimiento"
                    value={formatFecha(pago.due_date)}
                  />
                  <SectionCard
                    title="Ultimo movimiento"
                    value={formatFechaHora(pago.fecha_pago)}
                  />
                </div>

                {isEditing && (
                  <div className="mt-6 rounded-2xl border border-pink-100 bg-pink-50/60 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">
                          Edicion
                        </p>
                        <p className="mt-1 text-sm text-pink-700/80">
                          Estos cambios quedan registrados en auditoria.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        type="number"
                        name="monto"
                        min="0"
                        step="0.01"
                        value={editData.monto}
                        onChange={handleEditChange}
                        className="rounded-xl border border-pink-100 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                      />
                      <input
                        type="date"
                        name="due_date"
                        value={editData.due_date}
                        onChange={handleEditChange}
                        className="rounded-xl border border-pink-100 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                      />
                      <select
                        name="status"
                        value={editData.status}
                        onChange={handleEditChange}
                        className="rounded-xl border border-pink-100 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="partial">Parcial</option>
                        <option value="paid">Pagado</option>
                        <option value="overdue">Vencido</option>
                        <option value="canceled">Cancelado</option>
                      </select>
                      <input
                        type="text"
                        name="descripcion"
                        value={editData.descripcion}
                        onChange={handleEditChange}
                        placeholder="Observacion"
                        className="rounded-xl border border-pink-100 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                      />
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Cerrar
                      </button>
                      <button
                        type="button"
                        onClick={handleGuardarCambios}
                        disabled={isSaving}
                        className="rounded-xl bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:bg-pink-300"
                      >
                        {isSaving ? "Guardando..." : "Guardar cambios"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  <SectionCard title="Correo" value={pago.correo || "Sin correo"} />
                  <SectionCard title="Telefono" value={pago.telefono || "Sin telefono"} />
                  <SectionCard title="Localidad" value={pago.localidad || "Sin localidad"} />
                  <SectionCard title="Direccion" value={pago.direccion || "Sin direccion"} />
                </div>

                {pago.descripcion && (
                  <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                      Observacion
                    </p>
                    <p className="mt-2 text-sm leading-6 text-gray-700">{pago.descripcion}</p>
                  </div>
                )}

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setIsEditing((prev) => !prev)}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition duration-200 hover:border-pink-200 hover:bg-pink-50 focus:outline-none focus:ring-4 focus:ring-pink-100"
                  >
                    {isEditing ? "Cerrar edicion" : "Editar cuota"}
                  </button>
                  <button
                    type="button"
                    onClick={handleGeneratePDF}
                    className="flex-1 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  >
                    Generar PDF
                  </button>
                  {!confirmandoEliminar && !confirmandoBorrar ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setConfirmandoEliminar(true)}
                        className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700 transition duration-200 hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-100"
                      >
                        Cancelar cuota
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmandoBorrar(true)}
                        className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition duration-200 hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100"
                      >
                        Eliminar cuota
                      </button>
                    </>
                  ) : confirmandoEliminar ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleEliminar}
                        disabled={isDeleting}
                        className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100"
                      >
                        {isDeleting ? "Cancelando..." : "Confirmar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmandoEliminar(false)}
                        className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition duration-200 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-100"
                      >
                        Atrás
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleBorrar}
                        disabled={isBorrando}
                        className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400 focus:outline-none focus:ring-4 focus:ring-red-100"
                      >
                        {isBorrando ? "Eliminando..." : "Confirmar Eliminación"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmandoBorrar(false)}
                        className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition duration-200 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-100"
                      >
                        Atrás
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(236,72,153,0.08)] backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Identificacion
                </p>
                <div className="mt-4 space-y-3">
                  <SectionCard title="Responsable" value={pago.guardian_name || pago.nombre_apellido} />
                  <SectionCard title="Alumno" value={pago.student_name || "Sin alumno"} />
                  <SectionCard title="DNI" value={pago.dni || "Sin dato"} />
                </div>
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(236,72,153,0.08)] backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Historial
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Los movimientos aplicados a esta cuota se listan abajo.
                </p>

                {timeline.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {timeline.map((item) => (
                      <TimelineItem
                        key={item.id}
                        item={item}
                        formatFechaHora={formatFechaHora}
                        formatMonto={formatMonto}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                    Aun no tiene pagos aplicados.
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(236,72,153,0.08)] backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Auditoria
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Cambios recientes de esta cuota.
                </p>

                {auditLogs.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {auditLogs.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-800">
                            {item.action === "canceled" ? "Cancelacion" : "Edicion"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFechaHora(item.created_at)}
                          </p>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Usuario: {item.created_by_email || "Sin usuario"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                    Aun no hay cambios registrados.
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
