import { ChevronRightIcon, FilePlusCornerIcon, MessageSquarePlusIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";

interface NavScopeItem {
  title: string;
}

interface NavScope {
  title: string;
  items: NavScopeItem[];
}

function NavChatGroup({ group }: { group: NavScope[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>聊天记录</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <span>
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
                        className="data-[active=true]:bg-transparent"
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

function NavNoteGroup({ group }: { group: NavScope[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>笔记</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <span>
                <FilePlusCornerIcon />
                <span>新建笔记</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {group.map((item) => (
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
                    {item.items.map((subItem) => (
                      <SidebarMenuButton
                        key={subItem.title}
                        isActive={subItem.title === "button.tsx"}
                        className="data-[active=true]:bg-transparent"
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

export { NavChatGroup, NavNoteGroup };
