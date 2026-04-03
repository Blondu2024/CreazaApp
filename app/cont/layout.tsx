import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contul meu",
  robots: { index: false, follow: false },
};

export default function ContLayout({ children }: { children: React.ReactNode }) {
  return children;
}
