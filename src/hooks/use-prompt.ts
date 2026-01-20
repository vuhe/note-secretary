import { basename } from "@tauri-apps/api/path";
import type { ChatRequestOptions, FileUIPart } from "ai";
import mime from "mime-types";
import { toast } from "sonner";
import { create, type StoreApi, type UseBoundStore } from "zustand";
import { useChatId } from "@/hooks/use-chat";
import type { NavNote } from "@/hooks/use-navigation";
import type { SendMessageOptionBody } from "@/lib/agent";
import { saveChatFile, type TauriChatFileType } from "@/lib/message";
import type { Persona } from "@/lib/persona";
import { fileIdGenerator, safeErrorString } from "@/lib/utils";

type ReadonlyStoreApi<T> = Pick<StoreApi<T>, "getState" | "getInitialState" | "subscribe">;
type ReadonlyStore<T> = UseBoundStore<ReadonlyStoreApi<T>>;

export interface AttachmentPart {
  id: string;
  type: TauriChatFileType;
  mediaType: string;
  filename: string;
  payload: string;
}

type SubmittedMessagePart = { text: string; files?: FileUIPart[] } | { files: FileUIPart[] };

interface SubmittedPart {
  message: SubmittedMessagePart;
  options?: ChatRequestOptions;
}

interface PromptContext {
  persona?: Persona;
  text: string;
  files: AttachmentPart[];

  selectPersona: (value: Persona) => void;
  changeText: (value: string) => void;
  addUrlFiles: (files: File[]) => Promise<void>;
  addLocalPathFiles: (paths: string[]) => Promise<void>;
  addNoteFile: (note: NavNote) => void;
  removeFile: (id: string) => void;
  submit: (chatId: string) => Promise<SubmittedPart | undefined>;
}

async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    // 成功时的回调
    reader.onload = () => {
      resolve(reader.result as string);
    };

    // 失败时的回调
    reader.onerror = (error) => {
      reject(error);
    };

    // 直接读取 File 对象（无需转成 Blob）
    reader.readAsDataURL(file);
  });
}

export const usePrompt: ReadonlyStore<PromptContext> = create((set, get) => ({
  text: "",
  files: [],

  selectPersona: (persona) => {
    set({ persona });
  },

  changeText: (text) => {
    set({ text });
  },

  addUrlFiles: async (files) => {
    try {
      const parts = await Promise.all(
        files.map(async (file): Promise<AttachmentPart> => {
          const id = fileIdGenerator();
          const filename = file.name;
          const mediaType = file.type;
          const payload = await fileToDataURL(file);
          return { id, type: "url", mediaType, filename, payload };
        }),
      );
      set((it) => ({ files: it.files.concat(parts) }));
    } catch (error) {
      toast.error("读取文件失败", {
        description: safeErrorString(error),
        closeButton: true,
      });
    }
  },

  addLocalPathFiles: async (paths) => {
    try {
      const parts = await Promise.all(
        paths.map(async (it: string): Promise<AttachmentPart> => {
          const id = fileIdGenerator();
          const filename = await basename(it);
          const mediaType = mime.lookup(it) || "application/octet-stream";
          return { id, type: "local-path", mediaType, filename, payload: it };
        }),
      );
      set((it) => ({ files: it.files.concat(parts) }));
    } catch (error) {
      toast.error("读取选择文件失败", {
        description: safeErrorString(error),
        closeButton: true,
      });
    }
  },

  addNoteFile: (note) => {
    const part: AttachmentPart = {
      id: fileIdGenerator(),
      type: "saved-id",
      mediaType: "text/markdown",
      filename: `${note.title}.md`,
      payload: note.id,
    };
    set((it) => ({ files: it.files.concat([part]) }));
  },

  removeFile: (id) => {
    set((it) => ({ files: it.files.filter((f) => f.id !== id) }));
  },

  submit: async (chatId) => {
    const persona = get().persona;
    if (!persona) return undefined;
    const checkpoint = useChatId.getState().checkpoint;

    const text = get().text;
    const files = get().files;

    // 是否上传了不支持的文件筛查
    for (const file of files) {
      // TODO: 需要检查是否有文档总结 AI
      // biome-ignore lint/nursery/useAwaitThenable: 误报
      const isSupportedFile = (await persona.supportedFile(file.mediaType)) || false;
      if (!isSupportedFile) {
        const filename = file.filename ? ` '${file.filename}' ` : "";
        throw new Error(`模型不支持${filename}文件且无法转换为文本摘要`);
      }
    }

    await Promise.all(
      files.map((file) =>
        saveChatFile({
          chatId,
          fileId: file.id,
          data: {
            kind: file.type,
            payload: file.payload,
          },
        }),
      ),
    );

    const uiFiles = files.map((file): FileUIPart => {
      return {
        type: "file",
        mediaType: file.mediaType,
        filename: file.filename,
        url: file.id,
      };
    });

    const options: ChatRequestOptions = {
      metadata: persona,
      body: {
        chatId,
        lastMessageLens: checkpoint,
      } as SendMessageOptionBody,
    };

    // 跨跃 await 需要检查当前的对话是否变更
    if (chatId !== useChatId.getState().id) {
      return undefined;
    }

    const hasText = Boolean(text);
    const hasAttachments = Boolean(files.length);

    let message: SubmittedMessagePart | undefined;
    if (hasText) {
      const attachmentFiles = hasAttachments ? uiFiles : undefined;
      message = { text: text, files: attachmentFiles };
    } else if (hasAttachments) {
      message = { files: uiFiles };
    }
    if (message) {
      set({ text: "", files: [] });
      return { message, options };
    }
    return undefined;
  },
}));
