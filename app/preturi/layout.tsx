import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prețuri",
  description:
    "Planuri și prețuri CreazaApp. De la gratuit la Ultra. Credite AI, 8 API-uri integrate, 14+ modele AI. Prețuri în RON.",
  alternates: { canonical: "https://creazaapp.com/preturi" },
  openGraph: {
    title: "Prețuri – CreazaApp",
    description:
      "Planuri de la 0 RON. Agent AI, 8 API-uri integrate, 14+ modele AI. Creditele top-up nu expiră.",
    url: "https://creazaapp.com/preturi",
  },
};

export default function PreturiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
