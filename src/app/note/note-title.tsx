"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";

import { AnimateDiv } from "@/components/animation/animate-div";
import { DeleteConfirm } from "@/components/animation/delete-confirm";
import {
  NoteCategoryField,
  NoteSummaryField,
  NoteTitleField,
} from "@/components/form-fields/note-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup, FieldSet } from "@/components/ui/field";
import { usePlatform } from "@/hooks/use-mobile";
import {
  invokeDeleteNote,
  type Note,
  type NoteEditStatus,
  NoteSchema,
  type NoteStatus,
} from "@/hooks/use-note";
import { useSafeRoute } from "@/hooks/use-router";

interface NoteMetadataProps {
  note: Note;
  submitMetadata: (data: Note) => void;
}

function NoteMetadata({ note, submitMetadata }: NoteMetadataProps) {
  const [open, setOpen] = useState(false);
  const router = useSafeRoute();
  const { control, handleSubmit, reset } = useForm<Note>({
    resolver: zodResolver(NoteSchema),
    defaultValues: {
      id: note.id,
      category: note.category,
      title: note.title,
      summary: note.summary,
      content: "",
    },
  });

  const onOpenChange = (open: boolean) => {
    setOpen(open);
    if (open) return;
    reset();
  };

  const onSubmit = (data: Note) => {
    setOpen(false);
    submitMetadata(data);
  };

  const onDelete = () => {
    setOpen(false);
    invokeDeleteNote(note.id, () => {
      router.goToNewChat();
    });
  };

  const formId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form id={formId} onSubmit={handleSubmit(onSubmit)}>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost" className="-ml-3">
            <span className="text-base font-medium">{`${note.category} - ${note.title}`}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-110 max-h-full">
          <DialogHeader>
            <DialogTitle>笔记信息</DialogTitle>
            <DialogDescription>在此编辑笔记相关内容或者删除笔记</DialogDescription>
          </DialogHeader>
          <FieldSet>
            <FieldGroup>
              <NoteCategoryField control={control} />
              <NoteTitleField control={control} />
              <NoteSummaryField control={control} />
            </FieldGroup>
          </FieldSet>
          <DialogFooter className="select-none">
            <DeleteConfirm resetOnChange={open} onDelete={onDelete}>
              <DialogClose asChild>
                <Button variant="outline">取消</Button>
              </DialogClose>
              <Button type="submit" form={formId}>
                保存
              </Button>
            </DeleteConfirm>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}

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
          <Button disabled size="sm">
            <Loader2Icon className="size-4 animate-spin" />
            提交中……
          </Button>
        </AnimateDiv>
      )}
    </AnimatePresence>
  );
}

interface NoteTitleProps {
  status: NoteStatus;
  submitMetadata: (data: Note) => void;
  editing: NoteEditStatus;
  setEditing: (value: NoteEditStatus) => void;
  setDraft: (value: string) => void;
  submitDraft: () => void;
}

export function NoteTitle({ status, submitMetadata, ...props }: NoteTitleProps) {
  const isDesktop = usePlatform((state) => state.isDesktop);
  if (status.status === "success") {
    if (isDesktop) {
      return (
        <>
          <NoteMetadata note={status.value} submitMetadata={submitMetadata} />
          <NoteToolbar status={status} {...props} />
        </>
      );
    }
    const title = `${status.value.category} - ${status.value.title}`;
    return <div className="text-base font-medium select-none">{title}</div>;
  }
  return <div className="text-base text-muted-foreground font-medium select-none">加载中……</div>;
}
