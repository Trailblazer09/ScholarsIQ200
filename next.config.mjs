/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image uploads are sent as base64 data URLs through the /api/chat route
  // handler, which has no restrictive body-size limit by default.
};

export default nextConfig;
