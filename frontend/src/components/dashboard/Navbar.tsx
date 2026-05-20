'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSidebar } from '@/contexts/SidebarContext'

interface NavbarProps {
  userName?: string
  userEmail?: string
}

export default function Navbar({ userName = 'User', userEmail = '' }: NavbarProps) {
  const router = useRouter()
  const { isCollapsed } = useSidebar()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleLogout = async () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    router.push('/')
  }

  return (
    <motion.header
      className={`sticky top-0 z-40 bg-gradient-to-r from-white/95 to-white/95 backdrop-blur-sm border-b border-gray-100 transition-all duration-300 ${
        isCollapsed ? 'ml-[68px]' : 'ml-[260px]'
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="px-8 py-4 flex items-center justify-between">
        {/* Left side - Search */}
        <motion.div
          className="flex-1 max-w-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search jobs, preferences..."
              className="w-full px-4 py-2 bg-white border border-gray-100 rounded-lg text-sm text-[#0f172a] placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-700">🔍</span>
          </div>
        </motion.div>

        {/* Right side - User menu */}
        <motion.div
          className="flex items-center gap-4 ml-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Notifications */}
          <motion.button
            className="p-2 hover:bg-white/50 rounded-lg transition-colors relative"
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
              className="flex items-center gap-3 px-3 py-2 hover:bg-white/50 rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-[#0f172a] font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-[#0f172a]">{userName}</p>
                <p className="text-xs text-gray-600">{userEmail}</p>
              </div>
              <span className="text-gray-600">▼</span>
            </motion.button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden z-50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href="/dashboard/profile">
                    <motion.div
                      className="px-4 py-2 hover:bg-white/50 text-sm text-[#0f172a] cursor-pointer transition-colors flex items-center gap-2"
                      whileHover={{ x: 4 }}
                    >
                      👤 Profile
                    </motion.div>
                  </Link>
                  <Link href="/dashboard/settings">
                    <motion.div
                      className="px-4 py-2 hover:bg-white/50 text-sm text-[#0f172a] cursor-pointer transition-colors flex items-center gap-2"
                      whileHover={{ x: 4 }}
                    >
                      ⚙️ Settings
                    </motion.div>
                  </Link>
                  <div className="border-t border-gray-100" />
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
