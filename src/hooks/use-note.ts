import { invoke } from "@tauri-apps/api/core";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { safeError, safeErrorString } from "@/lib/utils";

export interface Note {
  id: string;
  category: string;
  title: string;
  summary?: string;
  content: string;
}

export type NoteStatus =
  | {
      status: "loading";
    }
  | {
      status: "success";
      value: Note;
    }
  | {
      status: "error";
      value: Error;
    };

export type NoteEditStatus = "display" | "editing" | "submitting";

export function useNote() {
  const searchParams = useSearchParams();
  const [prevId, setPrevId] = useState<string | null>(null);

  const [status, setStatus] = useState<NoteStatus>({ status: "loading" });
  const [editing, setEditing] = useState<NoteEditStatus>("display");
  const [draft, setDraft] = useState<string>("");

  const currentId = searchParams.get("id") ?? "";
  if (currentId !== prevId) {
    setPrevId(currentId);
    setEditing("display");
    setDraft("");
    setStatus({ status: "loading" });
  }

  useEffect(() => {
    invoke<Note>("get_note_by_id", { id: searchParams.get("id") ?? "" }).then(
      (note) => {
        setStatus({ status: "success", value: note });
      },
      (error: unknown) => {
        setStatus({ status: "error", value: safeError(error) });
      },
    );
  }, [searchParams]);

  const submitDraft = useCallback(() => {
    if (status.status !== "success") return;
    setEditing("submitting");
    invoke("modify_note_content", { id: status.value.id, content: draft }).then(
      () => {
        setEditing("display");
        const newNote = { ...status.value, content: draft };
        setStatus({ status: "success", value: newNote });
        setDraft("");
      },
      (error: unknown) => {
        setEditing("editing");
        toast.error("保存笔记失败", {
          description: safeErrorString(error),
          closeButton: true,
        });
      },
    );
  }, [draft, status]);

  return {
    status,
    editing,
    setEditing,
    draft,
    setDraft,
    submitDraft,
  };
}
