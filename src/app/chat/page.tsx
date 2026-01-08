"use client";

import { Loader2Icon, MessageSquareIcon } from "lucide-react";

import ChatContext from "@/app/chat/chat-context";
import ChatInput from "@/app/chat/chat-input";
import ChatMessage from "@/app/chat/chat-message";
import ChatUsage from "@/app/chat/chat-usage";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useChatContext, useChatId } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";

export default function Page() {
  const loading = useChatId((state) => state.loading);
  const { messages, sendMessage, status, stop } = useChatContext();

  return (
    <SidebarInset key="chat">
      <header
        className={cn(
          "flex h-(--header-height) shrink-0 items-center gap-2 border-b",
          "transition-[width,height] ease-linear",
          "group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)",
        )}
      >
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1 mr-2" />
          <ChatContext />
          <div className="ml-auto flex items-center gap-2">
            <ChatUsage />
          </div>
        </div>
      </header>
      <div className="@container/main flex flex-1 flex-col min-h-0">
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
                  message={message}
                />
              ))
            )}
            {status === "submitted" && (
              <div className="inline-flex items-center justify-center text-muted-foreground gap-1">
                <Loader2Icon className="size-4 animate-spin" />
                <span className="text-sm">正在加载……</span>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <ChatInput status={status} sendMessage={sendMessage} stop={stop} />
      </div>
    </SidebarInset>
  );
}
