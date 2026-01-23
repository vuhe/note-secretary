"use client";

import type { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface MainHeaderProps {
  border?: boolean;
  children: ReactNode;
}

export function MainHeader({ border, children }: MainHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-(--header-height) shrink-0 items-center gap-2",
        "transition-[width,height] ease-linear",
        "group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)",
        border && "border-b",
      )}
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 mr-2" />
        {children}
      </div>
    </header>
  );
}
