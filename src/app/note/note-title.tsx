"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";

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
import { invokeDeleteNote, type Note, NoteSchema, type NoteStatus } from "@/hooks/use-note";
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

interface NoteTitleProps {
  status: NoteStatus;
  submitMetadata: (data: Note) => void;
}

export function NoteTitle({ status, submitMetadata }: NoteTitleProps) {
  const isDesktop = usePlatform((state) => state.isDesktop);
  if (status.status === "success") {
    if (isDesktop) {
      return <NoteMetadata note={status.value} submitMetadata={submitMetadata} />;
    }
    const title = `${status.value.category} - ${status.value.title}`;
    return <div className="text-base font-medium select-none">{title}</div>;
  }
  return <div className="text-base text-muted-foreground font-medium select-none">加载中……</div>;
}
