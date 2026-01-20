"use client";

import { useCallback } from "react";
import NoteSelector from "@/app/chat/note-selector";
import { PromptInputButton } from "@/components/ai-elements/prompt-input";
import type { NavNote } from "@/hooks/use-navigation";

export default function ChatContext() {
  const onSelect = useCallback((note: NavNote) => {
    // TODO:
  }, []);

  return (
    <NoteSelector onSelect={onSelect}>
      <PromptInputButton className="-ml-3" size="sm" variant="ghost">
        <span className="text-base font-medium">Documents</span>
      </PromptInputButton>
    </NoteSelector>
  );
}
