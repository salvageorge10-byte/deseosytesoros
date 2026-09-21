import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deseos y Tesoros | Jewelry & Beauty",
  description: "Joyería, belleza y accesorios personales en Santo Domingo. Elegí tus favoritos y consultá tu pedido.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
