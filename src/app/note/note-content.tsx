import { Streamdown } from "streamdown";
import type { Note } from "@/hooks/use-note";

export default function NoteContent({ note }: { note: Note }) {
  return (
    <Streamdown className="size-full overflow-y-auto px-4 [&>*:first-child]:mt-4 [&>*:last-child]:mb-4">
      {note.content}
    </Streamdown>
  );
}
