"use client";

import type { ChatRequestOptions, ChatStatus, FileUIPart } from "ai";
import { GlobeIcon, PlusIcon } from "lucide-react";
import { useCallback, useState } from "react";

import ChatPersona from "@/app/chat/chat-persona";
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
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { useChatId } from "@/hooks/use-chat";
import { usePersona } from "@/hooks/use-persona";
import type { SendMessageOptionBody } from "@/lib/agent";
import { saveChatFile } from "@/lib/message";

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
  sendMessage: (msg: SendMessageOptions, options?: ChatRequestOptions) => Promise<void>;
  stop: () => Promise<void>;
  clearError: () => void;
}

export default function ChatInput({ status, sendMessage, stop, clearError }: ChatInputProps) {
  const persona = usePersona((state) => state.selected);
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (status === "submitted" || status === "streaming") {
        await stop();
        throw "防止清理未提交的数据";
      }

      if (status === "error") {
        clearError();
        throw "防止清理未提交的数据";
      }

      if (!persona) return;
      const chatId = useChatId.getState().id;
      const checkpoint = useChatId.getState().checkpoint;
      const options: ChatRequestOptions = {
        metadata: persona,
        body: {
          chatId,
          lastMessageLens: checkpoint,
        } as SendMessageOptionBody,
      };

      const hasText = Boolean(message.text);
      const hasAttachments = Boolean(message.files.length);

      await Promise.all(
        message.files.map((file) =>
          saveChatFile({
            chatId,
            fileId: file.id,
            data: {
              kind: file.ref,
              data: file.url,
            },
          }),
        ),
      );

      const files = message.files.map((file): FileUIPart => {
        return {
          type: "file",
          mediaType: file.mediaType,
          filename: file.filename,
          url: file.id,
          providerMetadata: file.providerMetadata,
        };
      });

      if (hasText) {
        const attachmentFiles = hasAttachments ? files : undefined;
        void sendMessage({ text: message.text, files: attachmentFiles }, options);
      } else if (hasAttachments) {
        void sendMessage({ files }, options);
      }
    },
    [status, sendMessage, stop, clearError, persona],
  );

  return (
    <div className="px-2 pb-2">
      <PromptInput multiple onSubmit={handleSubmit}>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
        <PromptInputBody>
          <PromptInputTextarea placeholder="询问任何问题" />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <ChatPersona />
            <PromptInputButton
              onClick={() => {
                setUseWebSearch(!useWebSearch);
              }}
              variant={useWebSearch ? "default" : "ghost"}
            >
              <GlobeIcon size={16} />
              <span className="hidden sm:flex">网络搜索</span>
            </PromptInputButton>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger>
                <PlusIcon size={16} />
                <span className="hidden sm:flex">添加附件</span>
              </PromptInputActionMenuTrigger>
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments label="添加图片或文件" />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
          </PromptInputTools>
          <PromptInputSubmit status={status} disabled={persona === undefined} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
