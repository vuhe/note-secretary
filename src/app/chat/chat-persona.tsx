"use client";

import { CheckIcon, DramaIcon } from "lucide-react";
import { useState } from "react";

import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { PromptInputButton } from "@/components/ai-elements/prompt-input";
import { usePersona } from "@/hooks/use-persona";

export default function ChatPersona() {
  const personas = usePersona((state) => state.personas);
  const providers = usePersona((state) => state.providers);
  const selected = usePersona((state) => state.selected);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

  return (
    <ModelSelector onOpenChange={setModelSelectorOpen} open={modelSelectorOpen}>
      <ModelSelectorTrigger asChild>
        <PromptInputButton>
          <DramaIcon size={16} />
          {selected && <ModelSelectorName>{selected.id}</ModelSelectorName>}
        </PromptInputButton>
      </ModelSelectorTrigger>
      <ModelSelectorContent>
        <ModelSelectorInput placeholder="搜索模型..." />
        <ModelSelectorList>
          <ModelSelectorEmpty>未找到模型</ModelSelectorEmpty>
          {providers.map((chef) => (
            <ModelSelectorGroup heading={chef} key={chef}>
              {personas
                .filter((m) => m.provider === chef)
                .map((m) => (
                  <ModelSelectorItem
                    key={m.id}
                    onSelect={() => {
                      usePersona.getState().setSelected(m.id);
                      setModelSelectorOpen(false);
                    }}
                    value={m.id}
                  >
                    <DramaIcon size={12} />
                    <ModelSelectorName>{m.id}</ModelSelectorName>
                    {selected?.id === m.id ? (
                      <CheckIcon className="ml-auto size-4" />
                    ) : (
                      <div className="ml-auto size-4" />
                    )}
                  </ModelSelectorItem>
                ))}
            </ModelSelectorGroup>
          ))}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}
