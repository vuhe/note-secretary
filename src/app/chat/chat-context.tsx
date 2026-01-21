"use client";

import { NoteSelector } from "@/app/chat/note-selector";
import { InputGroupButton } from "@/components/ui/input-group";
import type { NavNote } from "@/hooks/use-navigation";

export function ChatContext() {
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
