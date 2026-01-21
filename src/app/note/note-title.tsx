"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence } from "motion/react";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { AnimateDiv } from "@/components/animation/animate-div";
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePlatform } from "@/hooks/use-mobile";
import { invokeDeleteNote, type Note, NoteSchema, type NoteStatus } from "@/hooks/use-note";
import { useSafeRoute } from "@/hooks/use-router";

interface NoteMetadataProps {
  note: Note;
  submitMetadata: (data: Note) => void;
}

function NoteMetadata({ note, submitMetadata }: NoteMetadataProps) {
  const [open, setOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(2);
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
    setDeleteConfirm(2);
  };

  const onSubmit = (data: Note) => {
    setOpen(false);
    submitMetadata(data);
    setDeleteConfirm(2);
  };

  const onDelete = () => {
    if (deleteConfirm > 0) {
      setDeleteConfirm(deleteConfirm - 1);
      return;
    }
    setOpen(false);
    setDeleteConfirm(2);
    invokeDeleteNote(note.id, () => {
      router.goToNewChat();
    });
  };

  const formId = useId();
  const categoryId = useId();
  const titleId = useId();
  const summaryId = useId();

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
              <Controller
                name="category"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={categoryId}>分类</FieldLabel>
                    <Input
                      {...field}
                      id={categoryId}
                      aria-invalid={fieldState.invalid}
                      placeholder="请输入笔记分类……"
                      autoComplete="off"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="title"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={titleId}>标题</FieldLabel>
                    <Input
                      {...field}
                      id={titleId}
                      aria-invalid={fieldState.invalid}
                      placeholder="请输入笔记标题……"
                      autoComplete="off"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="summary"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={summaryId}>摘要</FieldLabel>
                    <FieldDescription>
                      用于提供给&nbsp;AI&nbsp;搜索、处理的摘要信息，作为附件发送给&nbsp;AI&nbsp;时仅提供此信息不会提供正文
                    </FieldDescription>
                    <Textarea
                      {...field}
                      id={summaryId}
                      aria-invalid={fieldState.invalid}
                      placeholder="请输入笔记摘要……"
                      autoComplete="off"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>
          <DialogFooter className="select-none">
            <AnimatePresence mode="wait">
              {deleteConfirm === 2 ? (
                <AnimateDiv
                  key="delete-2"
                  className="w-full flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
                >
                  <Button variant="destructive" className="mr-auto" onClick={onDelete}>
                    删除
                  </Button>
                  <DialogClose asChild>
                    <Button variant="outline">取消</Button>
                  </DialogClose>
                  <Button type="submit" form={formId}>
                    保存
                  </Button>
                </AnimateDiv>
              ) : deleteConfirm === 1 ? (
                <AnimateDiv key="delete-1" className="m-auto">
                  <span className="mr-2">二次确认</span>
                  <Button variant="destructive" onClick={onDelete}>
                    删除
                  </Button>
                  <span className="ml-2">后不可恢复</span>
                </AnimateDiv>
              ) : (
                <AnimateDiv key="delete-0" className="gap-1">
                  <span className="mr-2">最终确认，执行</span>
                  <Button variant="destructive" onClick={onDelete}>
                    删除
                  </Button>
                </AnimateDiv>
              )}
            </AnimatePresence>
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
