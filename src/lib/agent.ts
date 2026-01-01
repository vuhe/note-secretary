import {
  type ChatRequestOptions,
  type ChatTransport,
  convertToModelMessages,
  streamText,
  type UIMessage,
  type UIMessageChunk,
} from "ai";
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
    });
    return result.toUIMessageStream();
  }

  reconnectToStream(_: ReconnectOption) {
    return Promise.resolve(null);
  }
}
