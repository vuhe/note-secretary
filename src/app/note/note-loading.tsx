import { RefreshCwIcon } from "lucide-react";
import { Loader } from "@/components/ai-elements/loader";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export function NoteLoading() {
  return (
    <Empty>
      <EmptyContent>
        <EmptyDescription className="flex items-center justify-center gap-2">
          <Loader />
          正在加载笔记……
        </EmptyDescription>
      </EmptyContent>
    </Empty>
  );
}

export function NoteError({ error }: { error: Error }) {
  return (
    <Empty>
      <EmptyHeader>
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
