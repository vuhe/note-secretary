import { invoke } from "@tauri-apps/api/core";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    invoke("get_note_by_id", { id: searchParams.get("id") ?? "" }).then(
      (note) => {
        setStatus({ status: "success", value: note as Note });
      },
      (error: unknown) => {
        setStatus({ status: "error", value: safeError(error) });
      },
    );
  }, [searchParams]);

  return status;
}
