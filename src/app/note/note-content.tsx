"use client";

import { CircleSlash2Icon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { type Control, Controller } from "react-hook-form";

import { AnimateDiv } from "@/components/animation/animate-div";
import { MarkdownDisplay } from "@/components/markdown/display";
import { MarkdownSplitView } from "@/components/markdown/split";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { Note, NoteDisplayMode } from "@/hooks/use-note";

interface NoteContentProps {
  displayMode: NoteDisplayMode;
  content: string;
  control: Control<Note>;
}

export function NoteContent({ displayMode, content, control }: NoteContentProps) {
  return (
    <AnimatePresence mode="wait">
      {displayMode !== "display" ? (
        <AnimateDiv className="flex size-full" key="editor">
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <MarkdownSplitView content={content} draft={field.value} setDraft={field.onChange} />
            )}
          />
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
