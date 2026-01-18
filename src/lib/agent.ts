import {
  type ChatRequestOptions,
  type ChatTransport,
  createUIMessageStream,
  streamText,
  type UIMessageChunk,
} from "ai";
import { toast } from "sonner";
import { useChatId } from "@/hooks/use-chat";
import { convertMessages, type DisplayMessage, saveMessage } from "@/lib/message";
import type { Persona } from "@/lib/persona";
import { safeErrorString } from "@/lib/utils";

type SendMessageOption = {
  trigger: "submit-message" | "regenerate-message";
  chatId: string;
  messageId: string | undefined;
  messages: DisplayMessage[];
  abortSignal: AbortSignal | undefined;
} & ChatRequestOptions;

type ReconnectOption = {
  chatId: string;
} & ChatRequestOptions;

export interface SendMessageOptionBody {
  chatId: string;
  lastMessageLens: number;
}

export class Agent implements ChatTransport<DisplayMessage> {
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
      messages: await convertMessages(params.chatId, options.messages),
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
            useChatId.getState().updateCheckpoint(params.chatId, i + 1);
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
