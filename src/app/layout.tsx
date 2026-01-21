"use client";

import { AnimatePresence } from "motion/react";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { type CSSProperties, type ReactNode, useEffect } from "react";

import { SidebarNavigation } from "@/app/sidebar-nav";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { usePlatform } from "@/hooks/use-mobile";
import { usePersona } from "@/hooks/use-persona";
import { useToaster } from "@/hooks/use-toaster";

import "@/styles/globals.css";

const jetbrainsMono = localFont({
  src: [
    {
      path: "../fonts/JetBrainsMono.woff2",
      weight: "100 800",
      style: "normal",
    },
    {
      path: "../fonts/JetBrainsMono-Italic.woff2",
      weight: "100 800",
      style: "italic",
    },
  ],
  variable: "--font-jetbrains-mono",
  display: "swap",
  fallback: ["ui-monospace", "SF Mono", "Monaco", "Menlo", "Consolas", "PingFang SC", "monospace"],
});

// biome-ignore lint/style/noDefaultExport: Next.js Layout
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  useEffect(() => {
    void usePlatform.getState().init();
    void usePersona.getState().update();
  }, []);

  useToaster();

  return (
    <html lang="zh" suppressHydrationWarning>
      <body className={`${jetbrainsMono.variable} antialiased overflow-hidden`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SidebarProvider
            style={
              {
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
              } as CSSProperties
            }
          >
            <SidebarNavigation />
            <AnimatePresence mode="wait">{children}</AnimatePresence>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
