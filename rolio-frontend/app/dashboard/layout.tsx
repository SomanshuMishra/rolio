"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/src/store/authStore"
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import OnboardingOverlay from "@/src/components/onboarding/OnboardingOverlay"

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/jobs", label: "Jobs", icon: Briefcase },
  { href: "/dashboard/resume", label: "Resume", icon: FileText },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout, isHydrated } = useAuthStore()

  useEffect(() => {
    // Check authentication after store has hydrated
    if (isHydrated && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isHydrated, router])

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  // Get user initials from full name
  const getInitials = (name: string | undefined) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 80 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 z-40 hidden h-screen border-r border-border bg-sidebar lg:block"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="relative flex h-9 w-9 items-center justify-center">
                <div className="absolute inset-0 rounded-lg bg-primary/30 blur-md" />
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <span className="text-lg font-bold text-primary-foreground">R</span>
                </div>
              </div>
              <AnimatePresence mode="wait">
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-xl font-bold text-sidebar-foreground overflow-hidden whitespace-nowrap"
                  >
                    ROLIO
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <ChevronLeft className={`h-5 w-5 transition-transform ${!sidebarOpen ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3">
            {sidebarLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }`}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg bg-sidebar-primary"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  <Icon className="relative z-10 h-5 w-5 flex-shrink-0" />
                  <AnimatePresence mode="wait">
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="relative z-10 overflow-hidden whitespace-nowrap text-sm font-medium"
                      >
                        {link.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              )
            })}
          </nav>

          {/* Bottom section */}
          <div className="border-t border-sidebar-border p-3">
            {/* AI Assistant hint */}
            <div className={`mb-3 rounded-lg bg-primary/10 p-3 ${!sidebarOpen ? "hidden" : ""}`}>
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                AI Assistant
              </div>
              <p className="mt-1 text-xs text-sidebar-foreground/70">
                Get personalized career advice
              </p>
            </div>

            {/* User menu */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition-colors"
              aria-label="User menu"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-semibold text-primary-foreground">
                {getInitials(user?.full_name)}
              </div>
              <AnimatePresence mode="wait">
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex-1 overflow-hidden"
                  >
                    <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.full_name || "User"}</p>
                    <p className="truncate text-xs text-sidebar-foreground/70">{user?.email || ""}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence mode="wait">
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <LogOut className="h-4 w-4 text-sidebar-foreground/70" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <header className="fixed left-0 right-0 top-0 z-40 glass border-b border-glass-border lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="relative flex h-9 w-9 items-center justify-center">
              <div className="absolute inset-0 rounded-lg bg-primary/30 blur-md" />
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">R</span>
              </div>
            </div>
            <span className="text-xl font-bold text-foreground">ROLIO</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 top-16 z-40 bg-black/50 lg:hidden"
            />
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed inset-x-0 top-16 z-50 glass border-b border-glass-border lg:hidden max-h-[calc(100vh-64px)] overflow-y-auto"
            >
              <nav className="p-4">
                {sidebarLinks.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 min-h-[44px] ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-white/10"
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">{link.label}</span>
                    </Link>
                  )
                })}
                <div className="mt-4 border-t border-border pt-4">
                  <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-destructive hover:bg-white/10">
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={`min-h-screen pt-16 transition-all duration-300 lg:pt-0 ${
          sidebarOpen ? "lg:pl-64" : "lg:pl-20"
        }`}
      >
        {/* Desktop Top Bar */}
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm lg:flex">
          {/* Search */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search jobs, skills, companies..."
              className="h-10 bg-secondary/50 pl-10 border-border focus:border-primary"
            />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
            </button>

            {/* User dropdown */}
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-3 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold text-primary-foreground">
                JD
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-foreground">John Doe</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">{children}</div>
      </main>

      {/* Onboarding Overlay */}
      {user && !user.is_onboarding_complete && <OnboardingOverlay />}

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-glass-border lg:hidden">
        <div className="flex items-center justify-around">
          {sidebarLinks.slice(0, 5).map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-1 flex-col items-center justify-center gap-1 min-h-[60px] sm:min-h-[56px] rounded-none transition-colors px-2 py-2 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-xs text-center line-clamp-1">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
