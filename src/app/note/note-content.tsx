import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { EditorState } from "@codemirror/state";
import { EditorView, highlightWhitespace, lineNumbers } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { GFM } from "@lezer/markdown";
import type { Root } from "hast";
import { useCallback, useEffect, useRef } from "react";
import { defaultRehypePlugins, Streamdown } from "streamdown";

import { usePlatform } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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

interface NoteContentProps {
  id: string;
  content: string;
  editing: boolean;
  draft: string;
  setDraft: (s: string) => void;
}

export default function NoteContent({ id, content, editing, draft, setDraft }: NoteContentProps) {
  const isMobile = usePlatform((state) => state.isMobile);

  const treeDataRef = useRef<Root>(null);
  const editorElementListRef = useRef<number[]>([]);
  const previewElementListRef = useRef<number[]>([]);
  const editorViewRef = useRef<EditorView>(null);

  const editorAreaRef = useRef<HTMLDivElement>(null);
  const previewAreaRef = useRef<HTMLDivElement>(null);

  // 当前滚动焦点
  const currentScrollArea = useRef<"editor" | "preview" | "">("");

  // 获取语法树
  const customPlugin = useCallback(() => {
    return (tree: Root) => {
      treeDataRef.current = tree;
    };
  }, []);

  // 计算元素位置
  const computePositions = useCallback(() => {
    if (!editorViewRef.current || !treeDataRef.current) return;
    if (!previewAreaRef.current?.firstElementChild) return;

    const editorView = editorViewRef.current;
    const previewElements = previewAreaRef.current.firstElementChild.children;

    // 清空数组
    editorElementListRef.current = [];
    previewElementListRef.current = [];

    treeDataRef.current.children
      // 如果节点类型不为element则跳过
      .filter((it) => it.type === "element")
      .forEach((child, index) => {
        if (!child.position) return;

        const line = editorView.state.doc.line(child.position.start.line);
        const lineBlock = editorView.lineBlockAt(line.from);
        // 保存元素的位置信息
        editorElementListRef.current.push(lineBlock.top);
        previewElementListRef.current.push((previewElements[index] as HTMLElement).offsetTop);
      });
  }, []);

  // 编辑器滚动处理
  const onEditorScroll = useCallback(() => {
    if (currentScrollArea.current !== "editor") return;
    if (!editorViewRef.current || !previewAreaRef.current) return;

    computePositions();
    const preview = previewAreaRef.current;

    const scrollTop = editorViewRef.current.scrollDOM.scrollTop;
    const scrollHeight = editorViewRef.current.scrollDOM.scrollHeight;
    const clientHeight = editorViewRef.current.scrollDOM.clientHeight;

    // 已经滚动到底部
    if (scrollTop >= scrollHeight - clientHeight) {
      preview.scrollTo({
        top: preview.scrollHeight - preview.clientHeight,
        behavior: "smooth",
      });
      return;
    }

    // 已经滚动到顶部
    if (scrollTop <= 0) {
      preview.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    // 找出当前滚动到元素索引
    const editorPositions = editorElementListRef.current;
    for (let i = 0; i < editorPositions.length - 1; i++) {
      if (editorPositions[i] <= scrollTop && scrollTop < editorPositions[i + 1]) {
        const ratio =
          (scrollTop - editorPositions[i]) / (editorPositions[i + 1] - editorPositions[i]);

        const previewPositions = previewElementListRef.current;
        preview.scrollTo({
          top: ratio * (previewPositions[i + 1] - previewPositions[i]) + previewPositions[i],
          behavior: "smooth",
        });

        break;
      }
    }
  }, [computePositions]);

  // 预览区域滚动处理
  const onPreviewScroll = useCallback(() => {
    if (currentScrollArea.current !== "preview") return;
    if (!editorViewRef.current || !previewAreaRef.current) return;

    computePositions();
    const editor = editorViewRef.current;

    const scrollTop = previewAreaRef.current.scrollTop;
    const scrollHeight = previewAreaRef.current.scrollHeight;
    const clientHeight = previewAreaRef.current.clientHeight;

    // 已经滚动到底部
    if (scrollTop >= scrollHeight - clientHeight) {
      editor.scrollDOM.scrollTo({
        top: editor.scrollDOM.scrollHeight - editor.scrollDOM.clientHeight,
        behavior: "smooth",
      });
      return;
    }

    // 已经滚动到顶部
    if (scrollTop <= 0) {
      editor.scrollDOM.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    // 找出当前滚动到元素索引
    const previewPositions = previewElementListRef.current;
    for (let i = 0; i < previewPositions.length - 1; i++) {
      if (previewPositions[i] <= scrollTop && scrollTop < previewPositions[i + 1]) {
        const ratio =
          (scrollTop - previewPositions[i]) / (previewPositions[i + 1] - previewPositions[i]);

        const editorPositions = editorElementListRef.current;
        editor.scrollDOM.scrollTo({
          top: ratio * (editorPositions[i + 1] - editorPositions[i]) + editorPositions[i],
          behavior: "smooth",
        });

        break;
      }
    }
  }, [computePositions]);

  // 初始化编辑器
  // biome-ignore lint/correctness/useExhaustiveDependencies: recreate only id change
  useEffect(() => {
    if (isMobile || !editorAreaRef.current) return;

    const state = EditorState.create({
      doc: content,
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
            setDraft(update.state.doc.toString());
          }
        }),
        EditorView.domEventHandlers({
          scroll: onEditorScroll,
          mouseenter: () => {
            currentScrollArea.current = "editor";
          },
        }),
      ],
    });

    const view = new EditorView({ state, parent: editorAreaRef.current });
    editorViewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [isMobile, onEditorScroll, id, setDraft]);

  return (
    <div className="group flex size-full" data-state={editing ? "expanded" : "collapsed"}>
      <div
        ref={editorAreaRef}
        className={cn(
          "h-full transition-[width,opacity] duration-400 ease-in-out border-r border-r-border",
          "w-1/2 group-data-[state=collapsed]:w-0 group-data-[state=collapsed]:opacity-0",
        )}
      />
      {/** biome-ignore lint/a11y/noStaticElementInteractions: ignore it */}
      <div
        ref={previewAreaRef}
        className="flex-1 h-full overflow-y-auto relative"
        onScroll={onPreviewScroll}
        onMouseEnter={() => {
          currentScrollArea.current = "preview";
        }}
      >
        <Streamdown
          mode="static"
          rehypePlugins={[
            customPlugin,
            defaultRehypePlugins.harden,
            defaultRehypePlugins.raw,
            defaultRehypePlugins.katex,
          ]}
          className="px-4 [&>*:first-child]:mt-4 [&>*:last-child]:mb-4"
        >
          {draft}
        </Streamdown>
      </div>
    </div>
  );
}
