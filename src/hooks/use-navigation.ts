import { invoke } from "@tauri-apps/api/core";
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

  useEffect(() => {
    getAllNotes();
  }, [getAllNotes]);

  return {
    setSearch,
    notes,
  };
}
