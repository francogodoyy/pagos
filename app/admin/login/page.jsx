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
    <div className="min-h-screen bg-gradient-to-br from-pink-200 to-pink-300 p-4">
      {/* Logo centrado */}
      <div className="flex justify-center mb-4">
        <img src="/shine.jpeg" alt="Logo Shine" className="w-24 h-24 object-contain" />
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
          <div className="bg-white shadow-md rounded p-4">
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
                  <span>Monto: ${pago.monto}</span>
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
