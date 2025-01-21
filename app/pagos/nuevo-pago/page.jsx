"use client" 

import { useState } from "react"

export default function NuevoPago() {
    const [formData, setFormData] = useState({
        nombre_apellido: "",
        dni: "",
        monto: "",
        fecha_pago: "",
        descripcion: "",
    });
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await fetch("/api/pagos", {
            method: "POST",
            headers: { "Content-Type": "apllication/json" },
            body: JSON.stringify(formData),
        });

        if (res.ok) {
            setSuccess(true);
        } else {
            alert("Error al registrar el pago");
        }
    };

    if (success) {
        return <p>Pago registrado exitosamente!</p>;
    }

    return (
        <form onSubmit={handleSubmit}>
            <h1>Registrar Pago </h1>
            <input
            type="text"
            name="nombre_apellido"
            placeholder="Nombre y Apellido"
            value={formData.nombre_apellido}
            onChange={handleChange}
            required
            />
            <input
            type="text"
            name="dni"
            placeholder="DNI del alumno"
            value={formData.dni}
            onChange={handleChange}
            required
            />
            <input
            type="number"
            name="monto"
            placeholder="Monto"
            value={formData.monto}
            onChange={handleChange}
            required
            />
            <input
            type="date"
            name="fecha_pago"
            value={formData.fecha_pago}
            onChange={handleChange}
            required
            />
            <textarea
        name="descripcion"
        placeholder="Descripción"
        value={formData.descripcion}
        onChange={handleChange}
        required
      />
      <button type="submit">Registrar Pago</button>
        </form>
    );
}