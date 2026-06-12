# Shine Pagos

Sistema de gestión de pagos para una escuela de inglés. Multi-tenant, SaaS-ready.

## Demo en vivo

[https://shine-pagos.vercel.app](https://shine-pagos.vercel.app/)

---

## Funcionalidades

###  Gestión de cuotas
- **Registro de cuotas** — Alta con datos del responsable, alumno, curso y período
- **Listado con filtros** — Búsqueda por DNI, responsable, curso, estado y período
- **Estados automáticos** — Las cuotas se marcan como pagadas, parciales, pendientes, vencidas o canceladas según corresponda
- **Pagos parciales** — Se pueden registrar pagos que cubran solo una parte de la cuota
- **Cancelación y eliminación** — Soft delete (cancelar) y hard delete (eliminar) con permisos según rol

###  Dashboard
- **Métricas en vivo** — Cobrado del mes, pendiente total, vencido y alumnos activos
- **Gráfico de barras** — Historial de cobranza de los últimos 12 meses
- **Gráfico de dona** — Distribución de estados de cuotas
- **Gráfico de área** — Evolución y tendencia de cobranza
- **Indicador de tendencia** — Flecha verde/roja con variación porcentual vs mes anterior

###  Emails automáticos
- **Comprobante de pago** — Al registrar un pago, se envía un recibo con detalle de la cuota al responsable
- **Recordatorio de vencimiento** — El cron diario envía alertas a responsables con cuotas vencidas
- **Templates responsivos** — Diseño adaptado para móvil y desktop via Resend

###  Roles y permisos
- **Owner** — Acceso total: crear/desactivar usuarios, eliminar cuotas, gestionar todo
- **Admin** — Puede cancelar cuotas, ver usuarios (solo lectura), acceder al dashboard
- **Assistant** — Solo listar cuotas, registrar pagos y ver dashboard
- **Gestión de usuarios** — Pantalla para crear, cambiar rol y desactivar usuarios

###  Filtro por mes en Cobrado Visible
- Selector de mes en la tarjeta de "Cobrado visible" que muestra el total recaudado en ese período
- Se actualiza automáticamente al volver del detalle de cuota

###  Reportes
- **Exportar a Excel** — Descarga todas las cuotas (con filtros aplicados) a un archivo `.xlsx` con formato profesional
- **Comprobante PDF** — Generación de PDF individual por cuota con jsPDF

###  Monitoreo
- **Sentry** — Captura de errores en frontend y backend con trazabilidad completa
- **Auditoría** — Registro de cambios y cancelaciones en cada cuota

---

##  Stack tecnológico

| Tecnología | Uso |
|---|---|
| [Next.js 16](https://nextjs.org/) | Framework full-stack (App Router) |
| [React 19](https://react.dev/) | Librería de UI |
| [NextAuth.js v4](https://next-auth.js.org/) | Autenticación con JWT |
| [MySQL2](https://github.com/sidorares/node-mysql2) | Base de datos relacional |
| [Tailwind CSS](https://tailwindcss.com/) | Estilos utilitarios |
| [Recharts](https://recharts.org/) | Gráficos del dashboard |
| [Resend](https://resend.com/) | Envío de emails transaccionales |
| [Sentry](https://sentry.io/) | Monitoreo de errores |
| [SheetJS (xlsx)](https://sheetjs.com/) | Exportación a Excel |
| [bcryptjs](https://github.com/dcodeIO/bcryptjs) | Hash de contraseñas |
| [Joi](https://joi.dev/) | Validación de datos |
| [jsPDF](https://github.com/parallax/jsPDF) | Generación de PDFs |
| [Vercel](https://vercel.com/) | Hosting + Cron Jobs |

---

##  Estructura del proyecto

```
pagos/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]   # NextAuth config
│   │   ├── pagos/               # CRUD de cuotas
│   │   │   ├── [id]/            # Detalle, editar, cancelar
│   │   │   ├── export/          # Exportar a Excel
│   │   │   └── total-mes/       # Total cobrado por mes
│   │   ├── dashboard/           # Datos para gráficos
│   │   ├── usuarios/            # CRUD de usuarios
│   │   ├── catalogos/           # Búsqueda de responsables/cursos
│   │   ├── cron/                # Tareas programadas
│   │   └── register-admin/      # Registro de organización
│   ├── admin/
│   │   ├── login/               # Inicio de sesión
│   │   ├── register/            # Registro de escuela
│   │   └── usuarios/            # Gestión de usuarios
│   ├── pagos/                   # Listado de cuotas
│   │   └── [id]/                # Detalle de cuota
│   ├── dashboard/               # Dashboard con gráficos
│   └── nuevo-pago/              # Registro de pago
├── utils/
│   ├── db.js                    # Conexión MySQL
│   ├── charges.js               # Lógica de negocio
│   ├── email.js                 # Cliente Resend
│   ├── email-templates.js       # Templates de emails
│   └── pdf.js                   # Generación de PDFs
├── database/
│   └── saas-schema.sql          # Schema completo
├── tests/
│   └── charges.test.js          # Tests unitarios
├── middleware.js                # Protección de rutas
├── sentry.client.config.js      # Sentry frontend
├── sentry.server.config.js      # Sentry backend
├── instrumentation.js           # Sentry init
└── vitest.config.mjs            # Config de tests
```

---

##  Correr el proyecto localmente

### 1. Clonar e instalar

```bash
git clone https://github.com/francogodoyy/pagos.git
cd pagos
npm install
```

### 2. Configurar `.env.local`

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=pagos
DB_PORT=3306

# NextAuth
NEXTAUTH_SECRET=tu_secreto
NEXTAUTH_URL=http://localhost:3000

# Cron
CRON_SECRET=cron-secret-2026

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev

# Sentry
SENTRY_DSN=https://xxxx@xxxx.ingest.sentry.io/xxxxx
SENTRY_ORG=my-org
SENTRY_PROJECT=my-project
```

### 3. Base de datos

Ejecutar `database/saas-schema.sql` en tu MySQL para crear las tablas.

### 4. Iniciar

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) → te redirige a `/admin/register` para crear la primera organización.

---

##  Scripts

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter
npm test             # Tests unitarios
npm run test:watch   # Tests en modo watch
```

---

##  Roles del sistema

| Rol | Crear cuotas | Editar | Cancelar | Eliminar | Dashboard | Gestionar usuarios |
|-----|:-:|:-:|:-:|:-:|:-:|:-:|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ❌ | ✅ | Solo lectura |
| **Assistant** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |

---

##  Licencia

Uso privado / educativo.
