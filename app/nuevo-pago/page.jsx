"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const initialFormState = {
  guardian_name: "",
  student_name: "",
  dni: "",
  correo: "",
  telefono: "",
  direccion: "",
  localidad: "",
  course_name: "",
  course_level: "",
  monto: "",
  due_date: "",
  method: "cash",
  reference: "",
  notes: "",
};

const fieldBase =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition duration-200 placeholder:text-gray-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-100";

function Field({ label, required = false, className = "", children, hint }) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {required && (
          <span className="rounded-full bg-pink-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-pink-600">
            Requerido
          </span>
        )}
      </div>
      {children}
      {hint && <p className="mt-2 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-500">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-gray-900">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">{description}</p>
    </div>
  );
}

function SummaryLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function CatalogPanel({ title, query, onQueryChange, items, loading, onSelect, selectedLabel, placeholder, emptyText }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
            Catálogo
          </p>
          <h3 className="mt-1 text-base font-semibold text-gray-900">{title}</h3>
        </div>
        {selectedLabel && (
          <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700">
            {selectedLabel}
          </span>
        )}
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={placeholder}
        className={`${fieldBase} mt-4`}
      />

      <div className="mt-4 max-h-56 space-y-2 overflow-auto pr-1">
        {loading ? (
          <p className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500">Buscando...</p>
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
            {emptyText}
          </p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-left transition duration-200 hover:border-pink-200 hover:bg-pink-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-500">{item.subtitle}</p>
                </div>
                <span className="text-xs font-semibold text-pink-600">Usar</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function NuevoPago() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormState);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [familyQuery, setFamilyQuery] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const [familyItems, setFamilyItems] = useState([]);
  const [studentItems, setStudentItems] = useState([]);
  const [courseItems, setCourseItems] = useState([]);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);
  const [courseLoading, setCourseLoading] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const handleVolver = () => {
    router.push("/pagos");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatMonto = (value) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(Number(value) || 0);

  const preview = useMemo(
    () => ({
      responsable: formData.guardian_name || "Sin responsable",
      alumno: formData.student_name || "Sin alumno",
      curso: formData.course_name || "Sin curso",
      nivel: formData.course_level || "Nivel no definido",
      monto: formatMonto(formData.monto),
      vencimiento: formData.due_date || "Sin fecha",
      metodo: formData.method || "cash",
      dni: formData.dni || "Sin DNI",
    }),
    [formData]
  );

  const fetchCatalog = async (type, query = "", extra = {}) => {
    const params = new URLSearchParams();
    params.append("type", type);
    params.append("limit", "12");
    if (query) params.append("query", query);
    if (extra.family_id) params.append("family_id", String(extra.family_id));

    const res = await fetch(`/api/catalogos?${params.toString()}`);
    if (!res.ok) {
      throw new Error("No se pudieron cargar los catalogos.");
    }

    return res.json();
  };

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      setFamilyLoading(true);
      try {
        const rows = await fetchCatalog("families", familyQuery);
        if (!alive) return;
        setFamilyItems(
          rows.map((item) => ({
            id: item.id,
            title: item.guardian_name || "Sin nombre",
            subtitle: `DNI ${item.dni || "sin dato"}${item.locality ? ` | ${item.locality}` : ""}`,
            raw: item,
          }))
        );
      } catch (err) {
        if (alive) setError(err.message || "Error al cargar familias");
      } finally {
        if (alive) setFamilyLoading(false);
      }
    }, 250);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [familyQuery]);

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      setStudentLoading(true);
      try {
        const rows = await fetchCatalog("students", studentQuery, {
          family_id: selectedFamilyId || undefined,
        });
        if (!alive) return;
        setStudentItems(
          rows.map((item) => ({
            id: item.id,
            title: item.full_name || "Sin nombre",
            subtitle: `${item.guardian_name || "Sin responsable"} | DNI ${item.dni || "sin dato"}`,
            raw: item,
          }))
        );
      } catch (err) {
        if (alive) setError(err.message || "Error al cargar alumnos");
      } finally {
        if (alive) setStudentLoading(false);
      }
    }, 250);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [studentQuery, selectedFamilyId]);

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      setCourseLoading(true);
      try {
        const rows = await fetchCatalog("courses", courseQuery);
        if (!alive) return;
        setCourseItems(
          rows.map((item) => ({
            id: item.id,
            title: item.name || "Sin curso",
            subtitle: `${item.level || "Nivel no definido"}${item.monthly_fee ? ` | ${formatMonto(item.monthly_fee)}` : ""}`,
            raw: item,
          }))
        );
      } catch (err) {
        if (alive) setError(err.message || "Error al cargar cursos");
      } finally {
        if (alive) setCourseLoading(false);
      }
    }, 250);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [courseQuery]);

  const useFamily = (item) => {
    const family = item.raw;
    setSelectedFamilyId(String(family.id));
    setSelectedStudentId("");
    setStudentQuery("");
    setFormData((prev) => ({
      ...prev,
      guardian_name: family.guardian_name || prev.guardian_name,
      dni: family.dni || prev.dni,
      correo: family.email || prev.correo,
      telefono: family.phone || prev.telefono,
      direccion: family.address || prev.direccion,
      localidad: family.locality || prev.localidad,
    }));
  };

  const useStudent = (item) => {
    const student = item.raw;
    setSelectedStudentId(String(student.id));
    setSelectedFamilyId(String(student.family_id));
    setFamilyQuery("");
    setFormData((prev) => ({
      ...prev,
      guardian_name: student.guardian_name || prev.guardian_name,
      student_name: student.full_name || prev.student_name,
      dni: student.dni || prev.dni,
    }));
  };

  const useCourse = (item) => {
    const course = item.raw;
    setSelectedCourseId(String(course.id));
    setFormData((prev) => ({
      ...prev,
      course_name: course.name || prev.course_name,
      course_level: course.level || prev.course_level,
      monto:
        prev.monto && String(prev.monto).trim() !== ""
          ? prev.monto
          : course.monthly_fee
            ? String(course.monthly_fee)
            : prev.monto,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.due_date) {
        throw new Error("La fecha de vencimiento es obligatoria.");
      }

      const [year, month, day] = formData.due_date.split("-").map(Number);
      const dueDateLocal = new Date(year, month - 1, day, 12, 0, 0);
      const dueDateISO = dueDateLocal.toISOString();

      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family_id: selectedFamilyId || null,
          student_id: selectedStudentId || null,
          course_id: selectedCourseId || null,
          guardian_name: formData.guardian_name,
          nombre_apellido: formData.guardian_name,
          student_name: formData.student_name,
          course_name: formData.course_name,
          course_level: formData.course_level,
          dni: formData.dni,
          monto: formData.monto,
          due_date: dueDateISO,
          payment_date: dueDateISO,
          fecha_pago: dueDateISO,
          method: formData.method,
          reference: formData.reference,
          notes: formData.notes,
          descripcion: formData.notes,
          correo: formData.correo,
          email: formData.correo,
          telefono: formData.telefono,
          phone: formData.telefono,
          direccion: formData.direccion,
          address: formData.direccion,
          localidad: formData.localidad,
          locality: formData.localidad,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setError("");
        return;
      }

      const errorMsg = await res.text();
      setError(errorMsg || "Error al registrar el pago");
    } catch (err) {
      setError(err.message || "Error inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.18),_transparent_40%),linear-gradient(135deg,#fdf2f8_0%,#fde7f3_45%,#fff1f2_100%)] px-4 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-2xl items-center justify-center">
          <div className="w-full rounded-3xl border border-white/70 bg-white/90 p-8 shadow-[0_20px_60px_rgba(236,72,153,0.12)] backdrop-blur">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <span className="text-2xl font-bold">OK</span>
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-500">
                Cuota registrada
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-gray-900">
                El movimiento se guardo correctamente
              </h1>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                Ya podes volver al historial para revisar el nuevo registro o cargar otra cuota.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleVolver}
                className="rounded-xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-pink-700 focus:outline-none focus:ring-4 focus:ring-pink-100"
              >
                Volver a pagos
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setFormData(initialFormState);
                  setSelectedFamilyId("");
                  setSelectedStudentId("");
                  setSelectedCourseId("");
                  setFamilyQuery("");
                  setStudentQuery("");
                  setCourseQuery("");
                }}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition duration-200 hover:border-pink-200 hover:bg-pink-50 focus:outline-none focus:ring-4 focus:ring-pink-100"
              >
                Cargar otra cuota
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.18),_transparent_40%),linear-gradient(135deg,#fdf2f8_0%,#fde7f3_45%,#fff1f2_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(236,72,153,0.10)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <SectionTitle
            eyebrow="Alta de cuota"
            title="Registrar una nueva cuota"
            description="Cargá responsable, alumno, curso y vencimiento en un flujo más ordenado para que el registro quede listo de una."
          />

          <button
            type="button"
            onClick={handleVolver}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition duration-200 hover:border-pink-200 hover:bg-pink-50 focus:outline-none focus:ring-4 focus:ring-pink-100"
          >
            Volver al historial
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.55fr]">
          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(236,72,153,0.08)] backdrop-blur">
              <div className="rounded-3xl bg-gradient-to-br from-pink-300 to-rose-300 p-5 text-white shadow-lg shadow-pink-200">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-100">
                  Guía rápida
                </p>
                <h2 className="mt-2 text-xl font-semibold">Orden recomendado</h2>
                <p className="mt-2 text-sm leading-6 text-pink-50">
                  1. Elegí una familia o alumno existente
                  <br />
                  2. Reutilizá un curso del catálogo
                  <br />
                  3. Completá vencimiento, monto y medio de pago
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <SummaryLine label="Responsable" value={preview.responsable} />
                <SummaryLine label="Alumno" value={preview.alumno} />
                <SummaryLine label="Curso" value={preview.curso} />
                <SummaryLine label="Monto" value={preview.monto} />
                <SummaryLine label="Vencimiento" value={preview.vencimiento} />
              </div>
            </div>

            <div className="grid gap-4">
              <CatalogPanel
                title="Familias"
                query={familyQuery}
                onQueryChange={setFamilyQuery}
                items={familyItems}
                loading={familyLoading}
                onSelect={useFamily}
                selectedLabel={selectedFamilyId ? `ID ${selectedFamilyId}` : ""}
                placeholder="Buscar por responsable, DNI o correo"
                emptyText="No encontramos familias con ese criterio."
              />

              <CatalogPanel
                title="Alumnos"
                query={studentQuery}
                onQueryChange={setStudentQuery}
                items={studentItems}
                loading={studentLoading}
                onSelect={useStudent}
                selectedLabel={selectedStudentId ? `ID ${selectedStudentId}` : ""}
                placeholder="Buscar por nombre de alumno"
                emptyText="Primero elegí una familia o probá otra búsqueda."
              />

              <CatalogPanel
                title="Cursos"
                query={courseQuery}
                onQueryChange={setCourseQuery}
                items={courseItems}
                loading={courseLoading}
                onSelect={useCourse}
                selectedLabel={selectedCourseId ? `ID ${selectedCourseId}` : ""}
                placeholder="Buscar por curso o nivel"
                emptyText="No encontramos cursos con ese criterio."
              />
            </div>
          </aside>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(236,72,153,0.10)] backdrop-blur sm:p-8"
          >
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Datos de la cuota</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Completá los campos necesarios para guardar un registro claro y fácil de revisar.
                </p>
              </div>
              <span className="inline-flex w-fit rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-pink-600">
                Formulario
              </span>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Responsable" required>
                <input
                  type="text"
                  name="guardian_name"
                  placeholder="Ej: Maria Lopez"
                  value={formData.guardian_name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                  className={fieldBase}
                />
              </Field>

              <Field label="DNI" required hint="Solo numeros, para buscar mas rapido.">
                <input
                  type="text"
                  name="dni"
                  placeholder="Ej: 12345678"
                  value={formData.dni}
                  onChange={handleChange}
                  required
                  inputMode="numeric"
                  className={fieldBase}
                />
              </Field>

              <Field label="Alumno" required>
                <input
                  type="text"
                  name="student_name"
                  placeholder="Ej: Juan Lopez"
                  value={formData.student_name}
                  onChange={handleChange}
                  required
                  className={fieldBase}
                />
              </Field>

              <Field label="Curso" required>
                <input
                  type="text"
                  name="course_name"
                  placeholder="Ej: First Certificate"
                  value={formData.course_name}
                  onChange={handleChange}
                  required
                  className={fieldBase}
                />
              </Field>

              <Field label="Nivel">
                <input
                  type="text"
                  name="course_level"
                  placeholder="Ej: B1"
                  value={formData.course_level}
                  onChange={handleChange}
                  className={fieldBase}
                />
              </Field>

              <Field label="Correo electronico">
                <input
                  type="email"
                  name="correo"
                  placeholder="Ej: nombre@dominio.com"
                  value={formData.correo}
                  onChange={handleChange}
                  autoComplete="email"
                  className={fieldBase}
                />
              </Field>

              <Field label="Telefono">
                <input
                  type="tel"
                  name="telefono"
                  placeholder="Ej: 11 2345 6789"
                  value={formData.telefono}
                  onChange={handleChange}
                  autoComplete="tel"
                  className={fieldBase}
                />
              </Field>

              <Field label="Localidad">
                <input
                  type="text"
                  name="localidad"
                  placeholder="Ej: Rosario"
                  value={formData.localidad}
                  onChange={handleChange}
                  autoComplete="address-level2"
                  className={fieldBase}
                />
              </Field>

              <Field label="Direccion">
                <input
                  type="text"
                  name="direccion"
                  placeholder="Ej: Calle 123"
                  value={formData.direccion}
                  onChange={handleChange}
                  autoComplete="street-address"
                  className={fieldBase}
                />
              </Field>

              <Field label="Monto" required>
                <input
                  type="number"
                  name="monto"
                  placeholder="Ej: 15000"
                  value={formData.monto}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className={fieldBase}
                />
              </Field>

              <Field label="Fecha de vencimiento" required>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  required
                  className={fieldBase}
                />
              </Field>

              <Field label="Medio de pago">
                <select
                  name="method"
                  value={formData.method}
                  onChange={handleChange}
                  className={fieldBase}
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="card">Tarjeta</option>
                  <option value="debit">Débito</option>
                  <option value="other">Otro</option>
                </select>
              </Field>

              <Field label="Referencia">
                <input
                  type="text"
                  name="reference"
                  placeholder="Ej: N° de operación, comprobante o alias"
                  value={formData.reference}
                  onChange={handleChange}
                  className={fieldBase}
                />
              </Field>

              <Field label="Observaciones" className="md:col-span-2">
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Anotaciones internas, acuerdos o detalles del pago"
                  value={formData.notes}
                  onChange={handleChange}
                  className={`${fieldBase} resize-none`}
                />
              </Field>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleVolver}
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition duration-200 hover:border-pink-200 hover:bg-pink-50 focus:outline-none focus:ring-4 focus:ring-pink-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-pink-400 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-pink-400 focus:outline-none focus:ring-4 focus:ring-pink-100"
              >
                {isSubmitting ? "Guardando..." : "Guardar cuota"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
