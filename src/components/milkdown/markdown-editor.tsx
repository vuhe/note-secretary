import { Crepe, CrepeFeature } from "@milkdown/crepe";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import "@milkdown/crepe/theme/common/style.css";

interface MarkdownEditorProps {
  defaultValue: string;
  onChange?: (v: string) => void;
}

// noinspection SpellCheckingInspection
function MilkdownEditor({ defaultValue, onChange }: MarkdownEditorProps) {
  useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue,
      features: {
        [CrepeFeature.Toolbar]: false, // 顶部工具栏
        [CrepeFeature.BlockEdit]: false, // 左侧拖拽块和斜杠菜单
        [CrepeFeature.LinkTooltip]: false, // 链接编辑浮窗
        [CrepeFeature.CodeMirror]: true, // 代码块高亮
        [CrepeFeature.ListItem]: true, // 列表增强
        [CrepeFeature.Cursor]: true, // 更好的光标定位
        [CrepeFeature.Placeholder]: true, // 空白提示
      },
    });

    // 监听内容变化
    crepe.on((listener) => {
      listener.markdownUpdated((_, markdown, prevMarkdown) => {
        if (onChange && markdown !== prevMarkdown) {
          onChange(markdown);
        }
      });
    });

    return crepe;
  }, []);

  return <Milkdown />;
}

export default function MarkdownEditor(props: MarkdownEditorProps) {
  return (
    <MilkdownProvider>
      <MilkdownEditor {...props} />
    </MilkdownProvider>
  );
}
