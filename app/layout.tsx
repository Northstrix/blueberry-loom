import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppClientProvider from "./AppClientProvider"; // Import your client provider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blueberry Loom",
  description: "A form builder that utilizes ML-KEM-1024, as well as the \"ChaCha20 + Serpent-256 CBC + HMAC-SHA3-512\" authenticated encryption scheme to enable end-to-end encryption for enhanced data protection.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppClientProvider>
          {children}
        </AppClientProvider>
      </body>
    </html>
  );
}
