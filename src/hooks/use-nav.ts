import { invoke } from "@tauri-apps/api/core";
import { create, type StoreApi, type UseBoundStore } from "zustand";

type ReadonlyStoreApi<T> = Pick<StoreApi<T>, "getState" | "getInitialState" | "subscribe">;
type ReadonlyStore<T> = UseBoundStore<ReadonlyStoreApi<T>>;

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

interface NavNote {
  id: string;
  category: string;
  title: string;
}

interface NavNoteCategory {
  title: string;
  notes: NavNote[];
}

interface NavMenu {
  notes: NavNoteCategory[];
  update: (search?: string) => Promise<void>;
}

export const useNavMenu: ReadonlyStore<NavMenu> = create((set) => ({
  notes: [],
  update: async () => {
    const noteList: NavNote[] = await invoke("get_all_notes");
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

    console.debug(noteList);
    console.debug(sortedCategories);
    set({ notes: sortedCategories });
  },
}));
