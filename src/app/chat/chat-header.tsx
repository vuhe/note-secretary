"use client";

import { ChatUsage } from "@/app/chat/chat-usage";
import { NoteSelector } from "@/app/chat/note-selector";
import { InputGroupButton } from "@/components/ui/input-group";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { NavNote } from "@/hooks/use-navigation";
import { cn } from "@/lib/utils";

function ChatContext() {
  const onSelect = (_note: NavNote) => {
    // TODO:
  };

  return (
    <NoteSelector onSelect={onSelect}>
      <InputGroupButton className="-ml-3" size="sm">
        <span className="text-base font-medium">Documents</span>
      </InputGroupButton>
    </NoteSelector>
  );
}

export function ChatHeader() {
  return (
    <header
      className={cn(
        "flex h-(--header-height) shrink-0 items-center gap-2 border-b",
        "transition-[width,height] ease-linear",
        "group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)",
      )}
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 mr-2" />
        <ChatContext />
        <div className="ml-auto flex items-center gap-2">
          <ChatUsage />
        </div>
      </div>
    </header>
  );
}
