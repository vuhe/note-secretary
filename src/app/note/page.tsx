"use client";

import { NoteContent } from "@/app/note/note-content";
import { NoteError, NoteLoading } from "@/app/note/note-loading";
import { NoteTitle } from "@/app/note/note-title";
import { NoteToolbar } from "@/app/note/note-toolbar";
import { MainHeader } from "@/components/animation/main-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { usePlatform } from "@/hooks/use-mobile";
import { useNote } from "@/hooks/use-note";

// biome-ignore lint/style/noDefaultExport: Next.js Page
export default function Page() {
  const isDesktop = usePlatform((state) => state.isDesktop);
  const { status, editing, setEditing, draft, setDraft, submitDraft, submitMetadata } = useNote();

  return (
    <SidebarInset key="note">
      <MainHeader border>
        <NoteTitle status={status} submitMetadata={submitMetadata} />
        {isDesktop && (
          <NoteToolbar
            status={status}
            editing={editing}
            setEditing={setEditing}
            setDraft={setDraft}
            submitDraft={submitDraft}
          />
        )}
      </MainHeader>
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
