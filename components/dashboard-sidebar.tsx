"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/components/sidebar-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Bell,
  Users,
  Settings,
  BarChart2,
  Menu,
  X,
  LogOut,
  CreditCard,
  FolderTree,
} from "lucide-react"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { isOpen, setIsOpen, isMobile, toggleSidebar } = useSidebar()

  const routes = [
    {
      title: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Products",
      href: "/products",
      icon: Package,
    },
    {
      title: "Categories",
      href: "/categories",
      icon: FolderTree,
    },
    {
      title: "Orders",
      href: "/orders",
      icon: ShoppingCart,
    },
    {
      title: "Notifications",
      href: "/notifications",
      icon: Bell,
    },
    {
      title: "Users",
      href: "/users",
      icon: Users,
    },
    {
      title: "Payments",
      href: "/payments",
      icon: CreditCard,
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart2,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50" 
          onClick={() => setIsOpen(false)} 
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-background border-r transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:z-0 md:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center px-4 border-b">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Package className="h-6 w-6" />
              <span>Digital Products</span>
            </Link>
            {isMobile && (
              <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
          <ScrollArea className="flex-1 py-2">
            <nav className="grid gap-1 px-2">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => isMobile && setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground ${
                    pathname === route.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  }`}
                >
                  <route.icon className="h-5 w-5" />
                  {route.title}
                </Link>
              ))}
            </nav>
          </ScrollArea>
          <div className="mt-auto border-t p-4">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/logout">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Link>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile toggle button */}
      {isMobile && !isOpen && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-40 h-12 w-12 rounded-full shadow-lg border-2"
          onClick={toggleSidebar}
          >
          <Menu className="h-5 w-5" />
          </Button>
     
      )}
    </>
  )
}

