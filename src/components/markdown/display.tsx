// noinspection SpellCheckingInspection

"use client";

import type { Root } from "hast";
import {
  InfoIcon,
  LightbulbIcon,
  MessageSquareWarningIcon,
  OctagonAlertIcon,
  TriangleAlertIcon,
} from "lucide-react";
import type { ComponentProps } from "react";
import { type ControlsConfig, defaultRehypePlugins, Streamdown } from "streamdown";
import { usePlatform } from "@/hooks/use-mobile";

const ALERT_REGEX = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i;

function rehypeGithubAlert() {
  return (tree: Root) => {
    for (const node of tree.children) {
      // 只看顶层的 blockquote
      if (node.type !== "element" || node.tagName !== "blockquote") continue;
      // 找到第一个 p 标签和它的文本
      const firstP = node.children
        .filter((it) => it.type === "element")
        .find((it) => it.tagName === "p");

      // 确保 p 标签有值
      if (!firstP || firstP.children.length === 0) continue;
      const firstText = firstP.children[0];

      if (firstText.type !== "text") continue;
      const match = ALERT_REGEX.exec(firstText.value);
      if (!match) continue;

      const type = match[1].toLowerCase();

      // 修改 div 标签和类名
      node.tagName = "div";
      node.properties = {
        ...node.properties,
        className: ["markdown-alert", `markdown-alert-${type}`],
      };

      // 修改 p 类名
      firstP.properties = {
        ...firstP.properties,
        className: ["markdown-alert-title", `markdown-alert-${type}`],
      };

      // 清除标识符文本
      const title = firstText.value.replace(ALERT_REGEX, "").trim();
      if (title.length === 0) {
        firstText.value = type.toUpperCase();
      } else {
        firstText.value = title;
      }
    }
  };
}

function GithubAlertIcon({ className }: { className?: string }) {
  if (className?.includes("markdown-alert-note")) {
    return <InfoIcon size={16} className="mr-1 flex-none" />;
  } else if (className?.includes("markdown-alert-tip")) {
    return <LightbulbIcon size={16} className="mr-1 flex-none" />;
  } else if (className?.includes("markdown-alert-important")) {
    return <MessageSquareWarningIcon size={16} className="mr-1 flex-none" />;
  } else if (className?.includes("markdown-alert-warning")) {
    return <TriangleAlertIcon size={16} className="mr-1 flex-none" />;
  } else if (className?.includes("markdown-alert-caution")) {
    return <OctagonAlertIcon size={16} className="mr-1 flex-none" />;
  }
}

export type MarkdownDisplayProps = ComponentProps<typeof Streamdown>;

export function MarkdownDisplay({ rehypePlugins, controls, ...props }: MarkdownDisplayProps) {
  const isDesktop = usePlatform((state) => state.isDesktop);

  const rehypePluginsWithDefault = rehypePlugins
    ? [...rehypePlugins, ...Object.values(defaultRehypePlugins), rehypeGithubAlert]
    : [...Object.values(defaultRehypePlugins), rehypeGithubAlert];

  let controlsWithDefault: ControlsConfig = {
    table: isDesktop,
    code: true,
    mermaid: {
      download: isDesktop,
      copy: true,
      fullscreen: false,
      panZoom: isDesktop,
    },
  };

  if (typeof controls === "boolean" && !controls) {
    controlsWithDefault = false;
  }

  return (
    <Streamdown
      rehypePlugins={rehypePluginsWithDefault}
      controls={controlsWithDefault}
      {...props}
      components={{
        p: ({ children, className, ...props }) => (
          <p className={className} {...props}>
            <GithubAlertIcon className={className} />
            <span>{children}</span>
          </p>
        ),
      }}
    />
  );
}
