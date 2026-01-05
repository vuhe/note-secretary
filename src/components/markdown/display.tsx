// noinspection SpellCheckingInspection

"use client";

import type { ComponentProps } from "react";
import { type ControlsConfig, defaultRehypePlugins, Streamdown } from "streamdown";
import { usePlatform } from "@/hooks/use-mobile";

export type MarkdownDisplayProps = ComponentProps<typeof Streamdown>;

export function MarkdownDisplay({ rehypePlugins, controls, ...props }: MarkdownDisplayProps) {
  const isDesktop = usePlatform((state) => state.isDesktop);

  const rehypePluginsWithDefault = rehypePlugins
    ? [
        ...rehypePlugins,
        defaultRehypePlugins.harden,
        defaultRehypePlugins.raw,
        defaultRehypePlugins.katex,
      ]
    : undefined;

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
    />
  );
}
