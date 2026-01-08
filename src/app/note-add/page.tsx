"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { invoke } from "@tauri-apps/api/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { type Note, NoteSchema } from "@/hooks/use-note";
import { safeErrorString } from "@/lib/utils";

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
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

  const addNote = useCallback(
    (note: Note) => {
      const value = { ...note, id };
      invoke("add_note", { note: value }).then(
        () => {
          router.push(`/note?id=${id}`);
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
    },
    [router, id],
  );

  return (
    <SidebarInset key="note-add">
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1 mr-2" />
          <div className="text-base font-medium select-none">新建笔记</div>
        </div>
      </header>
      <div className="@container/main flex flex-1 items-center justify-center min-h-0 mb-(--header-height)">
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <form id="note-add-form" className="min-w-70" onSubmit={handleSubmit(addNote)}>
          <FieldSet>
            <FieldGroup>
              <Controller
                name="category"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="note-add-form-category">分类</FieldLabel>
                    <Input
                      {...field}
                      id="note-add-form-category"
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
                    <FieldLabel htmlFor="note-add-form-title">标题</FieldLabel>
                    <Input
                      {...field}
                      id="note-add-form-title"
                      aria-invalid={fieldState.invalid}
                      placeholder="请输入笔记标题……"
                      autoComplete="off"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
            <FieldSeparator />
            <Field orientation="horizontal">
              <Button type="submit" form="note-add-form">
                新建
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  reset();
                }}
              >
                重置
              </Button>
            </Field>
          </FieldSet>
        </form>
      </div>
    </SidebarInset>
  );
}
