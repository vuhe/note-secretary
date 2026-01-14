// noinspection SpellCheckingInspection

"use client";

import { convertFileSrc } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { Root } from "hast";
import { type ComponentProps, useEffect, useId } from "react";
import { type ControlsConfig, defaultRehypePlugins, Streamdown } from "streamdown";
import { usePlatform } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const ALERT_REGEX = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)]\s*/i;

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

      // 修改标签标识符
      node.properties["data-github-alert"] = type;
      firstP.properties["data-github-alert"] = type;

      // 清除标识符文本
      const title = firstText.value.replace(ALERT_REGEX, "");
      if (title.trim().length === 0) {
        firstText.value = type.toUpperCase();
      } else {
        firstText.value = title;
      }
    }
  };
}

const ID_REPLACE_REGEX = /[^a-zA-Z0-9-]/g;

function safeId(id: string) {
  const safeStr = id.replace(ID_REPLACE_REGEX, "-");
  return `markdown-${safeStr}`;
}

export type MarkdownDisplayProps = ComponentProps<typeof Streamdown>;

export function MarkdownDisplay({
  rehypePlugins,
  controls,
  className,
  ...props
}: MarkdownDisplayProps) {
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

  const id = useId();

  useEffect(() => {
    // 通过设置的特定 class 拿到容器
    const container = document.querySelector<HTMLElement>(`.${safeId(id)}`);
    if (!container) return;

    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor || anchor.getAttribute("data-streamdown") !== "link") return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      e.preventDefault(); // 拦截跳转
      // 检查是否是内部锚点（脚注），非内部锚点用 tauri 打开
      if (!href.startsWith("#")) {
        void openUrl(href);
        return;
      }

      // 跳转至对应的 id
      const targetRawId = decodeURIComponent(href.slice(1));
      const targetId = CSS.escape(`user-content-${targetRawId}`);
      const targetElement = container.querySelector<HTMLElement>(`[id$="${targetId}"]`);
      if (!targetElement) return;
      targetElement.scrollIntoView({ behavior: "smooth" });

      // 体验优化：给目标增加一个临时的背景闪烁
      const backgroundColor = targetElement.style.backgroundColor;
      targetElement.style.backgroundColor = "var(--accent)";
      setTimeout(() => {
        targetElement.style.backgroundColor = backgroundColor;
      }, 1500);
    };

    container.addEventListener("click", handleAnchorClick);
    return () => {
      container.removeEventListener("click", handleAnchorClick);
    };
  }, [id]);

  return (
    <Streamdown
      rehypePlugins={rehypePluginsWithDefault}
      controls={controlsWithDefault}
      className={cn(className, safeId(id))}
      {...props}
      cdnUrl={convertFileSrc("", "streamdown")}
    />
  );
}
