import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pássaro Celeste | Clube de Desbravadores",
  description: "Aplicativo oficial de gestão do Clube de Desbravadores Pássaro Celeste.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Desbravadores Pássaro Celeste",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
