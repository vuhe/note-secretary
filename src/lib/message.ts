import type { FilePart, UIMessage } from "ai";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type MessageDataPart = {
  file: FilePart;
};

export type DisplayMessage = UIMessage<unknown, MessageDataPart>;
