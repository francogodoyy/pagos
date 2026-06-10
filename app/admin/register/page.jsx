"use client";

import { useState } from "react";

export default function RegisterAdmin() {
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/register-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organization_name: organizationName,
        email,
        password,
      }),
    });

    if (res.ok) {
      setSuccess(true);
    } else {
      const message = await res.text();
      setError(message || "Error al registrar el usuario");
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-green-600 text-lg font-bold">
          Admin registrado exitosamente.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-200 to-pink-300 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl space-y-4"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-500">
            Configuracion inicial
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">
            Registrar organizacion y admin
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Este paso crea la primera cuenta propietaria del SaaS.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Nombre de la organizacion
          </label>
          <input
            type="text"
            placeholder="Ej: Shine Ingles"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            placeholder="admin@dominio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            placeholder="Minimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-pink-700 focus:outline-none focus:ring-4 focus:ring-pink-100"
        >
          Registrar
        </button>
      </form>
    </div>
  );
}
