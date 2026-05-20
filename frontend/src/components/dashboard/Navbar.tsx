'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSidebar } from '@/contexts/SidebarContext'
import MobileNav from './MobileNav'

interface NavbarProps {
  userName?: string
  userEmail?: string
}

export default function Navbar({ userName = 'User', userEmail = '' }: NavbarProps) {
  const router = useRouter()
  const { isCollapsed } = useSidebar()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogout = async () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    router.push('/')
  }

  return (
    <motion.header
      className="sticky top-0 z-40 bg-gradient-to-r from-slate-900/95 to-slate-900/95 backdrop-blur-sm border-b border-cyan-500/20 transition-all duration-300"
      style={{
        marginLeft: isMobile ? 0 : (isCollapsed ? 68 : 260),
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="px-4 md:px-8 py-4 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <MobileNav />
        </div>

        {/* Left side - Search (hidden on mobile) */}
        <motion.div
          className="flex-1 max-w-sm hidden md:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search jobs, preferences..."
              className="w-full px-4 py-2 bg-slate-800/40 border border-cyan-500/30 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-cyan-500/20 focus:ring-1 transition-colors"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">🔍</span>
          </div>
        </motion.div>

        {/* Right side - User menu */}
        <motion.div
          className="flex items-center gap-4 ml-auto md:ml-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Notifications */}
          <motion.button
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-xl">🔔</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </motion.button>

          {/* User profile dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-slate-200">{userName}</p>
                <p className="text-xs text-slate-400">{userEmail}</p>
              </div>
              <span className="text-slate-400">▼</span>
            </motion.button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  className="absolute right-0 mt-2 w-48 bg-slate-800/95 border border-cyan-500/30 rounded-lg shadow-lg overflow-hidden z-50 backdrop-blur-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href="/dashboard/profile">
                    <motion.div
                      className="px-4 py-2 hover:bg-slate-700/50 text-sm text-slate-200 cursor-pointer transition-colors flex items-center gap-2"
                      whileHover={{ x: 4 }}
                    >
                      👤 Profile
                    </motion.div>
                  </Link>
                  <Link href="/dashboard/settings">
                    <motion.div
                      className="px-4 py-2 hover:bg-slate-700/50 text-sm text-slate-200 cursor-pointer transition-colors flex items-center gap-2"
                      whileHover={{ x: 4 }}
                    >
                      ⚙️ Settings
                    </motion.div>
                  </Link>
                  <div className="border-t border-cyan-500/20" />
                  <motion.button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-sm text-red-400 cursor-pointer transition-colors flex items-center gap-2"
                    whileHover={{ x: 4 }}
                  >
                    🚪 Logout
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.header>
  )
}
