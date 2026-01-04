import { invoke } from "@tauri-apps/api/core";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { safeError } from "@/lib/utils";

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

export function useNote() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<NoteStatus>({ status: "loading" });
  const [editing, setEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<string>("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditing(false);
    setDraft("");
    invoke("get_note_by_id", { id: searchParams.get("id") ?? "" }).then(
      (note) => {
        const value = note as Note;
        setStatus({ status: "success", value });
        setDraft(value.content);
      },
      (error: unknown) => {
        setStatus({ status: "error", value: safeError(error) });
      },
    );
  }, [searchParams]);

  const modeChange = useCallback(() => {
    if (status.status !== "success") return;
    if (editing) {
      // TODO: invoke save id draft
      const newNote = { ...status.value, content: draft };
      setStatus({ status: "success", value: newNote });
      setEditing(false);
      return;
    }
    setEditing(true);
  }, [editing, draft, status]);

  return {
    status,
    editing,
    modeChange,
    draft,
    setDraft,
  };
}
