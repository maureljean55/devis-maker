import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Générateur de Devis — TUTTO LEGNO",
  description: "Générateur intelligent de devis pour Tutto Legno menuiserie",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${montserrat.variable} font-montserrat bg-app-bg text-app-text antialiased`}>
        {children}
      </body>
    </html>
  );
}
