import { AnimatePresence } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { AnimateDiv } from "@/components/animation/animate-div";
import { Button } from "@/components/ui/button";

interface DeleteConfirmProps {
  resetOnChange?: unknown;
  onDelete: () => Promise<void> | void;
  children: ReactNode;
}

export function DeleteConfirm({ resetOnChange, onDelete, children }: DeleteConfirmProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(2);

  const handleDelete = () => {
    if (deleteConfirm > 0) {
      setDeleteConfirm(deleteConfirm - 1);
      return;
    }
    void onDelete();
    setDeleteConfirm(2);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: 监听值，变动重置
  useEffect(() => {
    setDeleteConfirm(2);
  }, [resetOnChange]);

  return (
    <AnimatePresence mode="wait">
      {deleteConfirm === 2 ? (
        <AnimateDiv
          key="delete-2"
          className="w-full flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
        >
          <Button variant="destructive" className="mr-auto" onClick={handleDelete}>
            删除
          </Button>
          {children}
        </AnimateDiv>
      ) : deleteConfirm === 1 ? (
        <AnimateDiv key="delete-1" className="m-auto">
          <span className="mr-2">二次确认</span>
          <Button variant="destructive" onClick={handleDelete}>
            删除
          </Button>
          <span className="ml-2">后不可恢复</span>
        </AnimateDiv>
      ) : (
        <AnimateDiv key="delete-0" className="gap-1">
          <span className="mr-2">最终确认，执行</span>
          <Button variant="destructive" onClick={handleDelete}>
            删除
          </Button>
        </AnimateDiv>
      )}
    </AnimatePresence>
  );
}
