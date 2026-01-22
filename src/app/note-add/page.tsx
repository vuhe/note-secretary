"use client";

import { useId } from "react";
import { NoteCategoryField, NoteTitleField } from "@/components/form-fields/note-fields";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldSeparator, FieldSet } from "@/components/ui/field";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useAddNode } from "@/hooks/use-note";
import { cn } from "@/lib/utils";

// biome-ignore lint/style/noDefaultExport: Next.js Page
export default function Page() {
  const { control, reset, onSubmit } = useAddNode();
  const formId = useId();

  return (
    <SidebarInset key="note-add">
      <header
        className={cn(
          "flex h-(--header-height) shrink-0 items-center gap-2",
          "transition-[width,height] ease-linear",
          "group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)",
        )}
      >
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1 mr-2" />
          <div className="text-base font-medium select-none">新建笔记</div>
        </div>
      </header>
      <div className="@container/main flex flex-1 items-center justify-center min-h-0 mb-(--header-height)">
        <form id={formId} className="min-w-70" onSubmit={onSubmit}>
          <FieldSet>
            <FieldGroup>
              <NoteCategoryField control={control} />
              <NoteTitleField control={control} />
            </FieldGroup>
            <FieldSeparator />
            <Field orientation="horizontal">
              <Button type="submit" form={formId}>
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
