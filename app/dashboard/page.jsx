"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

const COLORS = {
  paid: "#059669",
  partial: "#d97706",
  pending: "#6b7280",
  overdue: "#dc2626",
};

const statusLabels = {
  paid: "Pagado",
  partial: "Parcial",
  pending: "Pendiente",
  overdue: "Vencido",
};

function StatCard({ label, value, helper, color, trend }) {
  return (
    <div className="group rounded-2xl border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(236,72,153,0.08)] backdrop-blur transition duration-300 hover:shadow-[0_18px_50px_rgba(236,72,153,0.18)] hover:-translate-y-0.5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
        {label}
      </p>
      <p className={`mt-3 text-3xl font-bold ${color || "text-gray-900"}`}>
        {value}
      </p>
      <div className="mt-1 flex items-center gap-1.5">
        <p className="text-sm text-gray-500">{helper}</p>
        {trend !== undefined && (
          <span className={`text-xs font-semibold ${trend >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {trend >= 0 ? "\u2191" : "\u2193"} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, formatMonto }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-pink-600">
        {formatMonto(payload[0].value)}
      </p>
    </div>
  );
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (d.name === "Pagado" || d.name === "Parcial") {
    return (
      <div className="rounded-xl border border-gray-100 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
          <p className="text-xs font-semibold text-gray-500">{d.name}</p>
        </div>
        <p className="mt-1 text-sm font-bold text-gray-900">
          {d.value} cuota{d.value !== 1 ? "s" : ""}
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-gray-100 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
        <p className="text-xs font-semibold text-gray-500">{d.name}</p>
      </div>
      <p className="mt-1 text-sm font-bold text-gray-900">
        {d.value} cuota{d.value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !["admin", "owner", "assistant"].includes(session.user.role)) {
      router.push("/admin/login");
      return;
    }
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session, status, router]);

  const formatMonto = (monto) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(Number(monto) || 0);

  if (status === "loading" || !session || loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.18),_transparent_40%),linear-gradient(135deg,#fdf2f8_0%,#fde7f3_45%,#fff1f2_100%)] flex items-center justify-center px-4">
        <div className="rounded-2xl border border-white/70 bg-white/80 px-5 py-4 text-sm text-gray-600 shadow-[0_18px_50px_rgba(236,72,153,0.08)] backdrop-blur">
          Cargando...
        </div>
      </div>
    );
  }

  const history = data?.monthlyHistory || [];
  const pieData = (data?.statusDistribution || []).map((d) => ({
    name: statusLabels[d.status] || d.status,
    value: d.count,
    color: COLORS[d.status] || "#6b7280",
  }));

  const lastMonth = history.length >= 2 ? history[history.length - 1].total : 0;
  const prevMonth = history.length >= 2 ? history[history.length - 2].total : 0;
  const trend = prevMonth > 0 ? Math.round(((lastMonth - prevMonth) / prevMonth) * 100) : undefined;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.18),_transparent_40%),linear-gradient(135deg,#fdf2f8_0%,#fde7f3_45%,#fff1f2_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(236,72,153,0.10)] backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-500">
                Shine
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-900">
                Dashboard
              </h1>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Resumen de cobranza, alumnos y estado de cuotas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/pagos")}
              className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition duration-200 hover:border-pink-200 hover:bg-pink-50 focus:outline-none focus:ring-4 focus:ring-pink-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Volver a cuotas
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <StatCard
            label="Cobrado este mes"
            value={formatMonto(data?.monthlyCollected)}
            helper="Total del periodo actual."
            color="text-emerald-600"
            trend={trend}
          />
          <StatCard
            label="Pendiente total"
            value={formatMonto(data?.totalPending)}
            helper="Saldo pendiente + vencido."
            color="text-amber-600"
          />
          <StatCard
            label="Vencido total"
            value={formatMonto(data?.totalOverdue)}
            helper="Cuotas vencidas sin pagar."
            color="text-red-600"
          />
          <StatCard
            label="Alumnos activos"
            value={data?.activeStudents ?? 0}
            helper="Estudiantes activos."
            color="text-pink-600"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(236,72,153,0.08)] backdrop-blur transition duration-300 hover:shadow-[0_20px_60px_rgba(236,72,153,0.16)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Historial de cobranza
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Ultimos 12 meses
                </p>
              </div>
              <div className="hidden rounded-lg bg-pink-50 px-3 py-1.5 text-xs font-semibold text-pink-600 sm:block">
                {history.length > 0 ? `${history[history.length - 1]?.label} - ${history[0]?.label}` : ""}
              </div>
            </div>
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip formatMonto={formatMonto} />} cursor={{ fill: "#fdf2f8" }} />
                  <Bar
                    dataKey="total"
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                    animationBegin={0}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(236,72,153,0.08)] backdrop-blur transition duration-300 hover:shadow-[0_20px_60px_rgba(236,72,153,0.16)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
              Estado de cuotas
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Distribucion actual
            </p>
            <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
              <div className="h-56 w-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={4}
                      dataKey="value"
                      animationBegin={200}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} stroke="white" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip formatMonto={formatMonto} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-3 sm:w-auto">
                {pieData.map((item) => {
                  const total = pieData.reduce((s, d) => s + d.value, 0);
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  return (
                    <div key={item.name} className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full ring-2 ring-white"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="min-w-[80px] text-sm text-gray-600">{item.name}</span>
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: item.color }}
                        />
                      </div>
                      <span className="min-w-[32px] text-right text-sm font-semibold text-gray-900">
                        {item.value}
                      </span>
                      <span className="text-xs text-gray-400">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(236,72,153,0.08)] backdrop-blur transition duration-300 hover:shadow-[0_20px_60px_rgba(236,72,153,0.16)]">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Evolucion anual
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Tendencia de cobranza mes a mes
          </p>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip formatMonto={formatMonto} />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#ec4899"
                  strokeWidth={2}
                  fill="url(#areaGradient)"
                  animationBegin={100}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  dot={{ fill: "#ec4899", stroke: "white", strokeWidth: 2, r: 4 }}
                  activeDot={{ fill: "#ec4899", stroke: "white", strokeWidth: 2, r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
