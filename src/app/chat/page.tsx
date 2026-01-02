"use client";

import { useChat } from "@ai-sdk/react";
import { MessageSquareIcon } from "lucide-react";
import { useEffect } from "react";

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
import { Loader } from "@/components/ai-elements/loader";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useChatId } from "@/hooks/use-chat-id";
import { Agent } from "@/lib/agent";

export default function Page() {
  const id = useChatId((state) => state.id);
  const requireLoading = useChatId((state) => state.requireLoading);
  const loading = useChatId((state) => state.loading);

  const { messages, sendMessage, status, regenerate, setMessages, stop } = useChat({
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
    <SidebarInset>
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1 mr-2" />
          <ChatContext />
          <div className="ml-auto flex items-center gap-2">
            <ChatUsage />
            <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
              <a
                href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
                rel="noopener noreferrer"
                target="_blank"
                className="dark:text-foreground"
              >
                GitHub
              </a>
            </Button>
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
                  regenerate={regenerate}
                  message={message}
                />
              ))
            )}
            {status === "submitted" && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <ChatInput status={status} sendMessage={sendMessage} stop={stop} />
      </div>
    </SidebarInset>
  );
}
