"use client";

import { SettingsIcon } from "lucide-react";
import { type ComponentProps, type CSSProperties, type ReactNode, useEffect } from "react";

import { NavChatGroup, NavNoteGroup } from "@/app/(main)/nav-scope";
import { NavSearch } from "@/app/(main)/nav-search";
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
import { useEnvMobile } from "@/hooks/use-mobile";
import { useNavMenu } from "@/hooks/use-nav";
import { usePersona } from "@/hooks/use-persona";

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

export default function Layout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  useEffect(() => {
    void useEnvMobile.getState().init();
    void useNavMenu.getState().update();
    void usePersona.getState().update();
  }, []);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      {children}
    </SidebarProvider>
  );
}
