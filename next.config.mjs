/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
      appDir: true, // Si estás usando la estructura de rutas con el directorio 'app'
    },
  };
  
  module.exports = nextConfig;