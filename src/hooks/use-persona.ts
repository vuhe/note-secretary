import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { z } from "zod";
import { create, type StoreApi, type UseBoundStore } from "zustand";
import { Persona, PersonaSchema } from "@/lib/persona";
import { safeErrorString } from "@/lib/utils";

type ReadonlyStoreApi<T> = Pick<StoreApi<T>, "getState" | "getInitialState" | "subscribe">;
type ReadonlyStore<T> = UseBoundStore<ReadonlyStoreApi<T>>;

interface PersonaStatus {
  personas: Persona[];
  providers: string[];
  update: () => Promise<void>;
}

export const usePersona: ReadonlyStore<PersonaStatus> = create((set) => ({
  personas: [],
  providers: [],
  update: async () => {
    try {
      const list: unknown[] = await invoke("get_all_personas");
      const personas = list.map((it) => {
        const result = PersonaSchema.safeParse(it);
        if (result.success) return new Persona(result.data);
        throw z.prettifyError(result.error);
      });
      const providers = personas.reduce((prev, curr) => {
        prev.add(curr.provider);
        return prev;
      }, new Set<string>());
      set({ personas, providers: Array.from(providers.values()) });
    } catch (error) {
      toast.error("获取 Persona 列表失败", {
        description: safeErrorString(error),
        closeButton: true,
      });
    }
  },
}));
