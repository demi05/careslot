import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CareSlot — Health Appointments",
    short_name: "CareSlot",
    description: "Book hospital appointments, get reminders, and manage visits — built for low-connectivity use.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F9FA",
    theme_color: "#1A5C52",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
