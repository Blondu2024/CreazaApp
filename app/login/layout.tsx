import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Autentificare",
  description:
    "Conectează-te la CreazaApp cu Google sau GitHub. Creează aplicații web cu AI, în română.",
  alternates: { canonical: "https://creazaapp.com/login" },
  openGraph: {
    title: "Autentificare – CreazaApp",
    description: "Conectează-te și începe să construiești aplicații web cu AI.",
    url: "https://creazaapp.com/login",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
