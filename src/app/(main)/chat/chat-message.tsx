"use client";

import type { ChatStatus, FileUIPart, UIMessage } from "ai";
import { CopyIcon, DownloadIcon, RefreshCcwIcon } from "lucide-react";
import mime from "mime-types";

import {
  Message,
  MessageAction,
  MessageActions,
  MessageAttachment,
  MessageAttachments,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Task, TaskContent, TaskItem, TaskTrigger } from "@/components/ai-elements/task";

interface MessageProps {
  message: UIMessage;
}

interface AgentMessageProps extends MessageProps {
  status: ChatStatus;
  last: boolean;
  regenerate: () => Promise<void>;
}

function filename(file: FileUIPart) {
  if (file.filename) return file.filename;
  const ext = mime.extension(file.mediaType);
  if (ext) return `保存生成的 ${ext} 文件`;
  return "保存生成文件";
}

function AgentMessage({ message, status, last, regenerate }: AgentMessageProps) {
  const sources = message.parts.filter(
    (part) => part.type === "source-url" || part.type === "source-document",
  );

  const downloadFile = () => {
    // TODO: 处理生成的文件下载保存到本地，移动端禁用
    console.debug("download file clicked");
  };

  return (
    <>
      {sources.length > 0 && (
        <Sources>
          <SourcesTrigger count={sources.length} />
          {sources.map((part, i) => (
            <SourcesContent key={`${message.id}-${i}`}>
              {part.type === "source-url" ? (
                <Source href={part.url} title={part.title ?? part.url} />
              ) : (
                <Source title={part.title} />
              )}
            </SourcesContent>
          ))}
        </Sources>
      )}
      {message.parts.map((part, i) => {
        switch (part.type) {
          case "text":
            return (
              <Message key={`${message.id}-${i}`} from={message.role}>
                <MessageContent>
                  <MessageResponse>{part.text}</MessageResponse>
                </MessageContent>
                {last && (
                  <MessageActions>
                    <MessageAction onClick={() => void regenerate()} label="重新生成">
                      <RefreshCcwIcon className="size-3" />
                    </MessageAction>
                    <MessageAction
                      onClick={() => void navigator.clipboard.writeText(part.text)}
                      label="复制内容"
                    >
                      <CopyIcon className="size-3" />
                    </MessageAction>
                  </MessageActions>
                )}
              </Message>
            );
          case "reasoning":
            return (
              <Reasoning
                key={`${message.id}-${i}`}
                className="w-full"
                isStreaming={status === "streaming" && i === message.parts.length - 1 && last}
              >
                <ReasoningTrigger />
                <ReasoningContent>{part.text}</ReasoningContent>
              </Reasoning>
            );
          // TODO: 工具显示需要更加细化 ToolUIPart<TOOLS> | DynamicToolUIPart
          case "dynamic-tool":
            return (
              <Task key={`${message.id}-${i}`} className="w-full">
                <TaskTrigger title={part.title ?? part.toolName} />
                <TaskContent>
                  <TaskItem>{part.state}</TaskItem>
                </TaskContent>
              </Task>
            );
          case "file": {
            const mediaType = part.mediaType.startsWith("image/") && part.url ? "image" : "file";
            if (mediaType === "image") {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={part.filename}
                  className="h-auto max-w-full overflow-hidden rounded-md"
                  src={part.url}
                />
              );
            } else {
              return (
                <Suggestions>
                  <Suggestion onClick={downloadFile} suggestion={part.filename ?? "下载文件"}>
                    <DownloadIcon />
                    {filename(part)}
                  </Suggestion>
                </Suggestions>
              );
            }
          }
          // TODO: DataUIPart<DATA_TYPES> 暂时没有使用
          default:
            return null;
        }
      })}
    </>
  );
}

function UserMessage({ message }: MessageProps) {
  const files = message.parts.filter((part) => part.type === "file");
  const content = message.parts.reduce((prev, curr) => {
    if (curr.type !== "text") return prev;
    if (prev === "") return curr.text;
    return `${prev}\n${curr.text}`;
  }, "");

  return (
    <Message from={message.role}>
      <MessageAttachments className="mb-2">
        {files.map((attachment) => (
          <MessageAttachment data={attachment} key={attachment.url} />
        ))}
      </MessageAttachments>
      <MessageContent>{content}</MessageContent>
      {/* TODO: 可能需要对用户消息添加 MessageActions */}
    </Message>
  );
}

export default function ChatMessage(props: AgentMessageProps) {
  if (props.message.role === "user") {
    return <UserMessage {...props} />;
  } else if (props.message.role === "assistant") {
    return <AgentMessage {...props} />;
  } else {
    return null;
  }
}
