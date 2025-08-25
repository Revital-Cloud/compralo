"use client"

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground text-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-gray-800 transition-colors duration-300"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-muted dark:bg-gray-700 text-foreground dark:text-gray-300">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-foreground dark:text-white">{user.name}</span>
                <span className="text-muted-foreground dark:text-gray-400 truncate text-xs">
                  {user.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4 text-foreground dark:text-gray-300" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-background dark:bg-gray-900 border border-border dark:border-gray-700 transition-colors duration-300"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg bg-muted dark:bg-gray-700 text-foreground dark:text-gray-300">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-foreground dark:text-white">{user.name}</span>
                  <span className="text-muted-foreground dark:text-gray-400 truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border dark:bg-gray-700" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-gray-800 transition-colors duration-300">
                <IconUserCircle className="text-foreground dark:text-gray-300" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-gray-800 transition-colors duration-300">
                <IconCreditCard className="text-foreground dark:text-gray-300" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-gray-800 transition-colors duration-300">
                <IconNotification className="text-foreground dark:text-gray-300" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-border dark:bg-gray-700" />
            <DropdownMenuItem className="text-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-gray-800 transition-colors duration-300">
              <IconLogout className="text-foreground dark:text-gray-300" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
