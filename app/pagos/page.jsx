"use client";

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

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

const statusFilters = [
  { value: "", label: "Todas" },
  { value: "paid", label: "Pagadas" },
  { value: "partial", label: "Parciales" },
  { value: "pending", label: "Pendientes" },
  { value: "overdue", label: "Vencidas" },
  { value: "canceled", label: "Canceladas" },
];

function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(236,72,153,0.08)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{helper}</p>
    </div>
  );
}

function StatusPill({ value }) {
  const className = statusStyles[value] || statusStyles.pending;
  const label = statusLabels[value] || "Pendiente";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

function PaymentCard({ pago, formatFecha, formatPeriodo, formatMonto, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-3xl border border-gray-100 bg-white p-4 text-left shadow-[0_16px_40px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(236,72,153,0.12)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {pago.guardian_name || pago.nombre_apellido}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {pago.student_name || "Sin alumno"} | DNI {pago.dni}
          </p>
        </div>
        <StatusPill value={pago.charge_status} />
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl bg-gray-50 p-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Curso
          </p>
          <p className="mt-1 text-sm font-medium text-gray-800">
            {pago.course_name || "Sin curso"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {pago.course_level || "Nivel no definido"}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Periodo
          </p>
          <p className="mt-1 text-sm font-medium text-gray-800">
            {formatPeriodo(pago.period_year, pago.period_month)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Vence {formatFecha(pago.due_date)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Monto
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {formatMonto(pago.monto)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            Saldo
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-700">
            {formatMonto(pago.balance)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-xs text-gray-500">
          Ultimo pago: {formatFecha(pago.fecha_pago)}
        </span>
        <span className="text-sm font-semibold text-pink-600">Ver detalle</span>
      </div>
    </button>
  );
}

function PaginationButton({ children, disabled, onClick, variant = "default" }) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-4 focus:ring-pink-100";
  const styles =
    variant === "primary"
      ? "bg-pink-600 text-white hover:bg-pink-700 disabled:bg-pink-300"
      : "border border-gray-200 bg-white text-gray-700 hover:border-pink-200 hover:bg-pink-50 disabled:text-gray-300";

  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

export default function Pagos() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [filtro, setFiltro] = useState({
    dni: "",
    guardian_name: "",
    course_name: "",
    status: "",
    period: "",
  });
  const [pagos, setPagos] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: PAGE_SIZE,
    offset: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [monthlyPeriod, setMonthlyPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [monthlyTotal, setMonthlyTotal] = useState(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !["admin", "owner", "assistant"].includes(session.user.role)) {
      router.push("/admin/login");
    }
  }, [session, status, router]);

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

  const cargarPagos = async (filters = filtro, nextPage = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.dni) params.append("dni", filters.dni);
      if (filters.guardian_name) params.append("guardian_name", filters.guardian_name);
      if (filters.course_name) params.append("course_name", filters.course_name);
      if (filters.status) params.append("status", filters.status);
      if (filters.period) params.append("period", filters.period);
      params.append("limit", String(PAGE_SIZE));
      params.append("offset", String(Math.max(nextPage - 1, 0) * PAGE_SIZE));

      const res = await fetch(`/api/pagos?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Error al cargar los pagos.");
      }

      const data = await res.json();
      setPagos(Array.isArray(data.items) ? data.items : []);
      setPagination({
        total: Number(data.total) || 0,
        limit: Number(data.limit) || PAGE_SIZE,
        offset: Number(data.offset) || 0,
        totalPages: Number(data.totalPages) || 0,
        hasMore: Boolean(data.hasMore),
      });
      setError("");
      fetchMonthlyTotal(monthlyPeriod);
    } catch (err) {
      setError(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyTotal = async (period) => {
    if (!period) {
      setMonthlyTotal(null);
      return;
    }
    setMonthlyLoading(true);
    try {
      const res = await fetch(`/api/pagos/total-mes?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setMonthlyTotal(data.totalPaid);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMonthlyLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading" || !session) return;
    cargarPagos(filtro, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  useEffect(() => {
    fetchMonthlyTotal(monthlyPeriod);
  }, [monthlyPeriod]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchMonthlyTotal(monthlyPeriod);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [monthlyPeriod]);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltro((prev) => ({ ...prev, [name]: value }));
  };

  const handleBuscar = async (event) => {
    event?.preventDefault();

    if (filtro.dni && !/^\d{6,20}$/.test(filtro.dni)) {
      setError("El DNI debe tener solo numeros.");
      return;
    }

    setPage(1);
    await cargarPagos(filtro, 1);
  };

  const handleLimpiar = async () => {
    const emptyFilters = {
      dni: "",
      guardian_name: "",
      course_name: "",
      status: "",
      period: "",
    };

    setFiltro(emptyFilters);
    setPage(1);
    await cargarPagos(emptyFilters, 1);
  };

  const handleQuickStatus = async (value) => {
    const nextFilters = { ...filtro, status: value };
    setFiltro(nextFilters);
    setPage(1);
    await cargarPagos(nextFilters, 1);
  };

  const goToPage = async (nextPage) => {
    const boundedPage = Math.min(Math.max(nextPage, 1), pagination.totalPages || 1);
    setPage(boundedPage);
    await cargarPagos(filtro, boundedPage);
  };

  const summary = useMemo(() => {
    return pagos.reduce(
      (acc, pago) => {
        acc.totalCharge += Number(pago.monto) || 0;
        acc.totalPaid += Number(pago.paid_amount) || 0;
        acc.totalBalance += Number(pago.balance) || 0;
        if (pago.charge_status === "paid") acc.paidCount += 1;
        if (pago.charge_status === "pending") acc.pendingCount += 1;
        if (pago.charge_status === "overdue") acc.overdueCount += 1;
        return acc;
      },
      {
        totalCharge: 0,
        totalPaid: 0,
        totalBalance: 0,
        paidCount: 0,
        pendingCount: 0,
        overdueCount: 0,
      }
    );
  }, [pagos]);

  const hasFilters = Boolean(
    filtro.dni || filtro.guardian_name || filtro.course_name || filtro.status || filtro.period
  );

  const showingFrom = pagination.total === 0 ? 0 : pagination.offset + 1;
  const showingTo = pagination.offset + pagos.length;

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.18),_transparent_40%),linear-gradient(135deg,#fdf2f8_0%,#fde7f3_45%,#fff1f2_100%)] flex items-center justify-center px-4">
        <div className="rounded-2xl border border-white/70 bg-white/80 px-5 py-4 text-sm text-gray-600 shadow-[0_18px_50px_rgba(236,72,153,0.08)] backdrop-blur">
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.18),_transparent_40%),linear-gradient(135deg,#fdf2f8_0%,#fde7f3_45%,#fff1f2_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(236,72,153,0.10)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-500">
              Shine
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900">
              Control de cuotas
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Consulta el estado de cada cuota, filtra por responsable, curso o
              periodo, y revisa rapido lo cobrado, lo pendiente y lo vencido.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleLimpiar}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition duration-200 hover:border-pink-200 hover:bg-pink-50 focus:outline-none focus:ring-4 focus:ring-pink-100"
            >
              Limpiar filtros
            </button>
            <button
              type="button"
              onClick={() => router.push("/nuevo-pago")}
              className="inline-flex items-center justify-center rounded-xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-pink-700 focus:outline-none focus:ring-4 focus:ring-pink-100"
            >
              Nuevo pago
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard
            label="Coincidencias"
            value={pagination.total}
            helper="Total de cuotas que cumplen los filtros."
          />
          <StatCard
            label="En esta pagina"
            value={pagos.length}
            helper={`Mostrando ${showingFrom}-${showingTo} de ${pagination.total}.`}
          />
          <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(236,72,153,0.08)] backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Cobrado visible
              </p>
              <input
                type="month"
                value={monthlyPeriod}
                onChange={(e) => setMonthlyPeriod(e.target.value)}
                className="w-32 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none transition duration-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
              />
            </div>
            <p className="mt-3 text-2xl font-semibold text-gray-900">
              {monthlyLoading ? "..." : formatMonto(monthlyTotal)}
            </p>
            {monthlyPeriod && (() => {
              const [y, m] = monthlyPeriod.split("-").map(Number);
              return (
                <p className="mt-1 text-sm text-gray-500">
                  Total de {formatPeriodo(y, m)}
                </p>
              );
            })()}
          </div>
          <StatCard
            label="Pendiente visible"
            value={formatMonto(summary.totalBalance)}
            helper="Saldo de la pagina actual."
          />
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-[0_20px_60px_rgba(236,72,153,0.08)] backdrop-blur sm:p-6">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Busqueda
              </p>
              <h2 className="mt-2 text-xl font-semibold text-gray-900">
                Filtrar registros
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Combina responsable, DNI, curso, estado y periodo para encontrar
                una cuota rapido.
              </p>
            </div>

            {hasFilters && (
              <p className="text-sm text-pink-600">Hay filtros activos en la vista.</p>
            )}
          </div>

          <form onSubmit={handleBuscar} className="space-y-4">
            <div className="grid gap-3 xl:grid-cols-[1.2fr_0.9fr_0.9fr_0.7fr_0.8fr_auto_auto]">
              <input
                type="text"
                name="guardian_name"
                placeholder="Responsable"
                value={filtro.guardian_name}
                onChange={handleFiltroChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition duration-200 placeholder:text-gray-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
              />
              <input
                type="text"
                name="dni"
                placeholder="DNI"
                value={filtro.dni}
                onChange={handleFiltroChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition duration-200 placeholder:text-gray-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
              />
              <input
                type="text"
                name="course_name"
                placeholder="Curso"
                value={filtro.course_name}
                onChange={handleFiltroChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition duration-200 placeholder:text-gray-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
              />
              <select
                name="status"
                value={filtro.status}
                onChange={handleFiltroChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition duration-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
              >
                <option value="">Estado</option>
                <option value="paid">Pagado</option>
                <option value="partial">Parcial</option>
                <option value="pending">Pendiente</option>
                <option value="overdue">Vencido</option>
                <option value="canceled">Cancelado</option>
              </select>
              <input
                type="month"
                name="period"
                value={filtro.period}
                onChange={handleFiltroChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition duration-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-pink-700 focus:outline-none focus:ring-4 focus:ring-pink-100"
              >
                Buscar
              </button>
              <button
                type="button"
                onClick={handleLimpiar}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition duration-200 hover:border-pink-200 hover:bg-pink-50 focus:outline-none focus:ring-4 focus:ring-pink-100"
              >
                Limpiar
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => {
                const active = filtro.status === filter.value;
                return (
                  <button
                    key={filter.value || "all"}
                    type="button"
                    onClick={() => handleQuickStatus(filter.value)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition duration-200 ${
                      active
                        ? "border-pink-500 bg-pink-50 text-pink-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-pink-200 hover:bg-pink-50"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </form>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-[0_20px_60px_rgba(236,72,153,0.10)] backdrop-blur">
          <div className="hidden xl:grid grid-cols-[2.1fr_1.1fr_1fr_0.95fr_1fr_0.8fr] gap-4 border-b border-gray-100 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
            <span>Responsable</span>
            <span>Curso</span>
            <span>Periodo</span>
            <span>Estado</span>
            <span>Monto</span>
            <span></span>
          </div>

          {loading ? (
            <div className="px-6 py-14 text-center text-sm text-gray-400">
              Cargando cuotas...
            </div>
          ) : pagos.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-sm font-medium text-gray-700">
                No se encontraron cuotas.
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Proba con otros filtros o registra un nuevo pago.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden xl:block">
                {pagos.map((pago) => (
                  <div
                    key={pago.id_pagos}
                    onClick={() => router.push(`/pagos/${pago.id_pagos}`)}
                    className="grid cursor-pointer grid-cols-[2.1fr_1.1fr_1fr_0.95fr_1fr_0.8fr] items-center gap-4 border-b border-gray-50 px-6 py-4 transition duration-150 hover:bg-pink-50/70 last:border-b-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {pago.guardian_name || pago.nombre_apellido}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {pago.student_name || "Sin alumno"} | DNI {pago.dni}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {pago.course_name || "Sin curso"}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {pago.course_level || "Nivel no definido"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {formatPeriodo(pago.period_year, pago.period_month)}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Vence {formatFecha(pago.due_date)}
                      </p>
                    </div>
                    <StatusPill value={pago.charge_status} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatMonto(pago.monto)}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Saldo {formatMonto(pago.balance)}
                      </p>
                    </div>
                    <div className="text-right text-sm font-semibold text-pink-600">
                      Ver
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 p-4 xl:hidden">
                {pagos.map((pago) => (
                  <PaymentCard
                    key={pago.id_pagos}
                    pago={pago}
                    formatFecha={formatFecha}
                    formatPeriodo={formatPeriodo}
                    formatMonto={formatMonto}
                    onClick={() => router.push(`/pagos/${pago.id_pagos}`)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/85 px-5 py-4 shadow-[0_20px_60px_rgba(236,72,153,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {showingFrom}-{showingTo} de {pagination.total} cuotas.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <PaginationButton
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                Anterior
              </PaginationButton>

              <span className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700">
                Pagina {page} de {pagination.totalPages}
              </span>

              <PaginationButton
                disabled={page >= pagination.totalPages}
                onClick={() => goToPage(page + 1)}
                variant="primary"
              >
                Siguiente
              </PaginationButton>
            </div>
          </div>
        )}

        {pagos.length > 0 && (
          <p className="mt-3 text-right text-xs text-gray-400">
            {pagos.length} cuota{pagos.length !== 1 ? "s" : ""} en esta pagina.
          </p>
        )}
      </div>
    </div>
  );
}
