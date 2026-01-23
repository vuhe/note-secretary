"use client";

import { CircleAlertIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
import { NoteContent } from "@/app/note/note-content";
import { NoteTitle } from "@/app/note/note-title";
import { MainHeader } from "@/components/animation/main-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { SidebarInset } from "@/components/ui/sidebar";
import { useNote } from "@/hooks/use-note";

export function NoteLoading() {
  return (
    <Empty>
      <EmptyContent>
        <EmptyDescription className="flex items-center justify-center gap-2">
          <Loader2Icon className="size-4 animate-spin" />
          正在加载笔记……
        </EmptyDescription>
      </EmptyContent>
    </Empty>
  );
}

export function NoteError({ error }: { error?: string }) {
  return (
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>载入笔记错误</EmptyTitle>
        {error && <EmptyDescription>{error}</EmptyDescription>}
      </EmptyHeader>
      <EmptyContent>
        <EmptyDescription>
          <Button size="sm">
            <RefreshCwIcon />
            重试
          </Button>
        </EmptyDescription>
      </EmptyContent>
    </Empty>
  );
}

// biome-ignore lint/style/noDefaultExport: Next.js Page
export default function Page() {
  const { status, displayMode, content, control, ...props } = useNote();

  return (
    <SidebarInset key="note">
      <MainHeader border>
        <NoteTitle status={status} displayMode={displayMode} control={control} {...props} />
      </MainHeader>
      <div className="@container/main flex flex-1 flex-col min-h-0">
        {status.status === "loading" ? (
          <NoteLoading />
        ) : status.status === "error" ? (
          <NoteError error={status.error} />
        ) : (
          <NoteContent content={content} displayMode={displayMode} control={control} />
        )}
      </div>
    </SidebarInset>
  );
}
