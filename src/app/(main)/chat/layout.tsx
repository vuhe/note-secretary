"use client";

import type { ReactNode } from "react";

import ChatContext from "@/app/(main)/chat/chat-context";
import ChatUsage from "@/app/(main)/chat/chat-usage";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { usePersona } from "@/hooks/use-persona";

const usage = {
  inputTokens: 32_000,
  outputTokens: 8000,
  totalTokens: 40_000,
  cachedInputTokens: 0,
  reasoningTokens: 0,
  inputTokenDetails: {
    noCacheTokens: 22_000,
    cacheReadTokens: 5_000,
    cacheWriteTokens: 5_000,
  },
  outputTokenDetails: {
    textTokens: 5_000,
    reasoningTokens: 15_000,
  },
};

export default function Layout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const persona = usePersona((state) => state.selected);

  return (
    <SidebarInset>
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1 mr-2" />
          <ChatContext />
          <div className="ml-auto flex items-center gap-2">
            {persona && <ChatUsage persona={persona} usage={usage} />}
            <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
              <a
                href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
                rel="noopener noreferrer"
                target="_blank"
                className="dark:text-foreground"
              >
                GitHub
              </a>
            </Button>
          </div>
        </div>
      </header>
      <div className="@container/main flex flex-1 flex-col min-h-0">{children}</div>
    </SidebarInset>
  );
}
