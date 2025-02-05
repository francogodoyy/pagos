/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
      appDir: true, 
    },
    redirects: async () => {
      return [
        {
          source: '/',
          destination: '/admin/login',
          permanent: true, 
        },
      ];
    },
  };
export default nextConfig;
