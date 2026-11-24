import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
import { Stage } from "@/components/ui/Stage";

const description =
  "Portfolio de Yanis, ingénieur logiciel : software engineering, cybersécurité, cloud & infrastructure. Un territoire à relever.";

export const metadata: Metadata = {
  title: "YANIS — Relevé",
  description,
  openGraph: { title: "YANIS — Relevé", description, type: "website", locale: "fr_FR" },
  twitter: { card: "summary", title: "YANIS — Relevé", description },
};

export const viewport: Viewport = {
  themeColor: "#ece5d5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <a
          href="#contenu"
          className="t-mono sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-paper focus:px-3 focus:py-2"
        >
          Aller au contenu
        </a>
        <Stage />
        {children}
      </body>
    </html>
  );
}
