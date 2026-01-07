import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { safeErrorString } from "@/lib/utils";

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

interface NavNote {
  id: string;
  category: string;
  title: string;
}

export interface NavNoteCategory {
  title: string;
  notes: NavNote[];
}

export function useNavigation() {
  const [search, setSearch] = useState<string>("");
  const [notes, setNotes] = useState<NavNoteCategory[]>([]);

  const getAllNotes = useCallback(() => {
    invoke<NavNote[]>("get_all_notes").then(
      (noteList) => {
        const categoryMap: Record<string, NavNote[]> = {};
        noteList.forEach((note) => {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (!categoryMap[note.category]) {
            categoryMap[note.category] = [];
          }
          categoryMap[note.category].push(note);
        });
        const sortedCategories: NavNoteCategory[] = Object.keys(categoryMap)
          .sort((a, b) => collator.compare(a, b))
          .map((categoryTitle) => {
            const sortedNotes = categoryMap[categoryTitle].sort((a, b) =>
              collator.compare(a.title, b.title),
            );

            return {
              title: categoryTitle,
              notes: sortedNotes,
            };
          });
        setNotes(sortedCategories);
      },
      (error: unknown) => {
        toast.error("获取笔记列表失败", {
          description: safeErrorString(error),
          closeButton: true,
        });
      },
    );
  }, []);

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

  return {
    setSearch,
    notes,
  };
}
