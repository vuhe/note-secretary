// noinspection JSUnusedGlobalSymbols

"use client";

import { basename } from "@tauri-apps/api/path";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { open } from "@tauri-apps/plugin-dialog";
import { type ChatStatus, createIdGenerator, type FileUIPart } from "ai";
import {
  CornerDownLeftIcon,
  ImageIcon,
  Loader2Icon,
  PaperclipIcon,
  PlusIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import mime from "mime-types";
import type {
  ClipboardEventHandler,
  ComponentProps,
  FormEvent,
  FormEventHandler,
  HTMLAttributes,
  KeyboardEventHandler,
  ReactNode,
} from "react";
import {
  Children,
  createContext,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { TauriImage } from "@/components/ai-elements/image";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, safeErrorString } from "@/lib/utils";

const nanoid = createIdGenerator({ prefix: "file" });

type AttachmentFileUIPart = FileUIPart & { id: string; ref: "file" | "tauri" | "ref" };

interface AttachmentTauriItem {
  path: string;
  filename: string;
}

interface AttachmentRefItem {
  refId: string;
  filename: string;
}

type AttachmentAddItems =
  | { type: "files"; files: File[] }
  | { type: "tauri"; paths: AttachmentTauriItem[] }
  | { type: "ref"; refs: AttachmentRefItem[] };

export interface AttachmentsContext {
  files: AttachmentFileUIPart[];
  add: (files: AttachmentAddItems) => void;
  remove: (id: string) => void;
  clear: () => void;
  multipleSelect: boolean;
}

// ============================================================================
// Component Context & Hooks
// ============================================================================

const LocalAttachmentsContext = createContext<AttachmentsContext | null>(null);

const usePromptInputAttachments = () => {
  const context = useContext(LocalAttachmentsContext);
  if (!context) {
    throw new Error(
      "usePromptInputAttachments must be used within a PromptInput or PromptInputProvider",
    );
  }
  return context;
};

export type PromptInputAttachmentProps = HTMLAttributes<HTMLDivElement> & {
  data: AttachmentFileUIPart;
  className?: string;
};

export function PromptInputAttachment({ data, className, ...props }: PromptInputAttachmentProps) {
  const attachments = usePromptInputAttachments();

  const filename = data.filename ?? "";

  const mediaType = data.mediaType.startsWith("image/") && data.url ? "image" : "file";
  const isImage = mediaType === "image";

  const attachmentLabel = filename || (isImage ? "Image" : "Attachment");

  return (
    <PromptInputPopover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "group relative flex h-8 cursor-pointer select-none items-center gap-1.5 rounded-md border",
            "border-border px-1.5 font-medium text-sm transition-all hover:bg-accent hover:text-accent-foreground",
            "dark:hover:bg-accent/50",
            className,
          )}
          key={data.id}
          {...props}
        >
          <div className="relative size-5 shrink-0">
            <div
              className={cn(
                "absolute inset-0 flex size-5 items-center justify-center overflow-hidden",
                "rounded bg-background transition-opacity group-hover:opacity-0",
              )}
            >
              <div className="flex size-5 items-center justify-center text-muted-foreground">
                {isImage ? <ImageIcon className="size-3" /> : <PaperclipIcon className="size-3" />}
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
                attachments.remove(data.id);
              }}
              type="button"
              variant="ghost"
            >
              <XIcon />
              <span className="sr-only">Remove</span>
            </Button>
          </div>

          <span className="flex-1 truncate">{attachmentLabel}</span>
        </div>
      </PopoverTrigger>
      <PromptInputPopoverContent className="w-auto p-2">
        <div className="w-auto space-y-3">
          {isImage && (
            <div className="flex max-h-96 w-96 items-center justify-center overflow-hidden rounded-md border">
              <TauriImage
                alt={filename || "attachment preview"}
                className="max-h-full max-w-full object-contain"
                height={384}
                loader={{ type: data.ref, value: data.url }}
                width={448}
              />
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <div className="min-w-0 flex-1 space-y-1 px-0.5">
              <h4 className="truncate font-semibold text-sm leading-none">
                {filename || (isImage ? "Image" : "Attachment")}
              </h4>
              {data.mediaType && (
                <p className="truncate font-mono text-muted-foreground text-xs">{data.mediaType}</p>
              )}
            </div>
          </div>
        </div>
      </PromptInputPopoverContent>
    </PromptInputPopover>
  );
}

export type PromptInputAttachmentsProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  children: (attachment: AttachmentFileUIPart) => ReactNode;
};

export function PromptInputAttachments({
  children,
  className,
  ...props
}: PromptInputAttachmentsProps) {
  const attachments = usePromptInputAttachments();

  if (!attachments.files.length) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2 p-3 w-full", className)} {...props}>
      {attachments.files.map((file) => (
        <Fragment key={file.id}>{children(file)}</Fragment>
      ))}
    </div>
  );
}

export type PromptInputActionAddAttachmentsProps = ComponentProps<typeof DropdownMenuItem> & {
  label?: string;
};

export const PromptInputActionAddAttachments = ({
  label = "Add photos or files",
  ...props
}: PromptInputActionAddAttachmentsProps) => {
  const attachments = usePromptInputAttachments();

  const onSelect = useCallback(async () => {
    try {
      const selected = await open({
        title: "选择要上传的文件",
        multiple: attachments.multipleSelect,
        directory: false,
      });

      if (Array.isArray(selected)) {
        const paths = await Promise.all(
          selected.map(async (it: string): Promise<AttachmentTauriItem> => {
            const filename = await basename(it);
            return { path: it, filename };
          }),
        );
        attachments.add({ type: "tauri", paths });
      } else if (selected !== null) {
        const filename = await basename(selected);
        attachments.add({ type: "tauri", paths: [{ path: selected, filename }] });
      }
    } catch (error) {
      toast.error("读取选择文件失败", {
        description: safeErrorString(error),
        closeButton: true,
      });
    }
  }, [attachments]);

  return (
    <DropdownMenuItem
      {...props}
      onSelect={(e) => {
        e.preventDefault();
        void onSelect();
      }}
    >
      <ImageIcon className="mr-2 size-4" /> {label}
    </DropdownMenuItem>
  );
};

export interface PromptInputMessage {
  text: string;
  files: AttachmentFileUIPart[];
}

export type PromptInputProps = Omit<HTMLAttributes<HTMLFormElement>, "onSubmit" | "onError"> & {
  accept?: string; // e.g., "image/*" or leave undefined for any
  multiple?: boolean;
  // Minimal constraints
  maxFiles?: number;
  onSubmit: (message: PromptInputMessage, event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export const PromptInput = ({
  className,
  accept,
  multiple,
  maxFiles,
  onSubmit,
  children,
  ...props
}: PromptInputProps) => {
  // Refs
  const formRef = useRef<HTMLFormElement | null>(null);

  // ----- Local attachments (only used when no provider)
  const [items, setItems] = useState<AttachmentFileUIPart[]>([]);
  const files = items;

  // Keep a ref to files for cleanup on unmounting (avoids stale closure)
  const filesRef = useRef(files);
  // eslint-disable-next-line react-hooks/refs
  filesRef.current = files;

  const matchesAccept = useCallback(
    (type: string) => {
      if (!accept || accept.trim() === "") {
        return true;
      }

      const patterns = accept
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      return patterns.some((pattern) => {
        if (pattern.endsWith("/*")) {
          const prefix = pattern.slice(0, -1); // e.g: image/* -> image/
          return type.startsWith(prefix);
        }
        return type === pattern;
      });
    },
    [accept],
  );

  const add = useCallback(
    (fileList: AttachmentAddItems) => {
      let fileCount: number;
      const accepted: AttachmentFileUIPart[] = [];

      if (fileList.type === "files") {
        fileCount = fileList.files.length;
        for (const file of fileList.files) {
          if (!matchesAccept(file.type)) continue;
          accepted.push({
            id: nanoid(),
            ref: "file",
            type: "file",
            url: URL.createObjectURL(file),
            mediaType: file.type,
            filename: file.name,
          });
        }
      } else if (fileList.type === "tauri") {
        fileCount = fileList.paths.length;
        for (const path of fileList.paths) {
          const mimeType = mime.lookup(path.path);
          if (typeof mimeType === "boolean") continue;
          if (!matchesAccept(mimeType)) continue;
          accepted.push({
            id: nanoid(),
            ref: "tauri",
            type: "file",
            url: path.path,
            mediaType: mimeType,
            filename: path.filename,
          });
        }
      } else {
        fileCount = fileList.refs.length;
        for (const ref of fileList.refs) {
          accepted.push({
            id: nanoid(),
            ref: "ref",
            type: "file",
            url: ref.refId,
            mediaType: "text/plain",
            filename: ref.filename,
          });
        }
      }

      if (fileCount && accepted.length === 0) {
        toast.warning("没有文件符合可接受的类型", {
          closeButton: true,
        });
        return;
      }

      setItems((prev) => {
        const capacity =
          typeof maxFiles === "number" ? Math.max(0, maxFiles - prev.length) : undefined;
        const capped = typeof capacity === "number" ? accepted.slice(0, capacity) : accepted;
        if (typeof capacity === "number" && accepted.length > capacity) {
          toast.warning("文件过多，部分文件未添加", {
            closeButton: true,
          });
        }
        return prev.concat(capped);
      });
    },
    [matchesAccept, maxFiles],
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const found = prev.find((file) => file.id === id);
      if (found?.ref === "file" && found.url) {
        URL.revokeObjectURL(found.url);
      }
      return prev.filter((file) => file.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setItems((prev) => {
      for (const file of prev) {
        if (file.ref === "file" && file.url) {
          URL.revokeObjectURL(file.url);
        }
      }
      return [];
    });
  }, []);

  // Attach drop handlers on the nearest form and document
  useEffect(() => {
    const listening = getCurrentWebview().onDragDropEvent((event) => {
      if (event.payload.type === "drop") {
        Promise.all(
          event.payload.paths.map(async (it): Promise<AttachmentTauriItem> => {
            const filename = await basename(it);
            return { path: it, filename };
          }),
        ).then(
          (paths) => {
            add({ type: "tauri", paths });
          },
          () => {},
        );
      }
    });
    return () => {
      void listening.then((unlisten) => unlisten);
    };
  }, [add]);

  useEffect(
    () => () => {
      for (const f of filesRef.current) {
        if (f.ref === "file" && f.url) URL.revokeObjectURL(f.url);
      }
    },
    [],
  );

  const convertBlobUrlToDataUrl = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      // eslint-disable-next-line @typescript-eslint/return-await
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          resolve(null);
        };
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const ctx = useMemo<AttachmentsContext>(
    () => ({
      files: files.map((item) => ({ ...item, id: item.id })),
      add,
      remove,
      clear,
      multipleSelect: multiple ?? false,
    }),
    [files, add, remove, clear, multiple],
  );

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const text = (formData.get("message") as string) || "";

    // Reset form immediately after capturing text to avoid race condition
    // where user input during async blob conversion would be lost
    form.reset();

    // Convert blob URLs to data URLs asynchronously
    Promise.all(
      files.map(async (item) => {
        if (item.url.startsWith("blob:")) {
          const dataUrl = await convertBlobUrlToDataUrl(item.url);
          // If conversion failed, keep the original blob URL
          return {
            ...item,
            url: dataUrl ?? item.url,
          };
        }
        return item;
      }),
    )
      .then((convertedFiles: AttachmentFileUIPart[]) => {
        try {
          onSubmit({ text, files: convertedFiles }, event)
            .then(() => {
              clear();
            })
            .catch(() => {
              // Don't clear on error - user may want to retry
            });
        } catch {
          // Don't clear on error - user may want to retry
        }
      })
      .catch(() => {
        // Don't clear on error - user may want to retry
      });
  };

  return (
    <LocalAttachmentsContext.Provider value={ctx}>
      <form className={cn("w-full", className)} onSubmit={handleSubmit} ref={formRef} {...props}>
        <InputGroup className="overflow-hidden">{children}</InputGroup>
      </form>
    </LocalAttachmentsContext.Provider>
  );
};

export type PromptInputBodyProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputBody = ({ className, ...props }: PromptInputBodyProps) => (
  <div className={cn("contents", className)} {...props} />
);

export type PromptInputTextareaProps = ComponentProps<typeof InputGroupTextarea>;

export const PromptInputTextarea = ({
  onChange,
  className,
  ...props
}: PromptInputTextareaProps) => {
  const attachments = usePromptInputAttachments();
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
    if (e.key === "Backspace" && e.currentTarget.value === "" && attachments.files.length > 0) {
      e.preventDefault();
      const lastAttachment = attachments.files.at(-1);
      if (lastAttachment) {
        attachments.remove(lastAttachment.id);
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
      attachments.add({ type: "files", files });
    }
  };

  return (
    <InputGroupTextarea
      className={cn("field-sizing-content max-h-48 min-h-16", className)}
      name="message"
      onCompositionEnd={() => {
        setIsComposing(false);
      }}
      onCompositionStart={() => {
        setIsComposing(true);
      }}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onChange={onChange}
      {...props}
    />
  );
};

export type PromptInputHeaderProps = Omit<ComponentProps<typeof InputGroupAddon>, "align">;

export const PromptInputHeader = ({ className, ...props }: PromptInputHeaderProps) => (
  <InputGroupAddon
    align="block-end"
    className={cn("order-first flex-wrap gap-1", className)}
    {...props}
  />
);

export type PromptInputFooterProps = Omit<ComponentProps<typeof InputGroupAddon>, "align">;

export const PromptInputFooter = ({ className, ...props }: PromptInputFooterProps) => (
  <InputGroupAddon
    align="block-end"
    className={cn("justify-between gap-1", className)}
    {...props}
  />
);

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTools = ({ className, ...props }: PromptInputToolsProps) => (
  <div className={cn("flex items-center gap-1", className)} {...props} />
);

export type PromptInputButtonProps = ComponentProps<typeof InputGroupButton>;

export const PromptInputButton = ({
  variant = "ghost",
  className,
  size,
  ...props
}: PromptInputButtonProps) => {
  const newSize = size ?? (Children.count(props.children) > 1 ? "sm" : "icon-sm");

  return (
    <InputGroupButton
      className={cn(className)}
      size={newSize}
      type="button"
      variant={variant}
      {...props}
    />
  );
};

export type PromptInputActionMenuProps = ComponentProps<typeof DropdownMenu>;
export const PromptInputActionMenu = (props: PromptInputActionMenuProps) => (
  <DropdownMenu {...props} />
);

export type PromptInputActionMenuTriggerProps = PromptInputButtonProps;

export const PromptInputActionMenuTrigger = ({
  className,
  children,
  ...props
}: PromptInputActionMenuTriggerProps) => (
  <DropdownMenuTrigger asChild>
    <PromptInputButton className={className} {...props}>
      {children ?? <PlusIcon className="size-4" />}
    </PromptInputButton>
  </DropdownMenuTrigger>
);

export type PromptInputActionMenuContentProps = ComponentProps<typeof DropdownMenuContent>;
export const PromptInputActionMenuContent = ({
  className,
  ...props
}: PromptInputActionMenuContentProps) => (
  <DropdownMenuContent align="start" className={cn(className)} {...props} />
);

export type PromptInputActionMenuItemProps = ComponentProps<typeof DropdownMenuItem>;
export const PromptInputActionMenuItem = ({
  className,
  ...props
}: PromptInputActionMenuItemProps) => <DropdownMenuItem className={cn(className)} {...props} />;

// Note: Actions that perform side effects (like opening a file dialog)
// are provided in opt-in modules (e.g., prompt-input-attachments).

export type PromptInputSubmitProps = ComponentProps<typeof InputGroupButton> & {
  status?: ChatStatus;
};

export const PromptInputSubmit = ({
  className,
  variant = "default",
  size = "icon-sm",
  status,
  children,
  ...props
}: PromptInputSubmitProps) => {
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
      className={cn(className)}
      size={size}
      type="submit"
      variant={variant}
      {...props}
    >
      {children ?? Icon}
    </InputGroupButton>
  );
};

export type PromptInputSelectProps = ComponentProps<typeof Select>;

export const PromptInputSelect = (props: PromptInputSelectProps) => <Select {...props} />;

export type PromptInputSelectTriggerProps = ComponentProps<typeof SelectTrigger>;

export const PromptInputSelectTrigger = ({
  className,
  ...props
}: PromptInputSelectTriggerProps) => (
  <SelectTrigger
    className={cn(
      "border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors",
      "hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground",
      className,
    )}
    {...props}
  />
);

export type PromptInputSelectContentProps = ComponentProps<typeof SelectContent>;

export const PromptInputSelectContent = ({
  className,
  ...props
}: PromptInputSelectContentProps) => <SelectContent className={cn(className)} {...props} />;

export type PromptInputSelectItemProps = ComponentProps<typeof SelectItem>;

export const PromptInputSelectItem = ({ className, ...props }: PromptInputSelectItemProps) => (
  <SelectItem className={cn(className)} {...props} />
);

export type PromptInputSelectValueProps = ComponentProps<typeof SelectValue>;

export const PromptInputSelectValue = ({ className, ...props }: PromptInputSelectValueProps) => (
  <SelectValue className={cn(className)} {...props} />
);

export type PromptInputPopoverProps = ComponentProps<typeof Popover>;

export const PromptInputPopover = (props: PromptInputPopoverProps) => <Popover {...props} />;

export type PromptInputPopoverTriggerProps = ComponentProps<typeof PopoverTrigger>;

export const PromptInputPopoverTrigger = (props: PromptInputPopoverTriggerProps) => (
  <PopoverTrigger {...props} />
);

export type PromptInputPopoverContentProps = ComponentProps<typeof PopoverContent>;

export const PromptInputPopoverContent = ({
  align = "start",
  ...props
}: PromptInputPopoverContentProps) => <PopoverContent align={align} {...props} />;

export type PromptInputTabsListProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTabsList = ({ className, ...props }: PromptInputTabsListProps) => (
  <div className={cn(className)} {...props} />
);

export type PromptInputTabProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTab = ({ className, ...props }: PromptInputTabProps) => (
  <div className={cn(className)} {...props} />
);

export type PromptInputTabLabelProps = HTMLAttributes<HTMLHeadingElement>;

export const PromptInputTabLabel = ({ className, ...props }: PromptInputTabLabelProps) => (
  <h3 className={cn("mb-2 px-3 font-medium text-muted-foreground text-xs", className)} {...props} />
);

export type PromptInputTabBodyProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTabBody = ({ className, ...props }: PromptInputTabBodyProps) => (
  <div className={cn("space-y-1", className)} {...props} />
);

export type PromptInputTabItemProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTabItem = ({ className, ...props }: PromptInputTabItemProps) => (
  <div
    className={cn("flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent", className)}
    {...props}
  />
);

export type PromptInputCommandProps = ComponentProps<typeof Command>;

export const PromptInputCommand = ({ className, ...props }: PromptInputCommandProps) => (
  <Command className={cn(className)} {...props} />
);

export type PromptInputCommandInputProps = ComponentProps<typeof CommandInput>;

export const PromptInputCommandInput = ({ className, ...props }: PromptInputCommandInputProps) => (
  <CommandInput className={cn(className)} {...props} />
);

export type PromptInputCommandListProps = ComponentProps<typeof CommandList>;

export const PromptInputCommandList = ({ className, ...props }: PromptInputCommandListProps) => (
  <CommandList className={cn(className)} {...props} />
);

export type PromptInputCommandEmptyProps = ComponentProps<typeof CommandEmpty>;

export const PromptInputCommandEmpty = ({ className, ...props }: PromptInputCommandEmptyProps) => (
  <CommandEmpty className={cn(className)} {...props} />
);

export type PromptInputCommandGroupProps = ComponentProps<typeof CommandGroup>;

export const PromptInputCommandGroup = ({ className, ...props }: PromptInputCommandGroupProps) => (
  <CommandGroup className={cn(className)} {...props} />
);

export type PromptInputCommandItemProps = ComponentProps<typeof CommandItem>;

export const PromptInputCommandItem = ({ className, ...props }: PromptInputCommandItemProps) => (
  <CommandItem className={cn(className)} {...props} />
);

export type PromptInputCommandSeparatorProps = ComponentProps<typeof CommandSeparator>;

export const PromptInputCommandSeparator = ({
  className,
  ...props
}: PromptInputCommandSeparatorProps) => <CommandSeparator className={cn(className)} {...props} />;
