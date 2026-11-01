import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MEDIFED AI — Federated Medical Intelligence",
  description:
    "A Generalized Federated Learning Framework for Private Cross-Institutional Medical Diagnostics. AI-powered chest X-ray analysis with Grad-CAM explainability.",
  keywords: [
    "federated learning",
    "medical AI",
    "chest X-ray",
    "pneumonia detection",
    "Grad-CAM",
    "explainable AI",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
