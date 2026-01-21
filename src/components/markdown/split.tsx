"use client";

import type { EditorView } from "@codemirror/view";
import type { Root } from "hast";
import { useRef } from "react";

import { MarkdownDisplay } from "@/components/markdown/display";
import { MarkdownEditor } from "@/components/markdown/editor";
import { Separator } from "@/components/ui/separator";

let treeData: Root | null = null;

interface MarkdownSplitViewProps {
  content: string;
  draft: string;
  setDraft: (s: string) => void;
}

export function MarkdownSplitView({ content, draft, setDraft }: MarkdownSplitViewProps) {
  const editorElementListRef = useRef<number[]>([]);
  const previewElementListRef = useRef<number[]>([]);

  const editorRef = useRef<EditorView>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const currentScrollArea = useRef<"editor" | "preview" | "">("");

  // 计算元素位置
  const computePositions = () => {
    if (!editorRef.current || !treeData) return;
    if (!previewRef.current?.firstElementChild) return;

    const editorView = editorRef.current;
    const previewElements = previewRef.current.firstElementChild.children;

    // 清空数组
    editorElementListRef.current = [];
    previewElementListRef.current = [];

    treeData.children
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
  };

  // 编辑器滚动处理
  const onEditorScroll = () => {
    if (currentScrollArea.current !== "editor") return;
    if (!editorRef.current || !previewRef.current) return;

    computePositions();
    const preview = previewRef.current;

    const scrollTop = editorRef.current.scrollDOM.scrollTop;
    const scrollHeight = editorRef.current.scrollDOM.scrollHeight;
    const clientHeight = editorRef.current.scrollDOM.clientHeight;

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
  };

  // 预览区域滚动处理
  const onPreviewScroll = () => {
    if (currentScrollArea.current !== "preview") return;
    if (!editorRef.current || !previewRef.current) return;

    computePositions();
    const editor = editorRef.current;

    const scrollTop = previewRef.current.scrollTop;
    const scrollHeight = previewRef.current.scrollHeight;
    const clientHeight = previewRef.current.clientHeight;

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
  };

  return (
    <>
      <MarkdownEditor
        className="flex-1 h-full"
        initContent={content}
        editorRef={editorRef}
        onContentChange={setDraft}
        onContentScroll={onEditorScroll}
        onMouseEnterContent={() => {
          currentScrollArea.current = "editor";
        }}
      />
      <Separator orientation="vertical" />
      <div
        ref={previewRef}
        className="flex-1 h-full overflow-y-auto relative"
        onScroll={onPreviewScroll}
        onMouseEnter={() => {
          currentScrollArea.current = "preview";
        }}
      >
        <MarkdownDisplay
          mode="static"
          rehypePlugins={[
            () => (tree: Root) => {
              treeData = tree;
            },
          ]}
          className="px-4 [&>*:first-child]:mt-4 [&>*:last-child]:mb-4"
        >
          {draft}
        </MarkdownDisplay>
      </div>
    </>
  );
}
