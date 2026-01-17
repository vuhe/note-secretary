import { createDeepSeek } from "@ai-sdk/deepseek";
import { fetch } from "@tauri-apps/plugin-http";
import { convertToModelMessages, type LanguageModel, type ModelMessage } from "ai";
import { z } from "zod";
import type { DisplayMessage } from "@/lib/message";

const SystemPromptPrefix = `输出应遵循 GitHub Flavored Markdown，部分输出渲染需要符合以下约定的：

1. **行内公式**：请使用两个美元符号 **$$...$$** 包裹，且公式前后不换行。  
   示例：这是质能方程 $$E = mc^{2}$$ 的应用。

2. **单行公式**：请使用两个美元符号 **$$...$$** 包裹，并确保公式独立成行（前后换行）。  
   示例：  
   $$
   E = mc^{2}
   $$

3. **流程图**：使用 Mermaid 代码块（\`\`\`mermaid ... \`\`\`）绘制。

4. **Github Alert**：支持 NOTE、TIP、IMPORTANT、WARNING、CAUTION 提示框，
   标题和正文需要隔一行，遵循 GitHub 规范，**仅支持顶层，不支持嵌套 Alert**。  
   示例：  
   > [!NOTE] title
   > 
   > Content

请在所有回答中严格遵守此格式，以确保输出正确显示。

---

`;

export const PersonaSchema = z.object({
  id: z.string().trim().min(1, "Persona 名称不能为空"),
  provider: z.enum(["deepseek"], {
    error: (issue) => {
      const provider = typeof issue.input === "string" ? issue.input : "Unknown";
      return `此版本不支持 ${provider} 提供商`;
    },
  }),
  model: z.string().trim().min(1, "模型不能为空"),
  apiKey: z.string().trim().min(1, "Api Key 不能为空"),
  baseUrl: z.url().optional(),
  maxTokens: z.int().positive("窗口上下文应为正整数"),

  maxOutputTokens: z.int().positive("最大输出应为正整数").optional(),
  temperature: z.number().min(0, "温度应 ≥ 0").max(2, "温度应 ≤ 2").optional(),
  topP: z.number().min(0, "核采样应 ≥ 0").max(1, "核采样应 ≤ 1").optional(),
  topK: z.int().positive("top-K 应 > 0").max(100, "top-K 应 ≤ 100").optional(),
  presencePenalty: z.number().min(-2, "话题新鲜度应 ≥ -2").max(2, "话题新鲜度应 ≤ 2").optional(),
  frequencyPenalty: z.number().min(-2, "频率惩罚度应 ≥ -2").max(2, "频率惩罚度应 ≤ 2").optional(),

  systemPrompt: z.string(),
});

export type PersonaParams = z.infer<typeof PersonaSchema>;

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

  constructor(params: PersonaParams) {
    this.id = params.id;

    this.maxTokens = params.maxTokens;
    this.provider = params.provider;
    const modelId = params.model;
    const apiKey = params.apiKey;
    const baseURL = params.baseUrl;

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
        throw new Error(`此版本不支持 ${this.provider} 提供商`);
    }

    this.maxOutputTokens = params.maxOutputTokens;
    this.temperature = params.temperature;
    this.topP = params.topP;
    this.topK = params.topK;
    this.presencePenalty = params.presencePenalty;
    this.frequencyPenalty = params.frequencyPenalty;
    this.systemPrompt = `${SystemPromptPrefix}\n${params.systemPrompt}`;
  }

  async convertMessages(messages: DisplayMessage[]): Promise<ModelMessage[]> {
    const inputMessages: DisplayMessage[] = [];
    for (const message of messages) {
      const parts = message.parts.map((it) => {
        if (it.type === "file") {
          // TODO: 从后台拿到数据
          return {
            type: "data-file",
            data: {
              type: "file",
              data: "",
              filename: it.filename,
              mediaType: it.mediaType,
              ...(it.providerMetadata != null ? { providerOptions: it.providerMetadata } : {}),
            },
          } as const;
        }
        return it;
      });
      inputMessages.push({
        ...message,
        parts,
      });
    }

    return convertToModelMessages<DisplayMessage>(inputMessages, {
      convertDataPart: (it) => {
        switch (it.type) {
          // 未来可能会增加定义
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          case "data-file":
            return it.data;
          default:
            return undefined;
        }
      },
    });
  }
}
