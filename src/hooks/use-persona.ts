import { createDeepSeek } from "@ai-sdk/deepseek";
import { invoke } from "@tauri-apps/api/core";
import { fetch } from "@tauri-apps/plugin-http";
import type { LanguageModel } from "ai";
import { create, type StoreApi, type UseBoundStore } from "zustand";

type ReadonlyStoreApi<T> = Pick<StoreApi<T>, "getState" | "getInitialState" | "subscribe">;
type ReadonlyStore<T> = UseBoundStore<ReadonlyStoreApi<T>>;

export class Persona {
  readonly id: string;
  readonly provider: string;
  readonly model: LanguageModel;

  readonly maxTokens: number;
  readonly maxOutputTokens?: number;
  readonly temperature?: number;
  readonly topP?: number;
  readonly topK?: number;
  readonly presencePenalty?: number;
  readonly frequencyPenalty?: number;

  readonly systemPrompt: string;

  constructor(props: Record<string, unknown>) {
    this.id = props.id as string;

    this.provider = props.provider as string;
    const modelId = props.model as string;
    const apiKey = props.apiKey as string;
    const baseURL = props.baseUrl as string | undefined;

    switch (this.provider) {
      case "deepseek": {
        this.model = createDeepSeek({
          apiKey: apiKey,
          baseURL: baseURL,
          fetch: fetch,
        }).languageModel(modelId);
        break;
      }
      default:
        throw new Error(`暂不支持 ${this.provider} 提供商`);
    }

    if (
      typeof props.maxTokens === "number" &&
      props.maxTokens > 0 &&
      Number.isFinite(props.maxTokens)
    ) {
      this.maxTokens = props.maxTokens;
    } else {
      this.maxTokens = 0;
    }

    if (typeof props.maxOutputTokens === "number") {
      if (props.maxOutputTokens > 0 && Number.isFinite(props.maxOutputTokens)) {
        this.maxOutputTokens = props.maxOutputTokens;
      }
    }

    if (typeof props.temperature === "number") {
      if (props.temperature >= 0 && Number.isFinite(props.temperature)) {
        this.temperature = props.temperature;
      }
    }

    if (typeof props.topP === "number") {
      if (-10 < props.topP && props.topP < 10) {
        this.topP = props.topP;
      }
    }

    if (typeof props.topK === "number") {
      if (props.topK > 0 && Number.isFinite(props.topK)) {
        this.topK = props.topK;
      }
    }

    if (typeof props.presencePenalty === "number") {
      if (-10 < props.presencePenalty && props.presencePenalty < 10) {
        this.presencePenalty = props.presencePenalty;
      }
    }

    if (typeof props.frequencyPenalty === "number") {
      if (-10 < props.frequencyPenalty && props.frequencyPenalty < 10) {
        this.frequencyPenalty = props.frequencyPenalty;
      }
    }

    this.systemPrompt = props.systemPrompt as string;
  }
}

interface PersonaStatus {
  personas: Persona[];
  providers: string[];
  selected?: Persona;
  setSelected: (id: string) => void;
  update: () => Promise<void>;
}

export const usePersona: ReadonlyStore<PersonaStatus> = create((set, get) => ({
  personas: [],
  providers: [],
  setSelected: (id) => {
    const selected = get().personas.find((it) => it.id === id);
    set({ selected });
  },
  update: async () => {
    // TODO: 这里的两个方法都有抛出异常的可能
    const list: Record<string, unknown>[] = await invoke("get_all_personas");
    const personas = list.map((it) => new Persona(it));
    const providers = personas.reduce((prev, curr) => {
      prev.add(curr.provider);
      return prev;
    }, new Set<string>());
    set({ personas, providers: Array.from(providers.values()) });
  },
}));
