import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { Navigation } from "@/components/navigation";
import "./globals.css";

// next/font télécharge les polices au build et les sert depuis le site :
// pas de requête vers Google au chargement de la page.
const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-barlow",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow-condensed",
});

export const metadata: Metadata = {
  title: "Port d'attache — annonces immobilières",
  description: "Ventes et locations entre Le Havre et la côte normande",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-screen antialiased">
        <Navigation />
        {children}
      </body>
    </html>
  );
}