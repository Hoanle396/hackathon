import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/layout/header";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexus Code - Intelligent Code Review Platform",
  description: "Nexus Code: AI-powered code review platform with team collaboration, business context awareness, and Web3 payment. Supports GitHub, GitLab, and Discord integration.",
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}

          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
