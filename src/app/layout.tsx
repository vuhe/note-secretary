"use client";

import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import "@/styles/globals.css";

const jetbrainsMono = localFont({
  src: [
    {
      path: "./fonts/JetBrainsMono[wght].woff2",
      weight: "100 800",
      style: "normal",
    },
    {
      path: "./fonts/JetBrainsMono-Italic[wght].woff2",
      weight: "100 800",
      style: "italic",
    },
  ],
  variable: "--font-jetbrains-mono",
  display: "swap",
  fallback: ["ui-monospace", "SF Mono", "Monaco", "Menlo", "Consolas", "PingFang SC", "monospace"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className={`${jetbrainsMono.variable} antialiased overflow-hidden`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
