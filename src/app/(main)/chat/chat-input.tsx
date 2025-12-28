import type { ChatStatus, FileUIPart } from "ai";
import { GlobeIcon } from "lucide-react";
import { useCallback, useRef } from "react";

import ChatPersona from "@/app/(main)/chat/chat-persona";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";

type SendMessageOptions =
  | {
      text: string;
      files?: FileUIPart[];
    }
  | {
      files: FileUIPart[];
    };

interface ChatInputProps {
  status: ChatStatus;
  sendMessage: (options: SendMessageOptions) => Promise<void>;
}

export default function ChatInput({ status, sendMessage }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const hasText = Boolean(message.text);
      const hasAttachments = Boolean(message.files.length);

      if (hasText) {
        const files = hasAttachments ? message.files : undefined;
        void sendMessage({ text: message.text, files });
      } else if (hasAttachments) {
        void sendMessage({ files: message.files });
      }
    },
    [sendMessage],
  );

  return (
    <div className="px-2 pb-2">
      <PromptInputProvider>
        <PromptInput globalDrop multiple onSubmit={handleSubmit}>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
          <PromptInputBody>
            <PromptInputTextarea ref={textareaRef} />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputButton>
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <ChatPersona />
            </PromptInputTools>
            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      </PromptInputProvider>
    </div>
  );
}
