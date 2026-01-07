import { createDeepSeek } from "@ai-sdk/deepseek";
import { invoke } from "@tauri-apps/api/core";
import { fetch } from "@tauri-apps/plugin-http";
import type { LanguageModel } from "ai";
import { toast } from "sonner";
import { create, type StoreApi, type UseBoundStore } from "zustand";
import { safeErrorString } from "@/lib/utils";

type ReadonlyStoreApi<T> = Pick<StoreApi<T>, "getState" | "getInitialState" | "subscribe">;
type ReadonlyStore<T> = UseBoundStore<ReadonlyStoreApi<T>>;

const SystemPromptPrefix = `LaTeX 公式的渲染仅支持符合以下约定的：

1. **行内公式**：请使用两个美元符号 **$$...$$** 包裹，且公式前后不换行。  
   示例：这是质能方程 $$E = mc^{2}$$ 的应用。

2. **单行公式**：请使用两个美元符号 **$$...$$** 包裹，并确保公式独立成行（前后换行）。  
   示例：  
   $$
   E = mc^{2}
   $$

3. **流程图**：使用 Mermaid 代码块（\`\`\`mermaid ... \`\`\`）绘制。

请在所有回答中严格遵守此格式，以确保公式正确显示。

---

`;

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

    this.maxTokens = props.maxTokens as number;
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
        throw new Error(`此版本不支持 ${this.provider} 提供商，请检查是否需要升级`);
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

    this.systemPrompt = `${SystemPromptPrefix}\n${props.systemPrompt as string}`;
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
    try {
      const list: Record<string, unknown>[] = await invoke("get_all_personas");
      const personas = list.map((it) => new Persona(it));
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
