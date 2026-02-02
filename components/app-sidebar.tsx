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
  IconGift,
  IconCoin,
  IconFileDescription,
  IconUsersGroup,
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
  SidebarGroup,
  SidebarGroupLabel,
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
]

const navRewards = [
  {
    title: "Member Rewards",
    url: "/rewards/credits",
    icon: IconCoin,
  },
  {
    title: "Documentation",
    url: "/rewards/documentation",
    icon: IconFileDescription,
  },
]

const navUsers = [
  {
    title: "Duplicate Accounts",
    url: "/users/duplicates",
    icon: IconUsersGroup,
  },
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
        <SidebarGroup>
          <SidebarGroupLabel>User Management</SidebarGroupLabel>
          <NavMain items={navUsers} />
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Referral System</SidebarGroupLabel>
          <NavMain items={navRewards} />
        </SidebarGroup>
        {/* <NavSecondary items={navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
