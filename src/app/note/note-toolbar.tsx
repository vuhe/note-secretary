"use client";

import { Loader2Icon } from "lucide-react";
import { AnimatePresence } from "motion/react";

import { AnimateDiv } from "@/components/animation/animate-div";
import { Button } from "@/components/ui/button";
import type { NoteEditStatus, NoteStatus } from "@/hooks/use-note";

interface NoteToolbarProps {
  status: NoteStatus;
  editing: NoteEditStatus;
  setEditing: (value: NoteEditStatus) => void;
  setDraft: (value: string) => void;
  submitDraft: () => void;
}

export function NoteToolbar({
  status,
  editing,
  setEditing,
  setDraft,
  submitDraft,
}: NoteToolbarProps) {
  const modify = () => {
    if (status.status !== "success") return;
    setDraft(status.value.content);
    setEditing("editing");
  };

  const cancel = () => {
    setDraft("");
    setEditing("display");
  };

  return (
    <AnimatePresence mode="wait">
      {editing === "editing" ? (
        <AnimateDiv key="note-editing" className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={cancel}>
            返回
          </Button>
          <Button size="sm" onClick={submitDraft}>
            提交
          </Button>
        </AnimateDiv>
      ) : editing === "display" ? (
        <AnimateDiv key="note-display" className="ml-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={modify}>
            编辑
          </Button>
        </AnimateDiv>
      ) : (
        <AnimateDiv key="note-submitting" className="ml-auto flex items-center gap-2">
          <Button disabled size="sm" onClick={modify}>
            <Loader2Icon className="size-4 animate-spin" />
            提交中……
          </Button>
        </AnimateDiv>
      )}
    </AnimatePresence>
  );
}
