import { invoke } from "@tauri-apps/api/core";
import {
  type ChatRequestOptions,
  type ChatTransport,
  convertToModelMessages,
  createUIMessageStream,
  streamText,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
import { toast } from "sonner";
import { useChatId } from "@/hooks/use-chat";
import type { Persona } from "@/lib/persona";
import { fileIdGenerator, safeErrorString } from "@/lib/utils";

type SendMessageOption = {
  trigger: "submit-message" | "regenerate-message";
  chatId: string;
  messageId: string | undefined;
  messages: UIMessage[];
  abortSignal: AbortSignal | undefined;
} & ChatRequestOptions;

type ReconnectOption = {
  chatId: string;
} & ChatRequestOptions;

export interface SendMessageOptionBody {
  chatId: string;
  lastMessageLens: number;
}

interface UploadChatFile {
  chatId: string;
  fileId: string;
  mediaType: string;
  filename?: string;
  summary?: string;
  data?: {
    kind: "file" | "tauri" | "ref";
    data: string;
  };
}

export async function uploadFile(file: UploadChatFile) {
  await invoke("save_chat_file", { file });
}

/** 保存单条记录 */
export async function saveMessage(chatId: string, message: UIMessage, index: number) {
  const messageId = message.id;
  for (const part of message.parts) {
    if (part.type === "file" && !part.url.startsWith("file-")) {
      const id = fileIdGenerator();
      await uploadFile({
        chatId: chatId,
        fileId: id,
        mediaType: part.mediaType,
        filename: part.filename,
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

export class Agent implements ChatTransport<UIMessage> {
  async sendMessages(options: SendMessageOption): Promise<ReadableStream<UIMessageChunk>> {
    const params = options.body as SendMessageOptionBody;
    if (useChatId.getState().id !== params.chatId) throw Error("chat change!");

    const model = options.metadata as Persona;
    const result = streamText({
      model: model.model,
      maxOutputTokens: model.maxOutputTokens,
      temperature: model.temperature,
      topP: model.topP,
      topK: model.topK,
      presencePenalty: model.presencePenalty,
      frequencyPenalty: model.frequencyPenalty,
      system: model.systemPrompt,
      messages: await convertToModelMessages(options.messages),
      abortSignal: options.abortSignal,
      onStepFinish: (it) => {
        useChatId.getState().updateUsage(params.chatId, it.usage);
      },
    });
    return createUIMessageStream({
      async execute({ writer }) {
        // TODO: 将 writer 传入 tool 用于在工具中发送状态
        writer.merge(result.toUIMessageStream());
      },
      onError: safeErrorString,
      originalMessages: options.messages,
      onFinish: async ({ messages }) => {
        let success = true;
        for (let i = params.lastMessageLens; i < messages.length; i++) {
          try {
            await saveMessage(params.chatId, messages[i], i);
          } catch (error) {
            success = false;
            if (useChatId.getState().id === params.chatId) {
              const remaining = messages.length - i;
              toast.error(`${remaining} 条对话记录保存失败`, {
                description: safeErrorString(error),
                closeButton: true,
              });
            }
            break;
          }
        }
        if (success && useChatId.getState().id === params.chatId) {
          toast.info("对话已保存", {
            closeButton: true,
          });
        }
      },
    });
  }

  reconnectToStream(_: ReconnectOption) {
    return Promise.resolve(null);
  }
}
