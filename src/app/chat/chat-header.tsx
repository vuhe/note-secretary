"use client";

import { ChatUsage } from "@/app/chat/chat-usage";
import { NoteSelector } from "@/app/chat/note-selector";
import { MainHeader } from "@/components/animation/main-header";
import { InputGroupButton } from "@/components/ui/input-group";
import type { NavNote } from "@/hooks/use-navigation";

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
    <MainHeader border>
      <ChatContext />
      <div className="ml-auto flex items-center gap-2">
        <ChatUsage />
      </div>
    </MainHeader>
  );
}
