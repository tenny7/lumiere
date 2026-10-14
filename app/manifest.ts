import type { MetadataRoute } from "next"

// Web app manifest — gives Android "Add to Home screen" the brand icon and
// colours. Browser-tab icons come from app/favicon.ico and app/icon.svg; the
// iOS home-screen icon from app/apple-icon.png.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ajabu Lighting",
    short_name: "Ajabu",
    description: "Curated lighting for every space.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a08",
    theme_color: "#0a0a08",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
