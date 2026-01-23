"use client";

import { Loader2Icon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import type { Control } from "react-hook-form";

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
import type { Note, NoteDisplayMode, NoteStatus } from "@/hooks/use-note";

interface NoteMetadataProps {
  title: string;
  control: Control<Note>;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
  onDelete: () => void;
}

function NoteMetadata({ title, control, onCancel, onSubmit, onDelete }: NoteMetadataProps) {
  const [open, setOpen] = useState(false);

  const onOpenChange = (open: boolean) => {
    setOpen(open);
    if (open) return;
    onCancel();
  };

  const handleSubmit = () => {
    setOpen(false);
    void onSubmit();
  };

  const handleDelete = () => {
    setOpen(false);
    onDelete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="-ml-3">
          <span className="text-base font-medium">{title}</span>
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
          <DeleteConfirm resetOnChange={open} onDelete={handleDelete}>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button onClick={handleSubmit}>保存</Button>
          </DeleteConfirm>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface NoteToolbarProps {
  displayMode: NoteDisplayMode;
  onEditing: () => void;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
}

export function NoteToolbar({ displayMode, onEditing, onCancel, onSubmit }: NoteToolbarProps) {
  return (
    <AnimatePresence mode="wait">
      {displayMode === "editing" ? (
        <AnimateDiv key="note-editing" className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            返回
          </Button>
          <Button size="sm" onClick={onSubmit}>
            提交
          </Button>
        </AnimateDiv>
      ) : displayMode === "display" ? (
        <AnimateDiv key="note-display" className="ml-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onEditing}>
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
  displayMode: NoteDisplayMode;
  title: string;
  control: Control<Note>;
  onEditing: () => void;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
  onDelete: () => void;
}

export function NoteTitle({
  status,
  displayMode,
  title,
  control,
  onEditing,
  onDelete,
  ...props
}: NoteTitleProps) {
  const isDesktop = usePlatform((state) => state.isDesktop);
  if (status.status === "success") {
    if (isDesktop) {
      return (
        <>
          {displayMode !== "display" ? (
            <div className="text-base font-medium select-none">{title}</div>
          ) : (
            <NoteMetadata title={title} control={control} onDelete={onDelete} {...props} />
          )}
          <NoteToolbar displayMode={displayMode} onEditing={onEditing} {...props} />
        </>
      );
    }
    return <div className="text-base font-medium select-none">{title}</div>;
  }
  return <div className="text-base text-muted-foreground font-medium select-none">加载中……</div>;
}
