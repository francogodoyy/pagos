"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NuevoPago() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre_apellido: "",
    dni: "",
    monto: "",
    fecha_pago: "",
    descripcion: "",
    correo: "", 
    localidad: "", 
    telefono: "", 
    direccion: "", 
  });
  const [success, setSuccess] = useState(false);

  const handleVolver = () => {
    router.push("/pagos");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/pagos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setSuccess(true);
    } else {
      alert("Error al registrar el pago");
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 space-y-4">
        <p className="text-green-600 font-bold text-lg">¡Pago Registrado!</p>
        <button
          onClick={handleVolver}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
        >
          Volver a la sección de pagos
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white rounded-lg shadow-md p-8 space-y-6"
      >
        <h1 className="text-2xl font-semibold text-gray-800 text-center">
          Registrar Pago
        </h1>
        <div>
          <label htmlFor="nombre_apellido" className="block text-sm font-medium text-gray-600">
            Nombre y Apellido
          </label>
          <input
            type="text"
            id="nombre_apellido"
            name="nombre_apellido"
            placeholder="Nombre y Apellido"
            value={formData.nombre_apellido}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="dni" className="block text-sm font-medium text-gray-600">
            DNI
          </label>
          <input
            type="text"
            id="dni"
            name="dni"
            placeholder="DNI"
            value={formData.dni}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="correo" className="block text-sm font-medium text-gray-600">
            Correo electrónico
          </label>
          <input
            type="email"
            id="correo"
            name="correo"
            placeholder="Correo electrónico"
            value={formData.correo}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="localidad" className="block text-sm font-medium text-gray-600">
            Localidad
          </label>
          <input
            type="text"
            id="localidad"
            name="localidad"
            placeholder="Localidad"
            value={formData.localidad}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-600">
            Teléfono
          </label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            placeholder="Teléfono"
            value={formData.telefono}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="direccion" className="block text-sm font-medium text-gray-600">
            Dirección
          </label>
          <input
            type="text"
            id="direccion"
            name="direccion"
            placeholder="Dirección"
            value={formData.direccion}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="monto" className="block text-sm font-medium text-gray-600">
            Monto
          </label>
          <input
            type="number"
            id="monto"
            name="monto"
            placeholder="Monto"
            value={formData.monto}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="fecha_pago" className="block text-sm font-medium text-gray-600">
            Fecha de Pago
          </label>
          <input
            type="date"
            id="fecha_pago"
            name="fecha_pago"
            value={formData.fecha_pago}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-600">
            Descripción
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            placeholder="Descripción"
            value={formData.descripcion}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
        >
          Registrar Pago
        </button>
        <button
          onClick={handleVolver}
          className="w-full bg-gray-600 text-white py-2 rounded-lg mt-4 hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:outline-none transition duration-200"
        >
          Volver
        </button>
      </form>
    </div>
  );
}