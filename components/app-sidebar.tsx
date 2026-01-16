"use client"

import * as React from "react"
import {
  IconDashboard,
  // IconSettings,
  // IconUsers,
  // IconBook,
  // IconMessage,
  IconInnerShadowTop,
  IconMicrophone,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
// import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/authStore"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Shadowing",
    url: "/shadowing",
    icon: IconMicrophone,
  },
  // {
  //   title: "Users",
  //   url: "/dashboard/users",
  //   icon: IconUsers,
  // },
  // {
  //   title: "Lessons",
  //   url: "/dashboard/lessons",
  //   icon: IconBook,
  // },
  // {
  //   title: "Chatbot",
  //   url: "/dashboard/chatbot",
  //   icon: IconMessage,
  // },
]

// const navSecondary = [
//   {
//     title: "Settings",
//     url: "/dashboard/settings",
//     icon: IconSettings,
//   },
// ]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore()
  
  const userData = {
    name: user?.first || user?.email?.split('@')[0] || 'Admin',
    email: user?.email || '',
    avatar: '',
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                
                <span className="text-base font-semibold">Deep English Admin</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {/* <NavSecondary items={navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
