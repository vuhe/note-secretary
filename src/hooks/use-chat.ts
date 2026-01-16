import { useChat } from "@ai-sdk/react";
import { invoke } from "@tauri-apps/api/core";
import { createIdGenerator, type LanguageModelUsage, type UIMessage } from "ai";
import { useEffect } from "react";
import { toast } from "sonner";
import { create, type StoreApi, type UseBoundStore } from "zustand";
import { Agent } from "@/lib/agent";
import { safeErrorString } from "@/lib/utils";

type ReadonlyStoreApi<T> = Pick<StoreApi<T>, "getState" | "getInitialState" | "subscribe">;
type ReadonlyStore<T> = UseBoundStore<ReadonlyStoreApi<T>>;

type MessagesSetter = (messages: UIMessage[]) => void;

const idGenerator = createIdGenerator({ prefix: "chat" });

interface ChatId {
  id: string;
  requireLoading: boolean;
  loading: boolean;
  usage?: LanguageModelUsage;

  newChat: () => void;
  loadChat: (id: string) => void;
  updateUsage: (id: string, usage: LanguageModelUsage) => void;
  loadMessages: (setter: MessagesSetter) => Promise<void>;
}

export const useChatId: ReadonlyStore<ChatId> = create((set, get) => ({
  id: idGenerator(),
  requireLoading: false,
  loading: false,

  newChat: () => {
    set({ id: idGenerator(), requireLoading: false, loading: false, usage: undefined });
  },

  loadChat: (id) => {
    set({ id, requireLoading: true, loading: false, usage: undefined });
  },

  updateUsage: (id, usage) => {
    if (id !== get().id) return;
    set({ usage });
  },

  loadMessages: async (setter) => {
    const capturedId = get().id;
    set({ requireLoading: false, loading: true });

    try {
      // 拿到的是 Uint8Array
      const responseBytes = await invoke<Uint8Array>("load_chat", { chatId: capturedId });

      // 使用 TextDecoder 高效转换并解析
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(responseBytes);
      const messages = JSON.parse(jsonString) as UIMessage[];

      // 防止在拉取对话期间点击其他对话造成状态不一致
      if (capturedId === get().id) {
        setter(messages);
      }
    } catch (error) {
      toast.error("载入对话失败", {
        description: safeErrorString(error),
        closeButton: true,
      });
    } finally {
      // 防止在拉取对话期间点击其他对话造成状态不一致
      if (capturedId === get().id) {
        set({ loading: false });
      }
    }
  },
}));

export function useChatContext() {
  const id = useChatId((state) => state.id);
  const requireLoading = useChatId((state) => state.requireLoading);

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    id: id,
    transport: new Agent(),
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: listen requireLoading change
  useEffect(() => {
    const state = useChatId.getState();
    if (!state.requireLoading || state.loading) return;
    void state.loadMessages(setMessages);
  }, [requireLoading, setMessages]);

  return {
    messages,
    sendMessage,
    status,
    stop,
  };
}
