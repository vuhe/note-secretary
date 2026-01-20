"use client";

import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open } from "@tauri-apps/plugin-dialog";
import type { ChatStatus } from "ai";
import {
  CornerDownLeftIcon,
  GlobeIcon,
  ImageIcon,
  Loader2Icon,
  NotebookTextIcon,
  PaperclipIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import {
  type ChangeEvent,
  type ClipboardEventHandler,
  type FormEvent,
  type KeyboardEventHandler,
  useCallback,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

import ChatPersona from "@/app/chat/chat-persona";
import NoteSelector from "@/app/chat/note-selector";
import { TauriImage } from "@/components/ai-elements/image";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { NavNote } from "@/hooks/use-navigation";
import { type AttachmentPart, usePrompt } from "@/hooks/use-prompt";
import { cn, safeErrorString } from "@/lib/utils";

function PromptInputAttachments() {
  const files = usePrompt((state) => state.files);
  if (!files.length) {
    return null;
  }

  const isImage = (part: AttachmentPart) => {
    return part.mediaType.startsWith("image/");
  };

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 pt-3 w-full">
      {files.map((file) => (
        <Popover key={file.id}>
          <PopoverTrigger asChild>
            <div
              className={cn(
                "group relative flex h-8 cursor-pointer select-none items-center gap-1.5 rounded-md border",
                "border-border px-1.5 font-medium text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                "dark:hover:bg-accent/50",
              )}
            >
              <div className="relative size-5 shrink-0">
                <div
                  className={cn(
                    "absolute inset-0 flex size-5 items-center justify-center overflow-hidden",
                    "rounded bg-background transition-opacity group-hover:opacity-0",
                  )}
                >
                  <div className="flex size-5 items-center justify-center text-muted-foreground">
                    {isImage(file) ? (
                      <ImageIcon className="size-3" />
                    ) : (
                      <PaperclipIcon className="size-3" />
                    )}
                  </div>
                </div>
                <Button
                  aria-label="Remove attachment"
                  className={cn(
                    "absolute inset-0 size-5 cursor-pointer rounded p-0 opacity-0 transition-opacity",
                    "group-hover:pointer-events-auto group-hover:opacity-100 [&>svg]:size-2.5",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    usePrompt.getState().removeFile(file.id);
                  }}
                  type="button"
                  variant="ghost"
                >
                  <XIcon />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>

              <span className="flex-1 truncate">{file.filename}</span>
            </div>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-2">
            <div className="w-auto space-y-3">
              {isImage(file) && (
                <div className="flex max-h-96 w-96 items-center justify-center overflow-hidden rounded-md border">
                  <TauriImage
                    alt={file.filename}
                    className="max-h-full max-w-full object-contain"
                    height={384}
                    loader={{ type: file.type, value: file.payload }}
                    width={448}
                  />
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <div className="min-w-0 flex-1 space-y-1 px-0.5">
                  <h4 className="truncate font-semibold text-sm leading-none">{file.filename}</h4>
                  <p className="truncate font-mono text-muted-foreground text-xs">
                    {file.mediaType}
                  </p>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}

function PromptInputTextarea() {
  const text = usePrompt((state) => state.text);
  const [isComposing, setIsComposing] = useState(false);

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter") {
      if (isComposing || e.nativeEvent.isComposing) {
        return;
      }
      if (!e.shiftKey) {
        return;
      }
      e.preventDefault();

      // Check if the Submit button is disabled before submitting
      const form = e.currentTarget.form;
      const submitButton = form?.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      if (submitButton?.disabled) {
        return;
      }

      form?.requestSubmit();
    }

    // Remove the last attachment when Backspace is pressed and the textarea is empty
    const files = usePrompt.getState().files;
    if (e.key === "Backspace" && e.currentTarget.value === "" && files.length > 0) {
      e.preventDefault();
      const lastAttachment = files.at(-1);
      if (lastAttachment) {
        usePrompt.getState().removeFile(lastAttachment.id);
      }
    }
  };

  const handlePaste: ClipboardEventHandler<HTMLTextAreaElement> = (event) => {
    const items = event.clipboardData.items;

    const files: File[] = [];

    for (const item of items) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      event.preventDefault();
      void usePrompt.getState().addUrlFiles(files);
    }
  };

  const handleChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    usePrompt.getState().changeText(event.target.value);
  }, []);

  return (
    <InputGroupTextarea
      className="field-sizing-content max-h-48 min-h-16 pb-0"
      name="message"
      value={text}
      placeholder="询问任何问题"
      onCompositionEnd={() => {
        setIsComposing(false);
      }}
      onCompositionStart={() => {
        setIsComposing(true);
      }}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onChange={handleChange}
    />
  );
}

function PromptInputAddNotes() {
  const onSelect = useCallback((note: NavNote) => {
    usePrompt.getState().addNoteFile(note);
  }, []);

  return (
    <NoteSelector onSelect={onSelect}>
      <InputGroupButton size="sm">
        <NotebookTextIcon size={16} />
      </InputGroupButton>
    </NoteSelector>
  );
}

function PromptInputAddFiles() {
  const onClick = useCallback(() => {
    open({
      title: "选择要上传的文件",
      multiple: true,
      directory: false,
    })
      .then((paths) => {
        if (!paths) return;
        void usePrompt.getState().addLocalPathFiles(paths);
      })
      .catch((error: unknown) => {
        toast.error("读取选择文件失败", {
          description: safeErrorString(error),
          closeButton: true,
        });
      });
  }, []);

  return (
    <InputGroupButton size="sm" onClick={onClick}>
      <ImageIcon size={16} />
    </InputGroupButton>
  );
}

function PromptInputSubmit({ status }: { status: ChatStatus }) {
  const disabled = usePrompt((state) => state.persona === undefined);
  let Icon = <CornerDownLeftIcon className="size-4" />;

  if (status === "submitted") {
    Icon = <Loader2Icon className="size-4 animate-spin" />;
  } else if (status === "streaming") {
    Icon = <SquareIcon className="size-4" />;
  } else if (status === "error") {
    Icon = <XIcon className="size-4" />;
  }

  return (
    <InputGroupButton
      aria-label="Submit"
      size="icon-sm"
      type="submit"
      variant={disabled ? "ghost" : "default"}
      disabled={disabled}
    >
      {Icon}
    </InputGroupButton>
  );
}

interface ChatInputProps {
  status: ChatStatus;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function ChatInput({ status, handleSubmit }: ChatInputProps) {
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);

  // Attach drop handlers on the nearest form and document
  useEffect(() => {
    const listening = getCurrentWebview().onDragDropEvent((event) => {
      if (event.payload.type === "drop") {
        void usePrompt.getState().addLocalPathFiles(event.payload.paths);
      }
    });
    return () => {
      void listening.then((unlisten) => unlisten);
    };
  }, []);

  return (
    <form className="w-full px-2 pb-2" onSubmit={handleSubmit}>
      <InputGroup className="overflow-hidden">
        <PromptInputAttachments />
        <div className="contents">
          <PromptInputTextarea />
        </div>
        <InputGroupAddon align="block-end" className="justify-between gap-1">
          <div className="flex items-center gap-1">
            <ChatPersona />
            <InputGroupButton
              size="sm"
              variant={useWebSearch ? "default" : "ghost"}
              onClick={() => {
                setUseWebSearch((it) => !it);
              }}
            >
              <GlobeIcon size={16} />
              <span className="hidden sm:flex">网络搜索</span>
            </InputGroupButton>
          </div>
          <div className="flex items-center gap-1">
            <PromptInputAddNotes />
            <PromptInputAddFiles />
            <PromptInputSubmit status={status} />
          </div>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
