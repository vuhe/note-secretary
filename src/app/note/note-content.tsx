import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { Root } from "hast";
import { useCallback, useEffect, useRef } from "react";
import { Streamdown } from "streamdown";
import type { Note } from "@/hooks/use-note";

interface NoteContentProps {
  note: Note;
  editing: boolean;
  draft: string;
  setDraft: (s: string) => void;
}

export default function NoteContent({ note, editing, draft, setDraft }: NoteContentProps) {
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
  useEffect(() => {
    if (!editorAreaRef.current) return;

    const state = EditorState.create({
      doc: note.content,
      extensions: [
        markdown(),
        EditorView.lineWrapping,
        EditorView.theme({
          "&": {
            height: "100%", // 或者 "100%"，取决于父容器
          },
          ".cm-scroller": {
            overflow: "auto",
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
  }, [onEditorScroll, note.content, setDraft]);

  return (
    <div className="flex size-full">
      <div ref={editorAreaRef} className="flex-1 h-full" />
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
          rehypePlugins={[customPlugin]}
          className="px-4 [&>*:first-child]:mt-4 [&>*:last-child]:mb-4"
        >
          {draft}
        </Streamdown>
      </div>
    </div>
  );
}
