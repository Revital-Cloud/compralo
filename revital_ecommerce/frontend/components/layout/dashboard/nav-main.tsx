"use client"

import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui"
import Link from "next/link"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    section?: string
  }[]
}) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  // Agrupar items por sección
  const groupedItems = items.reduce((acc, item) => {
    const section = item.section || 'otros'
    if (!acc[section]) acc[section] = []
    acc[section].push(item)
    return acc
  }, {} as Record<string, typeof items>)

  const sections = [
    { key: 'principal', label: 'Principal' },
    { key: 'catalogo', label: 'Catálogo' },
    { key: 'gestion', label: 'Gestión' },
    { key: 'otros', label: 'Otros' }
  ]

  return (
    <>
      {sections.map((section, sectionIndex) => {
        const sectionItems = groupedItems[section.key] || []
        if (sectionItems.length === 0) return null

        return (
          <SidebarGroup key={section.key}>
            {sectionIndex > 0 && (
              <div className="px-2 py-2">
                <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
              </div>
            )}
            <div className="px-3 py-2 group-data-[collapsible=icon]:hidden">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {section.label}
              </h3>
            </div>
            <SidebarGroupContent className="flex flex-col gap-1">
              <SidebarMenu>
                {sectionItems.map((item) => {
                  const isActive = item.url === '/admin' 
                    ? pathname === '/admin'
                    : pathname === item.url || pathname.startsWith(item.url + '/')
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        tooltip={item.title} 
                        asChild
                        className={`transition-colors duration-300 ${
                          isActive 
                            ? 'bg-[#fec806]/10 text-[#fec806] hover:bg-[#fec806]/20 border-l-4 border-[#fec806] group-data-[collapsible=icon]:border-l-0 group-data-[collapsible=icon]:ring-1 group-data-[collapsible=icon]:ring-[#fec806]/70 group-data-[collapsible=icon]:ring-inset' 
                            : 'text-gray-700 dark:text-gray-300 hover:text-[#fec806] hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Link
                          href={item.url}
                          onClick={() => {
                            if (isMobile) setOpenMobile(false)
                          }}
                        >
                          {item.icon && <item.icon className={isActive ? 'text-[#fec806]' : ''} />}
                          <span className={isActive ? 'font-semibold' : ''}>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )
      })}
    </>
  )
}