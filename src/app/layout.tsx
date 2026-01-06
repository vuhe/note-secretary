"use client";

import { SettingsIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { type ComponentProps, type CSSProperties, type ReactNode, useEffect } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import "@/styles/globals.css";
import { NavChatGroup, NavNoteGroup } from "@/app/nav-scope";
import { NavSearch } from "@/app/nav-search";
import { Toaster } from "@/components/ui/sonner";
import { usePlatform } from "@/hooks/use-mobile";
import { useNavMenu } from "@/hooks/use-nav";
import { usePersona } from "@/hooks/use-persona";
import { useToaster } from "@/hooks/use-toaster";

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

const data = {
  chats: [
    {
      title: "最近对话",
      items: [{ title: "对话 1" }, { title: "对话 2" }],
    },
    {
      title: "归档对话",
      items: [{ title: "对话 3" }, { title: "对话 4" }],
    },
  ],
};

function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <NavSearch />
      </SidebarHeader>
      <SidebarContent>
        <NavChatGroup group={data.chats} />
        <NavNoteGroup />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <span>
                <SettingsIcon />
                <span>设置</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  useEffect(() => {
    void usePlatform.getState().init();
    void useNavMenu.getState().update();
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
            <AppSidebar variant="inset" />
            <AnimatePresence mode="wait">{children}</AnimatePresence>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
