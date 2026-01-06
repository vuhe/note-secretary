import { AnimatePresence, motion } from "motion/react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { NoteStatus } from "@/hooks/use-note";

interface NoteToolbarProps {
  status: NoteStatus;
  editing: boolean;
  setEditing: (value: boolean) => void;
  setDraft: (value: string) => void;
  submitDraft: () => void;
}

export default function NoteToolbar({
  status,
  editing,
  setEditing,
  setDraft,
  submitDraft,
}: NoteToolbarProps) {
  const modify = useCallback(() => {
    if (status.status !== "success") return;
    setDraft(status.value.content);
    setEditing(true);
  }, [status, setEditing, setDraft]);

  const cancel = useCallback(() => {
    setDraft("");
    setEditing(false);
  }, [setEditing, setDraft]);

  return (
    <AnimatePresence mode="wait">
      {editing ? (
        <motion.div
          key="note-editing"
          className="ml-auto flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button variant="ghost" size="sm" onClick={cancel}>
            返回
          </Button>
          <Button size="sm" onClick={submitDraft}>
            提交
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="note-display"
          className="ml-auto flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button variant="secondary" size="sm" onClick={modify}>
            编辑
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
