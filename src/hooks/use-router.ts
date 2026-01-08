import { createIdGenerator } from "ai";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useChatId } from "@/hooks/use-chat";

/** note id 生成器 */
const noteId = createIdGenerator({ prefix: "note" });

export default function useSafeRoute() {
  const router = useRouter();

  const goToNewChat = useCallback(() => {
    useChatId.getState().newChat();
    router.push("/chat");
  }, [router]);

  const goToChat = useCallback(
    (id: string) => {
      useChatId.getState().loadChat(id);
      router.push("/chat");
    },
    [router],
  );

  const goToNewNote = useCallback(() => {
    router.push(`/note-add?id=${noteId()}`);
  }, [router]);

  const goToNote = useCallback(
    (id: string) => {
      router.push(`/note?id=${id}`);
    },
    [router],
  );

  return {
    goToNewChat,
    goToChat,
    goToNewNote,
    goToNote,
  };
}
