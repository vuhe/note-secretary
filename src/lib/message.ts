import { invoke } from "@tauri-apps/api/core";
import { convertToModelMessages, type FilePart, type TextPart, type UIMessage } from "ai";
import { useChatId } from "@/hooks/use-chat";
import { fileIdGenerator } from "@/lib/utils";

type MessageDataPart = {
  file: FilePart | TextPart;
};

export type DisplayMessage = UIMessage<unknown, MessageDataPart>;

interface TauriChatReadFile {
  chatId: string;
  fileId: string;
}

interface TauriChatSaveFile extends TauriChatReadFile {
  data: {
    kind: "file" | "tauri" | "ref";
    data: string;
  };
}

/** 读取对话文件 */
async function readChatFile(file: TauriChatReadFile) {
  const chat = useChatId.getState();
  let summary: string | undefined;
  if (chat.id === file.chatId) {
    summary = chat.files[file.fileId];
  }
  if (summary) {
    return summary;
  }
  // TODO: 如果存在总结AI，调用总结AI进行总结并保存
  return await invoke<Uint8Array>("read_chat_file", { file });
}

/** 保存对话文件 */
export async function saveChatFile(file: TauriChatSaveFile) {
  await invoke("save_chat_file", { file });
}

/** 转换对话记录 */
export async function convertMessages(chatId: string, messages: DisplayMessage[]) {
  const inputMessages: DisplayMessage[] = [];
  for (const message of messages) {
    const parts: DisplayMessage["parts"] = [];
    for (const part of message.parts) {
      if (part.type === "file" && part.url.startsWith("file-")) {
        const data = await readChatFile({ chatId, fileId: part.url });
        if (typeof data === "string") {
          const filename = part.filename ? ` '${part.filename}' ` : "";
          parts.push({
            type: "data-file",
            data: {
              type: "text",
              text: `经 AI 总结提取，文件${filename}内容为：\n\n${data}`,
              ...(part.providerMetadata ? { providerOptions: part.providerMetadata } : {}),
            },
          });
        } else {
          parts.push({
            type: "data-file",
            data: {
              type: "file",
              data: data,
              filename: part.filename,
              mediaType: part.mediaType,
              ...(part.providerMetadata ? { providerOptions: part.providerMetadata } : {}),
            },
          } as const);
        }
      } else {
        parts.push(part);
      }
    }
    inputMessages.push({
      ...message,
      parts,
    });
  }

  return convertToModelMessages<DisplayMessage>(inputMessages, {
    convertDataPart: (it) => {
      switch (it.type) {
        // 未来可能会增加定义
        case "data-file":
          return it.data;
        default:
          return undefined;
      }
    },
  });
}

/** 保存单条对话记录 */
export async function saveMessage(chatId: string, message: DisplayMessage, index: number) {
  const messageId = message.id;
  for (const part of message.parts) {
    if (part.type === "file" && !part.url.startsWith("file-")) {
      const id = fileIdGenerator();
      await saveChatFile({
        chatId: chatId,
        fileId: id,
        data: {
          kind: "file",
          data: part.url,
        },
      });
      part.url = id;
    }
  }
  await invoke("save_chat_message", {
    message: {
      chatId,
      index,
      messageId,
      message,
    },
  });
}
