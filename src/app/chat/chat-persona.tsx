"use client";

import { CheckIcon, DramaIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InputGroupButton } from "@/components/ui/input-group";
import { usePersona } from "@/hooks/use-persona";
import { usePrompt } from "@/hooks/use-prompt";
import { cn } from "@/lib/utils";

const PersonaName = ({ className, ...props }: ComponentProps<"span">) => (
  <span className={cn("flex-1 truncate text-left", className)} {...props} />
);

export default function ChatPersona() {
  const personas = usePersona((state) => state.personas);
  const providers = usePersona((state) => state.providers);
  const selected = usePrompt((state) => state.persona);
  const [open, setOpen] = useState(false);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <InputGroupButton size="sm">
          <DramaIcon size={16} />
          {selected && <PersonaName>{selected.id}</PersonaName>}
        </InputGroupButton>
      </DialogTrigger>
      <DialogContent className="p-0 **:data-[slot=dialog-close]:top-3">
        <DialogTitle className="sr-only">Persona Selector</DialogTitle>
        <Command className="**:data-[slot=command-input-wrapper]:h-auto">
          <CommandInput placeholder="搜索模型..." />
          <CommandList>
            <CommandEmpty>未找到模型</CommandEmpty>
            {providers.map((chef) => (
              <CommandGroup heading={chef} key={chef}>
                {personas
                  .filter((m) => m.provider === chef)
                  .map((m) => (
                    <CommandItem
                      key={m.id}
                      onSelect={() => {
                        usePrompt.getState().selectPersona(m);
                        setOpen(false);
                      }}
                      value={m.id}
                    >
                      <DramaIcon size={12} />
                      <PersonaName>{m.id}</PersonaName>
                      {selected?.id === m.id ? (
                        <CheckIcon className="ml-auto size-4" />
                      ) : (
                        <div className="ml-auto size-4" />
                      )}
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
