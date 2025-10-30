import type { Metadata } from "next";
import "../styles/globals.css";
import { Inter } from "next/font/google";

export const metadata: Metadata = {
  title: "Ease",
  description: "Ease – Project management workspace",
};

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className={`${inter.className} min-h-dvh bg-white text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
