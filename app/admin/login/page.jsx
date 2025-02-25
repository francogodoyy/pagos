"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!email.trim()) newErrors.email = "El email es obligatorio.";
    if (!password.trim()) newErrors.password = "La contraseña es obligatoria.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({}); //Clean errors if no any problem

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res.ok) {
      router.push("/pagos");
    } else {
      setErrors({ general: "Credenciales incorrectas." });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-200 to-pink-300">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/shine.jpeg" alt="Logo" className="w-50 h-20 object-contain" />
        </div>
  
        <h1 className="text-2xl font-semibold text-center text-gray-700 mb-6">
          Iniciar Sesión
        </h1>
  
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-600">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Ingresa tu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none border-gray-300"
              required
            />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
          </div>
  
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-600">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-pink-400 focus:outline-none border-gray-300"
              required
            />
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
          </div>
  
          {errors.general && (
            <p className="text-sm text-red-600 text-center mt-4">{errors.general}</p>
          )}
  
          <button
            type="submit"
            className="w-full py-2 text-white bg-pink-500 rounded-lg hover:bg-pink-600 focus:ring-2 focus:ring-pink-400 focus:outline-none transition duration-200"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );  
}
