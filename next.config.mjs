/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Doctor photos uploaded to Supabase Storage (doctor-photos bucket)
    // are served from https://<project-ref>.supabase.co/storage/v1/object/public/...
    // — next/image refuses external hosts it doesn't know about, so this
    // allow-lists any Supabase project's public storage URLs.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
