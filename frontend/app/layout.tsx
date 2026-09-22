import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AnimatedBackground } from "@/components/animations/AnimatedBackground";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskFlow AI | Professional Project Management",
  description: "AI-Powered Project and Task Management Platform",
};

import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased bg-slate-50 text-slate-900`}
    >
      <body className="min-h-full flex flex-col relative overflow-x-hidden">
        <AnimatedBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
