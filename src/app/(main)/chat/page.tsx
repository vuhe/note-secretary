"use client";

import { useChat } from "@ai-sdk/react";
import { MessageSquareIcon } from "lucide-react";
import { useEffect } from "react";

import ChatMessage from "@/app/(main)/chat/chat-message";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { useChatId } from "@/hooks/use-chat-id";
import { Agent } from "@/lib/agent";

export default function Page() {
  const id = useChatId((state) => state.id);
  const requireLoading = useChatId((state) => state.requireLoading);
  const loading = useChatId((state) => state.loading);

  const { messages, sendMessage, status, regenerate, setMessages } = useChat({
    id: id,
    transport: new Agent(),
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: listen requireLoading change
  useEffect(() => {
    const state = useChatId.getState();
    if (!state.requireLoading || state.loading) return;
    void state.loadMessages(setMessages);
  }, [requireLoading, setMessages]);

  return (
    <div className="flex flex-col h-full">
      <Conversation className="h-full">
        <ConversationContent>
          {loading ? (
            <ConversationEmptyState
              description="正在载入历史对话信息"
              icon={<MessageSquareIcon className="size-6" />}
              title="加载对话中"
            />
          ) : messages.length === 0 ? (
            <ConversationEmptyState
              description="向 Agent 发送消息以开始对话"
              icon={<MessageSquareIcon className="size-6" />}
              title="新对话"
            />
          ) : (
            messages.map((message, i) => (
              <ChatMessage
                key={message.id}
                status={status}
                last={i === messages.length - 1}
                regenerate={regenerate}
                message={message}
              />
            ))
          )}
          {status === "submitted" && <Loader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>
  );
}
