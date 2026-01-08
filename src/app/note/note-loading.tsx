"use client";

import { CircleAlertIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

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

export function NoteError({ error }: { error: Error }) {
  return (
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>载入笔记错误</EmptyTitle>
        <EmptyDescription>{error.message}</EmptyDescription>
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
