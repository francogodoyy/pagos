# Shine Pagos

Sistema de gestión de pagos para una escuela de inglés. Permite al administrador registrar, consultar, editar y eliminar pagos de cuotas mensuales, con generación de comprobantes en PDF.

## Demo en vivo:[shine-pagos.vercel.app](https://shine-pagos.vercel.app)

---

## Capturas de pantalla

> _Próximamente / agregar screenshots

---

## Funcionalidades

-  **Autenticación segura** — Login y registro de administrador con NextAuth.js y contraseñas hasheadas con bcryptjs
-  **Registro de pagos** — Alta de nuevos pagos con datos
-  **Historial de pagos** — Listado completo de todos los pagos registrados
-  **Búsqueda por nombre** — Filtrado rápido de pagos por nombre
-  **Edición de pagos** — Modificación de registros existentes
-  **Eliminación de pagos** — Borrado de registros con confirmación
-  **Comprobante PDF** — Generación de comprobante de pago para entregar al alumno
-  **Rutas protegidas** — Middleware que restringe el acceso al dashboard solo a usuarios autenticados

---

##  Stack tecnológico

| Tecnología | Uso |
|---|---|
| [Next.js 15](https://nextjs.org/) | Framework full-stack (frontend + API Routes) |
| [React 19](https://react.dev/) | Librería de UI |
| [NextAuth.js v4](https://next-auth.js.org/) | Autenticación |
| [MySQL2](https://github.com/sidorares/node-mysql2) | Base de datos relacional |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Hash de contraseñas |
| [Joi](https://joi.dev/) | Validación de datos |
| [jsPDF](https://github.com/parallax/jsPDF) | Generación de PDFs |
| [Material UI](https://mui.com/) | Componentes de interfaz |
| [Tailwind CSS](https://tailwindcss.com/) | Estilos utilitarios |
| [Vercel](https://vercel.com/) | Deploy |
| [Aiven](https://https://aiven.io/) | Base de Datos |

---

##  Estructura del proyecto

```
pagos/
├── app/
│   ├── api/          # API Routes (backend)
│   ├── dashboard/    # Pantalla principal del admin
│   ├── pagos/        # Gestión de pagos
│   └── ...
├── public/           # Archivos estáticos
├── utils/            # Funciones utilitarias
├── middleware.js     # Protección de rutas
└── ...
```

---

##  Correr el proyecto localmente

### 1. Clonar el repositorio

```
git clone https://github.com/francogodoyy/pagos.git
```

### 2. Instalar dependencias

```
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
# Base de datos
DATABASE_HOST=tu_host
DATABASE_USER=tu_usuario
DATABASE_PASSWORD=tu_contraseña
DATABASE_NAME=nombre_bd

# NextAuth
NEXTAUTH_SECRET=tu_secreto
NEXTAUTH_URL=http://localhost:3000
```

### 4. Iniciar el servidor de desarrollo

```
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

---

##  Base de datos

El proyecto utiliza **MySQL**. Asegurate de tener una instancia corriendo y crear la base de datos antes de iniciar el servidor.

>  El schema de la base de datos será agregado próximamente.

---

##  Scripts disponibles

```
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linter
```

---

##  Autor

**Franco Godoy**
[GitHub](https://github.com/francogodoyy)

---

##  Licencia

Este proyecto es de uso privado / educativo.
