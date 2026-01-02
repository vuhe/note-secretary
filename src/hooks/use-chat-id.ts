import { createIdGenerator, type LanguageModelUsage, type UIMessage } from "ai";
import { create, type StoreApi, type UseBoundStore } from "zustand";

type ReadonlyStoreApi<T> = Pick<StoreApi<T>, "getState" | "getInitialState" | "subscribe">;
type ReadonlyStore<T> = UseBoundStore<ReadonlyStoreApi<T>>;

type MessagesSetter = (messages: UIMessage[]) => void;

const idGenerator = createIdGenerator({
  prefix: "chat",
  size: 16,
});

interface ChatId {
  id: string;
  requireLoading: boolean;
  loading: boolean;
  usage?: LanguageModelUsage;

  newChat: () => void;
  loadChat: (id: string) => void;
  updateUsage: (usage: LanguageModelUsage) => void;
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

  updateUsage: (usage) => {
    set({ usage });
  },

  loadMessages: async (setter) => {
    const capturedId = get().id;
    set({ requireLoading: false, loading: true });

    try {
      // TODO: 需要从后台拉取历史记录并赋值

      // 防止在拉取对话期间点击其他对话造成状态不一致
      if (capturedId === get().id) {
        setter([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      // 防止在拉取对话期间点击其他对话造成状态不一致
      if (capturedId === get().id) {
        set({ loading: false });
      }
    }
  },
}));
