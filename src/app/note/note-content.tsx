"use client";

import { AnimatePresence, motion } from "motion/react";

import { MarkdownDisplay } from "@/components/markdown/display";
import { MarkdownSplitView } from "@/components/markdown/split";
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
        <motion.div
          className="flex size-full"
          key="editor"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <MarkdownSplitView content={content} draft={draft} setDraft={setDraft} />
        </motion.div>
      ) : (
        <motion.div
          className="size-full overflow-y-auto relative"
          key="display"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <MarkdownDisplay
            mode="static"
            className="px-4 [&>*:first-child]:mt-4 [&>*:last-child]:mb-4"
          >
            {content}
          </MarkdownDisplay>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
