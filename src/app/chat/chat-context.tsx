"use client";

import { GlobeIcon } from "lucide-react";
import {
  PromptInputButton,
  PromptInputCommand,
  PromptInputCommandEmpty,
  PromptInputCommandGroup,
  PromptInputCommandInput,
  PromptInputCommandItem,
  PromptInputCommandList,
  PromptInputCommandSeparator,
  PromptInputPopover,
  PromptInputPopoverContent,
  PromptInputPopoverTrigger,
} from "@/components/ai-elements/prompt-input";

const sampleFiles = {
  activeTabs: [{ path: "prompt-input.tsx", location: "packages/elements/src" }],
  recents: [
    { path: "queue.tsx", location: "apps/test/app/examples" },
    { path: "queue.tsx", location: "packages/elements/src" },
  ],
  added: [
    { path: "prompt-input.tsx", location: "packages/elements/src" },
    { path: "queue.tsx", location: "apps/test/app/examples" },
    { path: "queue.tsx", location: "packages/elements/src" },
  ],
  filesAndFolders: [
    { path: "prompt-input.tsx", location: "packages/elements/src" },
    { path: "queue.tsx", location: "apps/test/app/examples" },
  ],
  code: [{ path: "prompt-input.tsx", location: "packages/elements/src" }],
  docs: [{ path: "README.md", location: "packages/elements" }],
};

export default function ChatContext() {
  return (
    <PromptInputPopover>
      <PromptInputPopoverTrigger asChild>
        <PromptInputButton className="-ml-3" size="sm" variant="ghost">
          <span className="text-base font-medium">Documents</span>
        </PromptInputButton>
      </PromptInputPopoverTrigger>
      <PromptInputPopoverContent className="w-100 min-w-75 p-0 mx-2" align="center">
        <PromptInputCommand>
          <PromptInputCommandInput
            className="border-none focus-visible:ring-0"
            placeholder="Add files, folders, docs..."
          />
          <PromptInputCommandList>
            <PromptInputCommandEmpty className="p-3 text-muted-foreground text-sm">
              No results found.
            </PromptInputCommandEmpty>
            <PromptInputCommandGroup heading="Added">
              <PromptInputCommandItem>
                <GlobeIcon />
                <span>Active Tabs</span>
                <span className="ml-auto text-muted-foreground">✓</span>
              </PromptInputCommandItem>
            </PromptInputCommandGroup>
            <PromptInputCommandSeparator />
            <PromptInputCommandGroup heading="Other Files">
              {sampleFiles.added.map((file, index) => (
                <PromptInputCommandItem key={`${file.path}-${index}`}>
                  <GlobeIcon className="text-primary" />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{file.path}</span>
                    <span className="text-muted-foreground text-xs">{file.location}</span>
                  </div>
                </PromptInputCommandItem>
              ))}
            </PromptInputCommandGroup>
          </PromptInputCommandList>
        </PromptInputCommand>
      </PromptInputPopoverContent>
    </PromptInputPopover>
  );
}
