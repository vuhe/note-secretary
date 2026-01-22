import { useId } from "react";
import { type Control, Controller } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Note } from "@/hooks/use-note";

interface NoteFieldProps {
  control: Control<Note>;
}

export function NoteCategoryField({ control }: NoteFieldProps) {
  const id = useId();
  return (
    <Controller
      name="category"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>分类</FieldLabel>
          <Input
            {...field}
            id={id}
            aria-invalid={fieldState.invalid}
            placeholder="请输入笔记分类……"
            autoComplete="off"
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export function NoteTitleField({ control }: NoteFieldProps) {
  const id = useId();
  return (
    <Controller
      name="title"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>标题</FieldLabel>
          <Input
            {...field}
            id={id}
            aria-invalid={fieldState.invalid}
            placeholder="请输入笔记标题……"
            autoComplete="off"
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export function NoteSummaryField({ control }: NoteFieldProps) {
  const id = useId();
  return (
    <Controller
      name="summary"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>摘要</FieldLabel>
          <FieldDescription>
            用于提供给&nbsp;AI&nbsp;搜索、处理的摘要信息，作为附件发送给&nbsp;AI&nbsp;时仅提供此信息不会提供正文
          </FieldDescription>
          <Textarea
            {...field}
            id={id}
            aria-invalid={fieldState.invalid}
            placeholder="请输入笔记摘要……"
            autoComplete="off"
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
