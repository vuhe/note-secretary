"use client";

import { useChat } from "@ai-sdk/react";
import { MessageSquareIcon } from "lucide-react";

import ChatMessage from "@/app/(main)/chat/chat-message";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { Agent } from "@/lib/agent";

export default function Page() {
  const { messages, sendMessage, status, regenerate } = useChat({
    transport: new Agent(),
  });

  return (
    <div className="flex flex-col h-full">
      <Conversation className="h-full">
        <ConversationContent>
          {messages.length === 0 ? (
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
