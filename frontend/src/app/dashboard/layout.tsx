'use client'

import { motion } from 'framer-motion'
import Sidebar from '@/components/dashboard/Sidebar'
import Navbar from '@/components/dashboard/Navbar'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import HolographicGrid from '@/components/ui/HolographicGrid'

function DashboardContent({
  children,
  userName,
  userEmail,
}: {
  children: React.ReactNode
  userName: string
  userEmail: string
}) {
  const { isCollapsed } = useSidebar()
  const [isMobile, setIsMobile] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <>
      {/* Only render sidebar on desktop */}
      {isClient && !isMobile && <Sidebar />}

      <Navbar userName={userName} userEmail={userEmail} />

      {/* Main content */}
      <motion.main
        className="pt-0 min-h-screen transition-all duration-300 bg-[#030712] relative"
        style={{
          marginLeft: isMobile ? 0 : (isCollapsed ? 68 : 260),
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <HolographicGrid />
        <div className="relative z-10">
          {children}
        </div>
      </motion.main>
    </>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState('User')
  const [userEmail, setUserEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    // Fetch user profile
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            router.push('/auth/login')
            return
          }
        } else {
          const data = await response.json()
          setUserName(data.full_name || 'User')
          setUserEmail(data.email || '')
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setIsAuthenticated(true)
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-[#030712] flex items-center justify-center relative">
        <HolographicGrid />
        <motion.div
          className="flex flex-col items-center gap-4 relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-12 h-12 border-3 border-cyan-500 border-t-purple-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <p className="text-cyan-400 font-medium">Loading dashboard...</p>
        </motion.div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="bg-[#030712] text-slate-300 min-h-screen">
        <DashboardContent userName={userName} userEmail={userEmail}>
          {children}
        </DashboardContent>
      </div>
    </SidebarProvider>
  )
}
