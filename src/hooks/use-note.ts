import { invoke } from "@tauri-apps/api/core";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { safeError, safeErrorString } from "@/lib/utils";

export const NoteSchema = z.object({
  id: z.string().trim().min(1, "ID 不能为空"),
  category: z.string().trim().min(1, "分类不能为空"),
  title: z.string().trim().min(1, "标题不能为空"),
  summary: z.string(),
  content: z.string(),
});

export type Note = z.infer<typeof NoteSchema>;

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

  const submitMetadata = useCallback(
    (data: Note) => {
      if (status.status !== "success") return;
      invoke("modify_note_meta", { note: data }).then(
        () => {
          const newNote = { ...data, content: status.value.content };
          setStatus({ status: "success", value: newNote });
          toast.success("保存笔记元数据成功", {
            closeButton: true,
          });
        },
        (error: unknown) => {
          toast.error("保存笔记元数据失败", {
            description: safeErrorString(error),
            closeButton: true,
          });
        },
      );
    },
    [status],
  );

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
    submitMetadata,
    submitDraft,
  };
}

export function invokeAddNote(note: Note, success: () => void) {
  invoke("add_note", { note }).then(
    () => {
      success();
      toast.success("添加笔记成功", {
        closeButton: true,
      });
    },
    (error: unknown) => {
      toast.error("添加笔记失败", {
        description: safeErrorString(error),
        closeButton: true,
      });
    },
  );
}

export function invokeDeleteNote(id: string, success: () => void) {
  invoke("delete_note_by_id", { id }).then(
    () => {
      success();
      toast.success("删除笔记成功", {
        closeButton: true,
      });
    },
    (error: unknown) => {
      toast.error("删除笔记失败", {
        description: safeErrorString(error),
        closeButton: true,
      });
    },
  );
}
