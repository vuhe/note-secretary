"use client";

import { CircleSlash2Icon } from "lucide-react";
import { AnimatePresence } from "motion/react";

import AnimateDiv from "@/components/animation/animate-div";
import { MarkdownDisplay } from "@/components/markdown/display";
import { MarkdownSplitView } from "@/components/markdown/split";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { NoteEditStatus } from "@/hooks/use-note";

interface NoteContentProps {
  content: string;
  editing: NoteEditStatus;
  draft: string;
  setDraft: (s: string) => void;
}

export default function NoteContent({ content, editing, draft, setDraft }: NoteContentProps) {
  return (
    <AnimatePresence mode="wait">
      {editing !== "display" ? (
        <AnimateDiv className="flex size-full" key="editor">
          <MarkdownSplitView content={content} draft={draft} setDraft={setDraft} />
        </AnimateDiv>
      ) : (
        <AnimateDiv className="size-full overflow-y-auto relative" key="display">
          {content.trim().length === 0 ? (
            <Empty className="h-full">
              <EmptyMedia variant="icon">
                <CircleSlash2Icon />
              </EmptyMedia>
              <EmptyTitle>笔记内容为空</EmptyTitle>
              <EmptyDescription>写点东西再来看看吧（仅桌面端支持编辑）</EmptyDescription>
            </Empty>
          ) : (
            <MarkdownDisplay
              mode="static"
              className="px-4 [&>*:first-child]:mt-4 [&>*:last-child]:mb-4"
            >
              {content}
            </MarkdownDisplay>
          )}
        </AnimateDiv>
      )}
    </AnimatePresence>
  );
}
