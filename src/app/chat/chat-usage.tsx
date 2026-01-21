"use client";

import type { LanguageModelUsage } from "ai";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { useChatId } from "@/hooks/use-chat";
import { usePrompt } from "@/hooks/use-prompt";
import type { Persona } from "@/lib/persona";
import { cn } from "@/lib/utils";

interface ChatUsageProps {
  persona: Persona;
  usage?: LanguageModelUsage;
}

const usageFormat = (value?: number) => {
  if (value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
  }).format(value);
};

const PERCENT_MAX = 100;
const ICON_RADIUS = 10;
const ICON_VIEW_BOX = 24;
const ICON_CENTER = 12;
const ICON_STROKE_WIDTH = 2;

const UsageIcon = ({ persona, usage }: ChatUsageProps) => {
  const maxTokens = persona.maxTokens;
  const circumference = 2 * Math.PI * ICON_RADIUS;
  const usedPercent = (usage?.totalTokens ?? 0) / maxTokens;
  const dashOffset = circumference * (1 - usedPercent);

  return (
    <svg
      aria-label="Model context usage"
      height="20"
      role="img"
      style={{ color: "currentcolor" }}
      viewBox={`0 0 ${ICON_VIEW_BOX} ${ICON_VIEW_BOX}`}
      width="20"
    >
      <circle
        cx={ICON_CENTER}
        cy={ICON_CENTER}
        fill="none"
        opacity="0.25"
        r={ICON_RADIUS}
        stroke="currentColor"
        strokeWidth={ICON_STROKE_WIDTH}
      />
      <circle
        cx={ICON_CENTER}
        cy={ICON_CENTER}
        fill="none"
        opacity="0.7"
        r={ICON_RADIUS}
        stroke="currentColor"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        strokeWidth={ICON_STROKE_WIDTH}
        style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
      />
    </svg>
  );
};

const UsageTrigger = ({ persona, usage }: ChatUsageProps) => {
  const maxTokens = persona.maxTokens;
  const usedPercent = (usage?.totalTokens ?? 0) / maxTokens;
  const renderedPercent = new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(usedPercent);

  return (
    <PopoverTrigger asChild>
      <Button type="button" variant="ghost">
        <span className="font-mono font-medium text-muted-foreground">{renderedPercent}</span>
        <UsageIcon persona={persona} usage={usage} />
      </Button>
    </PopoverTrigger>
  );
};

const UsageContentHeader = ({ persona, usage }: ChatUsageProps) => {
  const maxTokens = persona.maxTokens;
  const usedTokens = usage?.totalTokens ?? 0;
  const usedPercent = usedTokens / maxTokens;
  const displayPct = new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(usedPercent);

  return (
    <div className={cn("w-full space-y-2 p-3")}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <p className="font-mono">{displayPct}</p>
        <p className="font-mono text-muted-foreground">
          {usageFormat(usedTokens)} / {usageFormat(maxTokens)}
        </p>
      </div>
      <div className="space-y-2">
        <Progress className="bg-muted" value={usedPercent * PERCENT_MAX} />
      </div>
    </div>
  );
};

const UsageInput = ({ usage }: { usage?: LanguageModelUsage }) => {
  const noCacheTokens = usage?.inputTokenDetails.noCacheTokens ?? 0;
  const cacheReadTokens = usage?.inputTokenDetails.cacheReadTokens ?? 0;
  const cacheWriteTokens = usage?.inputTokenDetails.cacheWriteTokens ?? 0;

  return (
    <div className="w-full p-3 bg-secondary">
      <div className="flex items-center justify-between text-xs">
        <span>总计输入</span>
        <span>{usageFormat(usage?.inputTokens)}</span>
      </div>
      {noCacheTokens > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">输入（未缓存）</span>
          <span>{usageFormat(noCacheTokens)}</span>
        </div>
      )}
      {cacheReadTokens > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">命中缓存（读取）</span>
          <span>{usageFormat(cacheReadTokens)}</span>
        </div>
      )}
      {cacheWriteTokens > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">命中缓存（写入）</span>
          <span>{usageFormat(cacheWriteTokens)}</span>
        </div>
      )}
    </div>
  );
};

const UsageOutput = ({ usage }: { usage?: LanguageModelUsage }) => {
  const reasoningTokens = usage?.outputTokenDetails.reasoningTokens ?? 0;
  const textTokens = usage?.outputTokenDetails.textTokens ?? 0;

  return (
    <div className="w-full p-3 bg-secondary">
      <div className="flex items-center justify-between text-xs">
        <span>总计输出</span>
        <span>{usageFormat(usage?.outputTokens)}</span>
      </div>
      {reasoningTokens > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">思考输出</span>
          <span>{usageFormat(reasoningTokens)}</span>
        </div>
      )}
      {textTokens > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">内容输出</span>
          <span>{usageFormat(textTokens)}</span>
        </div>
      )}
    </div>
  );
};

export function ChatUsage() {
  const persona = usePrompt((state) => state.persona);
  const usage = useChatId((state) => state.usage);
  if (!persona) return null;

  return (
    <Popover>
      <UsageTrigger persona={persona} usage={usage} />
      <PopoverContent className="w-50 divide-y overflow-hidden p-0 select-none">
        <UsageContentHeader persona={persona} usage={usage} />
        <UsageInput usage={usage} />
        <UsageOutput usage={usage} />
      </PopoverContent>
    </Popover>
  );
}
