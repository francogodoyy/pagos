import mysql from "mysql2/promise";

// Evita la creación de múltiples pools de conexiones en desarrollo (por hot reloading)
// y en producción (en funciones serverless de Vercel/Railway), previniendo saturar la base de datos en Aiven.
let pool;

if (!global.dbPool) {
  global.dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
      rejectUnauthorized: false,
    },
    waitForConnections: true,
    connectionLimit: 3, // Límite por instancia serverless (óptimo para Aiven)
    queueLimit: 0,
  });
}

pool = global.dbPool;

export const db = pool;