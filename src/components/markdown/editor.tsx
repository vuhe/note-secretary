"use client";

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { EditorState } from "@codemirror/state";
import { EditorView, highlightWhitespace, lineNumbers } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { GFM } from "@lezer/markdown";
import { type ComponentProps, type RefObject, useEffect, useRef } from "react";
import { usePlatform } from "@/hooks/use-mobile";

const EditorStyle = HighlightStyle.define([
  // --- 代码与逻辑 ---
  { tag: t.comment, color: "var(--muted-foreground)", fontStyle: "italic" }, // 注释
  { tag: t.keyword, color: "var(--chart-1)" }, // 关键字
  { tag: t.name, color: "var(--chart-4)" }, // 标识符
  { tag: t.literal, color: "var(--muted-foreground)" }, // 字面量
  { tag: t.operator, color: "var(--chart-2)" }, // 操作符
  { tag: t.punctuation, color: "var(--chart-5)" }, // 标点符号
  { tag: t.variableName, color: "var(--primary)" }, // 变量名
  { tag: t.propertyName, color: "var(--chart-3)" }, // 字段名
  // --- 标题系列 (h1 - h6) ---
  {
    tag: [t.heading1, t.heading2, t.heading3],
    color: "var(--primary)",
    fontWeight: "bold",
    fontSize: "1.2em",
  },
  { tag: [t.heading4, t.heading5, t.heading6], color: "var(--primary)", fontWeight: "bold" },
  { tag: t.contentSeparator, color: "var(--border)" }, // 内容分隔
  { tag: t.list, color: "var(--muted-foreground)" }, // 列表符号 (- 或 *)
  { tag: t.quote, color: "var(--muted-foreground)", fontStyle: "italic" }, // > 引用
  { tag: t.emphasis, fontStyle: "italic" }, // *斜体*
  { tag: t.strong, color: "var(--primary)", fontWeight: "bold" }, // **粗体**
  { tag: t.link, color: "var(--chart-5)", textDecoration: "underline" }, // [链接文字]
  { tag: t.monospace, color: "var(--chart-4)" }, // `行内代码`
  { tag: t.strikethrough, textDecoration: "line-through", color: "var(--muted-foreground)" }, // ~~删除线~~
  { tag: t.inserted, textDecoration: "line-through", color: "var(--chart-4)" }, // diff 新增
  { tag: t.deleted, textDecoration: "line-through", color: "var(--chart-1)" }, // diff 删除
  { tag: t.changed, textDecoration: "line-through", color: "var(--chart-2)" }, // diff 更改
  { tag: t.invalid, color: "var(--destructive)" }, // 未识别部分
  { tag: t.meta, color: "var(--muted-foreground)" }, // 代码块语言标识 (如 ```js)
]);

type MarkdownEditorProps = ComponentProps<"div"> & {
  initContent: string;
  editorRef?: RefObject<EditorView | null>;
  onContentChange?: (s: string) => void;
  onContentScroll?: () => void;
  onMouseEnterContent?: () => void;
};

export function MarkdownEditor({
  initContent,
  editorRef,
  onContentChange,
  onContentScroll,
  onMouseEnterContent,
  ...props
}: MarkdownEditorProps) {
  const isMobile = usePlatform((state) => state.isMobile);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMobile || !container.current) return;

    const state = EditorState.create({
      doc: initContent,
      extensions: [
        lineNumbers(),
        highlightWhitespace(),
        markdown({
          base: markdownLanguage,
          addKeymap: true,
          codeLanguages: languages,
          extensions: [GFM],
        }),
        syntaxHighlighting(EditorStyle),
        EditorView.lineWrapping,
        EditorView.theme({
          "&": {
            height: "100%",
            borderBottomLeftRadius: "var(--radius)",
            overflow: "hidden",
          },
          "&.cm-focused": {
            outline: "none",
          },
          ".cm-scroller": {
            overflow: "auto",
            fontFamily: "var(--font-jetbrains-mono)",
            lineHeight: "1.2",
          },
          ".cm-gutters": {
            color: "var(--muted-foreground)",
            backgroundColor: "var(--muted)",
            fontFamily: "var(--font-jetbrains-mono)",
            border: "none",
          },
          ".cm-line": {
            caretColor: "var(--ring)",
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onContentChange?.(update.state.doc.toString());
          }
        }),
        EditorView.domEventHandlers({
          scroll: onContentScroll,
          mouseenter: onMouseEnterContent,
        }),
      ],
    });

    const view = new EditorView({ state, parent: container.current });
    if (editorRef) editorRef.current = view;

    return () => {
      view.destroy();
    };
  }, [isMobile, initContent, editorRef, onContentChange, onContentScroll, onMouseEnterContent]);

  return <div {...props} ref={container} />;
}
