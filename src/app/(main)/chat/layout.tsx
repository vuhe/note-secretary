import type { ReactNode } from "react";
import { ChatHeader } from "@/app/(main)/chat/chat-header";
import { SidebarInset } from "@/components/ui/sidebar";

export default function Layout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <SidebarInset>
      <ChatHeader />
      <div className="@container/main flex flex-1 flex-col h-full">{children}</div>
    </SidebarInset>
  );
}
