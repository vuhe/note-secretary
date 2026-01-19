import { useChat } from "@ai-sdk/react";
import { invoke } from "@tauri-apps/api/core";
import { createIdGenerator, type LanguageModelUsage } from "ai";
import { useEffect } from "react";
import { toast } from "sonner";
import { create, type StoreApi, type UseBoundStore } from "zustand";
import { Agent } from "@/lib/agent";
import type { DisplayMessage } from "@/lib/message";
import { safeErrorString } from "@/lib/utils";

type ReadonlyStoreApi<T> = Pick<StoreApi<T>, "getState" | "getInitialState" | "subscribe">;
type ReadonlyStore<T> = UseBoundStore<ReadonlyStoreApi<T>>;

type MessagesSetter = (messages: DisplayMessage[]) => void;

const idGenerator = createIdGenerator({ prefix: "chat" });

interface ChatId {
  id: string;
  requireLoading: boolean;
  loading: boolean;
  usage?: LanguageModelUsage;
  /** 文件的总结缓存 */
  files: Readonly<Record<string, string>>;
  checkpoint: number;

  newChat: () => void;
  loadChat: (id: string) => void;
  updateUsage: (id: string, usage: LanguageModelUsage) => void;
  updateFile: (id: string, key: string, value: string) => void;
  updateCheckpoint: (id: string, value: number) => void;
  loadMessages: (setter: MessagesSetter) => Promise<void>;
}

export const useChatId: ReadonlyStore<ChatId> = create((set, get) => ({
  id: idGenerator(),
  requireLoading: false,
  loading: false,
  files: {},
  checkpoint: 0,

  newChat: () => {
    const id = idGenerator();
    set({ id, requireLoading: false, loading: false, usage: undefined, files: {}, checkpoint: 0 });
  },

  loadChat: (id) => {
    set({ id, requireLoading: true, loading: false, usage: undefined, files: {}, checkpoint: 0 });
  },

  updateUsage: (id, usage) => {
    if (id !== get().id) return;
    set({ usage });
  },

  updateFile: (id, key, value) => {
    if (id !== get().id) return;
    set((status) => ({ files: { ...status.files, [key]: value } }));
  },

  updateCheckpoint: (id, checkpoint) => {
    if (id !== get().id) return;
    set({ checkpoint });
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
      const messages = JSON.parse(jsonString) as DisplayMessage[];

      // 防止在拉取对话期间点击其他对话造成状态不一致
      if (capturedId === get().id) {
        setter(messages);
        set({ checkpoint: messages.length });
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

  const { messages, sendMessage, status, setMessages, stop, error, clearError } = useChat({
    id: id,
    transport: new Agent(),
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: 监听 requireLoading 变化
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
    error,
    clearError,
  };
}
