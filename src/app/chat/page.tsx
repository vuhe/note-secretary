"use client";

import { AlertCircleIcon, Loader2Icon, MessageSquareIcon } from "lucide-react";
import type { ReactNode } from "react";

import { ChatHeader } from "@/app/chat/chat-header";
import { ChatInput } from "@/app/chat/chat-input";
import { ChatMessages } from "@/app/chat/chat-message";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SidebarInset } from "@/components/ui/sidebar";
import { useChatContext, useChatId } from "@/hooks/use-chat";
import { safeErrorString } from "@/lib/utils";

function ChatAutoLoading({ children }: { children: ReactNode }) {
  const loading = useChatId((state) => state.loading);
  if (loading) {
    return (
      <ConversationEmptyState
        icon={<Loader2Icon className="size-6 animate-spin" />}
        title="加载对话中"
        description="正在载入历史对话信息"
      />
    );
  }

  return <>{children}</>;
}

function ChatEmpty({ empty }: { empty: boolean }) {
  if (!empty) return null;

  return (
    <ConversationEmptyState
      icon={<MessageSquareIcon className="size-6" />}
      title="新对话"
      description="向 Agent 发送消息以开始对话"
    />
  );
}

// biome-ignore lint/style/noDefaultExport: Next.js Page
export default function Page() {
  const { messages, status, error, handleSubmit } = useChatContext();

  return (
    <SidebarInset key="chat">
      <ChatHeader />
      <div className="@container/main flex flex-1 flex-col min-h-0">
        <Conversation className="h-full">
          <ConversationContent>
            <ChatAutoLoading>
              <ChatEmpty empty={messages.length === 0} />
              <ChatMessages messages={messages} status={status} />
              {status === "submitted" && (
                <div className="inline-flex items-center justify-center text-muted-foreground gap-1">
                  <Loader2Icon className="size-4 animate-spin" />
                  <span className="text-sm">正在加载……</span>
                </div>
              )}
              {status === "error" && (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertTitle>遇到错误！</AlertTitle>
                  {error && <AlertDescription>{safeErrorString(error)}</AlertDescription>}
                </Alert>
              )}
            </ChatAutoLoading>
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <ChatInput status={status} handleSubmit={handleSubmit} />
      </div>
    </SidebarInset>
  );
}
