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
import { uploadFile } from "@/lib/agent";

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
}

export default function ChatInput({ status, sendMessage, stop }: ChatInputProps) {
  const persona = usePersona((state) => state.selected);
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (status === "submitted" || status === "streaming") {
        void stop();
        return;
      }

      if (status === "error") {
        // TODO: 错误清空处理
        return;
      }

      if (!persona) return;
      const options: ChatRequestOptions = {
        metadata: persona,
      };

      const hasText = Boolean(message.text);
      const hasAttachments = Boolean(message.files.length);

      await Promise.all(
        message.files.map((file) =>
          uploadFile({
            chatId: useChatId.getState().id,
            fileId: file.id,
            mediaType: file.mediaType,
            filename: file.filename,
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
          url: file.ref === "ref" ? file.url : file.id,
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
    [status, sendMessage, stop, persona],
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
