"use client";

import NoteContent from "@/app/note/note-content";
import { NoteError, NoteLoading } from "@/app/note/note-loading";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { usePlatform } from "@/hooks/use-mobile";
import { useNote } from "@/hooks/use-note";

export default function Page() {
  const isDesktop = usePlatform((state) => state.isDesktop);
  const { status, editing, modeChange, draft, setDraft } = useNote();
  const title =
    status.status === "success" ? `${status.value.category} - ${status.value.title}` : "加载中……";

  return (
    <SidebarInset key="note">
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1 mr-2" />
          <div className="text-base font-medium">{title}</div>
          <div className="ml-auto flex items-center gap-2">
            {isDesktop && (
              <Button size="sm" onClick={modeChange}>
                {editing ? "提交" : "编辑"}
              </Button>
            )}
          </div>
        </div>
      </header>
      <div className="@container/main flex flex-1 flex-col min-h-0">
        {status.status === "loading" ? (
          <NoteLoading />
        ) : status.status === "error" ? (
          <NoteError error={status.value} />
        ) : (
          <NoteContent
            content={status.value.content}
            editing={editing}
            draft={draft}
            setDraft={setDraft}
          />
        )}
      </div>
    </SidebarInset>
  );
}
