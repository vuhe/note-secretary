import { zodResolver } from "@hookform/resolvers/zod";
import { invoke } from "@tauri-apps/api/core";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useSafeRoute } from "@/hooks/use-router";
import { safeErrorString } from "@/lib/utils";

const NoteSchema = z.object({
  id: z.string().trim().min(1, "ID 不能为空"),
  category: z.string().trim().min(1, "分类不能为空"),
  title: z.string().trim().min(1, "标题不能为空"),
  summary: z.string(),
  content: z.string(),
});

export type Note = z.infer<typeof NoteSchema>;

export interface NoteStatus {
  status: "loading" | "success" | "error";
  error?: string;
}

export type NoteDisplayMode = "display" | "editing" | "submitting";

export function useNote() {
  const router = useSafeRoute();
  const searchParams = useSearchParams();
  const [prevId, setPrevId] = useState<string | null>(null);

  const [status, setStatus] = useState<NoteStatus>({ status: "loading" });
  const [displayMode, setDisplayMode] = useState<NoteDisplayMode>("display");

  const { control, handleSubmit, reset, formState } = useForm<Note>({
    resolver: zodResolver(NoteSchema),
  });

  const title = `${formState.defaultValues?.category} - ${formState.defaultValues?.title}`;
  const content = formState.defaultValues?.content ?? "";

  const currentId = searchParams.get("id") ?? "";
  if (currentId !== prevId) {
    setPrevId(currentId);
    setDisplayMode("display");
    setStatus({ status: "loading" });
  }

  useEffect(() => {
    invoke<Note>("get_note_by_id", { id: searchParams.get("id") ?? "" })
      .then((note) => {
        setStatus({ status: "success" });
        reset(note);
      })
      .catch((error: unknown) => {
        setStatus({ status: "error", error: safeErrorString(error) });
      });
  }, [searchParams, reset]);

  const onEditing = () => {
    setDisplayMode("editing");
  };

  const onCancel = () => {
    setDisplayMode("display");
    reset();
  };

  const onSubmit = handleSubmit((data) => {
    if (!formState.isDirty) {
      setDisplayMode("display");
      return;
    }
    if (formState.dirtyFields.content) {
      setDisplayMode("submitting");
      invoke("modify_note_content", { id: data.id, content: data.content })
        .then(() => {
          setDisplayMode("display");
          reset(data);
          setStatus({ status: "success" });
        })
        .catch((error: unknown) => {
          setDisplayMode("editing");
          toast.error("保存笔记失败", {
            description: safeErrorString(error),
            closeButton: true,
          });
        });
    } else {
      const note = { ...data, content: "" };
      invoke("modify_note_meta", { note })
        .then(() => {
          setStatus({ status: "success" });
          reset(data);
          toast.success("保存笔记元数据成功", {
            closeButton: true,
          });
        })
        .catch((error: unknown) => {
          toast.error("保存笔记元数据失败", {
            description: safeErrorString(error),
            closeButton: true,
          });
        });
    }
  });

  const onDelete = () => {
    invoke("delete_note_by_id", { id: currentId })
      .then(() => {
        router.goToNewChat();
        toast.success("删除笔记成功", {
          closeButton: true,
        });
      })
      .catch((error: unknown) => {
        toast.error("删除笔记失败", {
          description: safeErrorString(error),
          closeButton: true,
        });
      });
  };

  return {
    status,
    displayMode,
    title,
    content,
    control,
    onEditing,
    onCancel,
    onSubmit,
    onDelete,
  };
}

export function useAddNode() {
  const searchParams = useSearchParams();
  const router = useSafeRoute();
  const id = searchParams.get("id") ?? "";

  const { control, handleSubmit, reset } = useForm<Note>({
    resolver: zodResolver(NoteSchema),
    defaultValues: {
      id: id,
      category: "",
      title: "",
      summary: "",
      content: "",
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: 清理上次未提交的内容
  useEffect(() => {
    reset();
  }, [id, reset]);

  const addNote = (note: Note) => {
    invoke("add_note", { note })
      .then(() => {
        router.goToNote(id);
        toast.success("添加笔记成功", {
          closeButton: true,
        });
      })
      .catch((error: unknown) => {
        toast.error("添加笔记失败", {
          description: safeErrorString(error),
          closeButton: true,
        });
      });
  };

  const onSubmit = handleSubmit(addNote);

  return { control, reset, onSubmit };
}
