"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { generatePDF } from "@/utils/pdf";
import { useRouter } from "next/navigation";

export default function Pagos() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [filtro, setFiltro] = useState({ dni: "", nombre_apellido: "" });
  const [pagos, setPagos] = useState([]);
  const [error, setError] = useState("");

  const handleNuevoPago = () => {
    router.push("/pagos/nuevo-pago");
  };

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/admin/login");
    } else if (session.user.role !== "admin") {
      router.push("/admin/login");
    }
  }, [session, status, router]);

  if (status === "loading" || !session) {
    return <p>Cargando...</p>;
  }

  const cargarPagos = async () => {
    try {
      const params = new URLSearchParams();
      if (filtro.dni) params.append("dni", filtro.dni);
      if (filtro.nombre_apellido)
        params.append("nombre_apellido", filtro.nombre_apellido);

      const res = await fetch(`/api/pagos?${params.toString()}`);

      if (res.ok) {
        const data = await res.json();
        setPagos(data);
        setError(""); // Limpiar errores si todo va bien
      } else {
        throw new Error("Error al cargar los pagos.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarPagos();
  }, []);

  const handlePDF = () => {
    if (pagos.length === 0) {
      setError("No hay pagos para generar un PDF.");
      return;
    }
    setError(""); //Clean errors if no any problems
    generatePDF(pagos);
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltro({ ...filtro, [name]: value });
  };

  const handleBuscar = () => {
    //validation before carry out the search
    if (filtro.dni && !/^\d{8}$/.test(filtro.dni)) {
      setError("El DNI debe tener 8 dígitos.");
      return;
    }

    setError(""); //Clean errors if the validation is success
    cargarPagos();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
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
            className="shadow appeareance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <input
            type="text"
            name="dni"
            placeholder="Filtrar por DNI"
            value={filtro.dni}
            onChange={handleFiltroChange}
            className="shadow appeareance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <button
            onClick={handleBuscar}
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

      {pagos.length > 0 ? (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Lista de Pagos
          </h2>
          <ul className="bg-white shadow-md rounded p-4">
            {pagos.map((pago) => (
              <li
                key={pago.id}
                className="flex justify-between items-center border-b py-2"
              >
                <div>
                  <span>
                    {pago.nombre_apellido} - {pago.dni}
                  </span>
                  <p className="text-sm text-gray-600">Correo: {pago.correo}</p>
                  <p className="text-sm text-gray-600">
                    Localidad: {pago.localidad}
                  </p>
                  <p className="text-sm text-gray-600">
                    Teléfono: {pago.telefono}
                  </p>
                  <p className="text-sm text-gray-600">
                    Dirección: {pago.direccion}
                  </p>
                </div>
                <div>
                  <span>{pago.fecha_pago}</span>
                  <p>{pago.descripcion}</p>
                  <p>${pago.monto}</p>
                </div>
              </li>
            ))}
          </ul>
          <button
            onClick={handlePDF}
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
