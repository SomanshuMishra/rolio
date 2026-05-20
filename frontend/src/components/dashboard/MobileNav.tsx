'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Heart,
  User,
  Settings,
  LogOut,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Jobs', href: '/dashboard/jobs', icon: Briefcase },
  { name: 'Saved', href: '/dashboard/saved', icon: Heart },
  { name: 'Resume', href: '/dashboard/resume', icon: FileText },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    router.push('/')
  }

  return (
    <>
      {/* Hamburger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 hover:bg-white/50 rounded-lg transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <X size={24} className="text-gray-700" />
        ) : (
          <div className="w-6 h-5 flex flex-col justify-between">
            <span className="block w-6 h-0.5 bg-gray-700"></span>
            <span className="block w-6 h-0.5 bg-gray-700"></span>
            <span className="block w-6 h-0.5 bg-gray-700"></span>
          </div>
        )}
      </motion.button>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed md:hidden inset-0 bg-black/50 z-30 top-16"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed md:hidden left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-xl z-40 overflow-y-auto"
            >
              <nav className="p-4 space-y-2">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href)
                  const Icon = item.icon

                  return (
                    <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                      <motion.div
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon size={20} />
                        <span className="font-medium">{item.name}</span>
                      </motion.div>
                    </Link>
                  )
                })}

                {/* Logout Button */}
                <motion.button
                  onClick={() => {
                    setIsOpen(false)
                    handleLogout()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-red-400 to-rose-400 text-white font-medium mt-4"
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </motion.button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
