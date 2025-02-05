/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'standalone', // Opcional, para entornos de producción en Vercel
    experimental: {
      appDir: true, // Si usas la carpeta app/
    },
};

export default nextConfig;
