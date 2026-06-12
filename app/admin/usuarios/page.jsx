"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const roleLabels = {
  owner: "Propietario",
  admin: "Administrador",
  assistant: "Asistente",
};

const roleColors = {
  owner: "bg-purple-50 text-purple-700 border-purple-200",
  admin: "bg-blue-50 text-blue-700 border-blue-200",
  assistant: "bg-gray-50 text-gray-600 border-gray-200",
};

const statusColors = {
  active: "bg-emerald-50 text-emerald-600",
  disabled: "bg-red-50 text-red-600",
};

export default function AdminUsuarios() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "assistant" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !["owner", "admin"].includes(session.user.role)) {
      router.push("/admin/login");
      return;
    }
    cargarUsuarios();
  }, [session, status, router]);

  const cargarUsuarios = async () => {
    try {
      const res = await fetch("/api/usuarios");
      if (res.ok) {
        setUsuarios(await res.json());
      } else {
        setError("Error al cargar usuarios");
      }
    } catch (err) {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ email: "", password: "", role: "assistant" });
        await cargarUsuarios();
      } else {
        const msg = await res.text();
        setError(msg);
      }
    } catch {
      setError("Error al crear usuario");
    } finally {
      setSaving(false);
    }
  };

  const handleCambiarRol = async (id, role) => {
    try {
      const res = await fetch("/api/usuarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      if (res.ok) {
        await cargarUsuarios();
      } else {
        const msg = await res.text();
        setError(msg);
      }
    } catch {
      setError("Error al actualizar rol");
    }
  };

  const handleDesactivar = async (id) => {
    if (!confirm("Desactivar este usuario?")) return;
    try {
      const res = await fetch("/api/usuarios", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await cargarUsuarios();
      } else {
        const msg = await res.text();
        setError(msg);
      }
    } catch {
      setError("Error al desactivar usuario");
    }
  };

  const isOwner = session?.user?.role === "owner";

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
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(236,72,153,0.10)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-500">
              Shine
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900">
              Usuarios
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Gestiona los usuarios de tu institucion.
            </p>
          </div>
          <div className="flex gap-2">
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center justify-center rounded-xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-pink-700 focus:outline-none focus:ring-4 focus:ring-pink-100"
              >
                {showForm ? "Cancelar" : "Nuevo usuario"}
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push("/pagos")}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition duration-200 hover:border-pink-200 hover:bg-pink-50 focus:outline-none focus:ring-4 focus:ring-pink-100"
            >
              Volver
            </button>
          </div>
        </div>

        {showForm && (
          <div className="mb-6 rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(236,72,153,0.08)] backdrop-blur">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
              Nuevo usuario
            </h2>
            <form onSubmit={handleCrear} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-gray-500">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition duration-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-gray-500">Contrasena</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 caracteres"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition duration-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                />
              </div>
              <div className="w-40">
                <label className="mb-1 block text-xs font-semibold text-gray-500">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition duration-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
                >
                  <option value="admin">Administrador</option>
                  <option value="assistant">Asistente</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-pink-600 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-300 focus:outline-none focus:ring-4 focus:ring-pink-100"
              >
                {saving ? "Creando..." : "Crear"}
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-white/70 bg-white/90 p-10 text-center text-sm text-gray-400 shadow-[0_20px_60px_rgba(236,72,153,0.08)]">
            Cargando usuarios...
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-[0_20px_60px_rgba(236,72,153,0.10)]">
            <div className="hidden grid-cols-[1fr_1fr_0.7fr_0.6fr_0.5fr] gap-4 border-b border-gray-100 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 sm:grid">
              <span>Email</span>
              <span>Rol</span>
              <span>Estado</span>
              <span>Registro</span>
              <span></span>
            </div>

            {usuarios.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-gray-400">
                No hay usuarios
              </div>
            ) : (
              usuarios.map((u) => (
                <div
                  key={u.id}
                  className="grid grid-cols-1 gap-3 border-b border-gray-50 px-6 py-4 last:border-b-0 sm:grid-cols-[1fr_1fr_0.7fr_0.6fr_0.5fr] sm:items-center"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{u.email}</p>
                    {u.email === session?.user?.email && (
                      <span className="text-xs text-pink-500">(vos)</span>
                    )}
                  </div>
                  <div>
                    {isOwner && u.role !== "owner" ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleCambiarRol(u.id, e.target.value)}
                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 outline-none focus:border-pink-400"
                      >
                        <option value="admin">Administrador</option>
                        <option value="assistant">Asistente</option>
                      </select>
                    ) : (
                      <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${roleColors[u.role] || "bg-gray-50"}`}>
                        {roleLabels[u.role] || u.role}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusColors[u.status]}`}>
                      {u.status === "active" ? "Activo" : "Desactivado"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(u.created_at).toLocaleDateString("es-ES")}
                  </div>
                  <div className="flex justify-end">
                    {isOwner && u.role !== "owner" && u.status === "active" && (
                      <button
                        type="button"
                        onClick={() => handleDesactivar(u.id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition duration-200 hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100"
                      >
                        Desactivar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
