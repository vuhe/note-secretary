"use client";

import { createIdGenerator } from "ai";
import {
  ChevronRightIcon,
  FilePlusCornerIcon,
  MessageSquarePlusIcon,
  Search,
  SettingsIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ComponentProps, useCallback } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import { useChatId } from "@/hooks/use-chat";
import { type NavNoteCategory, useNavigation } from "@/hooks/use-navigation";

function NavSearch({ ...props }: ComponentProps<"form">) {
  return (
    <form {...props}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <SidebarInput id="search" placeholder="搜索对话和笔记" className="pl-8" />
          <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  );
}

interface NavScopeItem {
  title: string;
}

interface NavScope {
  title: string;
  items: NavScopeItem[];
}

function NavChatGroup({ group }: { group: NavScope[] }) {
  const router = useRouter();

  const newChat = useCallback(() => {
    useChatId.getState().newChat();
    router.push("/chat");
  }, [router]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="select-none">聊天记录</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild onClick={newChat}>
              <span className="select-none">
                <MessageSquarePlusIcon />
                <span>新建对话</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {group.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Collapsible
                className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
                defaultOpen={item.title === "最近对话"}
              >
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <ChevronRightIcon className="transition-transform" />
                    {item.title}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuButton
                        key={subItem.title}
                        isActive={subItem.title === "button.tsx"}
                      >
                        {subItem.title}
                      </SidebarMenuButton>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/** note id 生成器 */
const noteId = createIdGenerator({ prefix: "note" });

function NavNoteGroup({ notes }: { notes: NavNoteCategory[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currUrl = `${pathname}?${searchParams.toString()}`;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="select-none">笔记</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              onClick={() => {
                router.push(`/note-add?id=${noteId()}`);
              }}
            >
              <span className="select-none">
                <FilePlusCornerIcon />
                <span>新建笔记</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {notes.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Collapsible className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90">
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <ChevronRightIcon className="transition-transform" />
                    {item.title}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.notes.map((subItem) => (
                      <SidebarMenuButton
                        key={subItem.title}
                        isActive={currUrl === `/note?id=${subItem.id}`}
                        onClick={() => {
                          router.push(`/note?id=${subItem.id}`);
                        }}
                      >
                        {subItem.title}
                      </SidebarMenuButton>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

const data = {
  chats: [
    {
      title: "最近对话",
      items: [{ title: "对话 1" }, { title: "对话 2" }],
    },
    {
      title: "归档对话",
      items: [{ title: "对话 3" }, { title: "对话 4" }],
    },
  ],
};

export function SidebarNavigation() {
  const { notes } = useNavigation();

  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      <SidebarHeader>
        <NavSearch />
      </SidebarHeader>
      <SidebarContent>
        <NavChatGroup group={data.chats} />
        <NavNoteGroup notes={notes} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <span>
                <SettingsIcon />
                <span>设置</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
