"use client";

import { listen } from "@tauri-apps/api/event";
import { NotebookTextIcon } from "lucide-react";
import { type ComponentProps, type ReactNode, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fetchAllNotes, type NavNote, type NavNoteCategory } from "@/hooks/use-navigation";
import { cn, safeErrorString } from "@/lib/utils";

const NoteName = ({ className, ...props }: ComponentProps<"span">) => (
  <span className={cn("flex-1 truncate text-left", className)} {...props} />
);

interface NoteSelectorProps {
  onSelect: (note: NavNote) => void;
  children: ReactNode;
}

export default function NoteSelector({ onSelect, children }: NoteSelectorProps) {
  const [search, setSearch] = useState<string>("");
  const [notes, setNotes] = useState<NavNoteCategory[]>([]);
  const [open, setOpen] = useState(false);

  const getAllNotes = useCallback(() => {
    fetchAllNotes(search)
      .then((sortedCategories) => {
        setNotes(sortedCategories);
      })
      .catch((error: unknown) => {
        setNotes([]);
        toast.error("获取笔记列表失败", {
          description: safeErrorString(error),
          closeButton: true,
        });
      });
  }, [search]);

  // 初始化调用一次准备数据
  useEffect(() => {
    getAllNotes();
  }, [getAllNotes]);

  // 监听到后台传递的 note 信息变动，刷新数据
  useEffect(() => {
    const listening = listen("notes-change-event", getAllNotes);
    return () => {
      void listening.then((unlisten) => unlisten);
    };
  }, [getAllNotes]);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="p-0 **:data-[slot=dialog-close]:top-3">
        <DialogTitle className="sr-only">Note Selector</DialogTitle>
        <Command className="**:data-[slot=command-input-wrapper]:h-auto" shouldFilter={false}>
          <CommandInput placeholder="搜索笔记..." onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>未找到笔记</CommandEmpty>
            {notes.map((chef) => (
              <CommandGroup heading={chef.title} key={chef.title}>
                {chef.notes.map((it) => (
                  <CommandItem
                    key={it.id}
                    onSelect={() => {
                      onSelect(it);
                      setOpen(false);
                    }}
                    value={it.id}
                  >
                    <NotebookTextIcon size={12} />
                    <NoteName>{it.title}</NoteName>
                    <div className="ml-auto size-4" />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
