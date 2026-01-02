import {
  type ChatRequestOptions,
  type ChatTransport,
  convertToModelMessages,
  createUIMessageStream,
  streamText,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
import { useChatId } from "@/hooks/use-chat-id";
import type { Persona } from "@/hooks/use-persona";

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

export class Agent implements ChatTransport<UIMessage> {
  async sendMessages(options: SendMessageOption): Promise<ReadableStream<UIMessageChunk>> {
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
        useChatId.getState().updateUsage(it.usage);
      },
    });
    return createUIMessageStream({
      async execute({ writer }) {
        // TODO: 将 writer 传入 tool 用于在工具中发送状态
        writer.merge(result.toUIMessageStream());
      },
      onError: (error) => {
        if (error instanceof Error) return error.message;
        if (typeof error === "string") return error;
        if (error == null) return "";
        try {
          return JSON.stringify(error);
        } catch {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          return String(error);
        }
      },
      originalMessages: options.messages,
      onFinish: ({ messages }) => {
        // TODO: 保存历史记录
      },
    });
  }

  reconnectToStream(_: ReconnectOption) {
    return Promise.resolve(null);
  }
}
