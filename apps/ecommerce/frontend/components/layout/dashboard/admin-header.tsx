import { Separator } from "@repo/ui"
import { SidebarTrigger } from "@repo/ui"
import { ThemeToggle } from "@/components/layout/shop/header/components/theme-toggle"

export default function AdminHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-sidebar-border bg-background ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) transition-colors duration-300">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 my-auto data-[orientation=vertical]:h-6 bg-border"
        />
        <h1 className="text-base font-medium text-foreground transition-colors duration-300">Dashboard</h1>
      </div>
      <div className="ml-auto flex items-center gap-2 px-4">
        <ThemeToggle />
      </div>
    </header>
  )
}
