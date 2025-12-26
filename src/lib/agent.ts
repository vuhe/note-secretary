import type { ChatRequestOptions, ChatTransport, UIMessage, UIMessageChunk } from "ai";

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
    throw new Error("Not implemented");
  }

  reconnectToStream(_: ReconnectOption) {
    return Promise.resolve(null);
  }
}
