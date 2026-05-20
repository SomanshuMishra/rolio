'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Heart,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: string
  status?: boolean
  color?: string
}

interface NavSection {
  label: string
  items: NavItem[]
}

const NAVIGATION_SECTIONS: NavSection[] = [
  {
    label: 'DISCOVER',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'bg-gradient-to-br from-blue-300 to-cyan-300' },
      { name: 'Jobs', href: '/dashboard/jobs', icon: Briefcase, badge: 'jobs', color: 'bg-gradient-to-br from-pink-300 to-rose-300' },
      { name: 'Saved', href: '/dashboard/saved', icon: Heart, badge: 'saved', color: 'bg-gradient-to-br from-red-300 to-pink-300' },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { name: 'Resume', href: '/dashboard/resume', icon: FileText, status: true, color: 'bg-gradient-to-br from-yellow-300 to-amber-300' },
      { name: 'Profile', href: '/dashboard/profile', icon: User, color: 'bg-gradient-to-br from-purple-300 to-violet-300' },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings, color: 'bg-gradient-to-br from-green-300 to-emerald-300' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [userName, setUserName] = useState('User')
  const [badgeCounts, setBadgeCounts] = useState({ jobs: 0, saved: 0 })
  const [hasResume, setHasResume] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

        const profileResponse = await fetch(`${apiUrl}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (profileResponse.ok) {
          const profile = await profileResponse.json()
          setUserName(profile.full_name || 'User')
        }

        const matchesResponse = await fetch(`${apiUrl}/api/jobs/matches?limit=1000`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (matchesResponse.ok) {
          const matches = await matchesResponse.json()
          const saved = matches.matches?.filter((m: any) => m.user_action === 'saved').length || 0
          const total = matches.total || 0
          setBadgeCounts({ jobs: total, saved })
        }

        const resumeResponse = await fetch(`${apiUrl}/api/resume/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setHasResume(resumeResponse.ok)
      } catch (error) {
        console.error('Failed to fetch sidebar data:', error)
      }
    }

    fetchData()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    router.push('/auth/login')
  }

  return (
    <motion.aside
      className="fixed left-0 top-0 h-screen bg-gradient-to-b from-white via-white/98 to-pink-50/80 border-r border-pink-100/50 backdrop-blur-sm z-40"
      animate={{ width: isCollapsed ? 68 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Logo Section */}
      <motion.div
        className="p-4 border-b border-pink-100/50 h-20 flex items-center justify-between bg-gradient-to-r from-white/80 via-pink-50/50 to-white/80"
        layout
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-400 to-purple-300 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-display font-bold text-lg">R</span>
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-sm font-display font-bold gradient-text whitespace-nowrap">ROLIO</h1>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-purple-100 transition-colors flex-shrink-0"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isCollapsed ? (
            <ChevronRight size={18} className="text-purple-500" />
          ) : (
            <ChevronLeft size={18} className="text-purple-500" />
          )}
        </motion.button>
      </motion.div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 bg-gradient-to-b from-transparent via-white/20 to-pink-50/30">
        {NAVIGATION_SECTIONS.map((section, sectionIdx) => (
          <motion.div key={section.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: sectionIdx * 0.1 }}>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-purple-400 mb-3 px-3">
                    {section.label}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              {section.items.map((item, idx) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                const Icon = item.icon

                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: sectionIdx * 0.1 + idx * 0.05 }}
                  >
                    <Link href={item.href}>
                      <motion.div
                        className={`relative px-3 py-2.5 rounded-lg cursor-pointer flex items-center gap-3 transition-all duration-200 group ${
                          isActive
                            ? `${item.color} shadow-md text-white`
                            : 'bg-white/40 hover:bg-white/60 text-gray-700 hover:text-gray-900'
                        }`}
                        whileTap={{ scale: 0.96 }}
                      >
                        {/* Icon */}
                        <div className="relative flex-shrink-0">
                          <Icon
                            size={20}
                            className={`transition-colors duration-200 ${
                              isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'
                            }`}
                          />
                        </div>

                        {/* Label & Badge */}
                        <AnimatePresence mode="wait">
                          {!isCollapsed && (
                            <motion.div
                              className="flex items-center justify-between flex-1 min-w-0"
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <span
                                className={`text-sm font-medium truncate transition-colors duration-200 ${
                                  isActive ? 'text-white' : 'text-gray-700'
                                }`}
                              >
                                {item.name}
                              </span>

                              {/* Status indicator or Badge */}
                              {item.status && hasResume && (
                                <motion.div
                                  className="text-emerald-500 flex-shrink-0"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.3 }}
                                >
                                  <CheckCircle size={16} />
                                </motion.div>
                              )}

                              {item.badge && badgeCounts[item.badge as keyof typeof badgeCounts] > 0 && (
                                <motion.span
                                  className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${
                                    isActive
                                      ? 'bg-white/30 text-white'
                                      : 'bg-pink-200 text-pink-700'
                                  }`}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.3 }}
                                >
                                  {badgeCounts[item.badge as keyof typeof badgeCounts]}
                                </motion.span>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </nav>

      {/* User Section */}
      <motion.div className="border-t border-pink-100 p-3 space-y-2 bg-gradient-to-t from-pink-50 to-white">
        <motion.div className="px-3 py-2.5 rounded-lg bg-gradient-to-r from-purple-300 to-violet-300 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-xs font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">{userName.charAt(0).toUpperCase()}</span>
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                className="flex-1 min-w-0"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs font-medium text-white truncate">{userName}</p>
                <p className="text-[10px] text-white/80">Tech Professional</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.button
          onClick={handleLogout}
          className="w-full px-3 py-2.5 rounded-lg bg-gradient-to-r from-red-400 to-rose-400 hover:from-red-500 hover:to-rose-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-md"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
        >
          <LogOut size={16} />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>
    </motion.aside>
  )
}
