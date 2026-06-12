/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/admin/login",
        permanent: true,
      },
    ];
  },
};

const { withSentryConfig } = await import("@sentry/nextjs");
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "my-org",
  project: process.env.SENTRY_PROJECT || "my-project",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
