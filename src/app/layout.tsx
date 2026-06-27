import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aurora Semijoias",
  description: "Curadoria sofisticada de semijoias com links de afiliados."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}