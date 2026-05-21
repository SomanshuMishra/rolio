"use client"

import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import {
  Briefcase,
  TrendingUp,
  Target,
  FileText,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Clock,
  Building2,
  MapPin,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { jobsAPI, resumeAPI } from "@/src/lib/api"
import { useAuthStore } from "@/src/store/authStore"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening"

  // Fetch all matches for stats calculation
  const { data: matchesData, isLoading: isLoadingMatches } = useQuery({
    queryKey: ["job-matches"],
    queryFn: () => jobsAPI.getMatches(100),
  })

  // Fetch top 3 matches for display
  const { data: topMatches, isLoading: isLoadingTopMatches } = useQuery({
    queryKey: ["top-job-matches"],
    queryFn: () => jobsAPI.getMatches(3),
  })

  // Fetch resume for insights
  const { data: resume } = useQuery({
    queryKey: ["resume"],
    queryFn: () => resumeAPI.get(),
  })

  // Calculate statistics from matches
  const calculateStats = () => {
    if (!matchesData?.matches) {
      return {
        jobsMatched: 0,
        matchRate: 0,
        applications: 0,
      }
    }

    const matches = matchesData.matches
    const jobsMatched = matchesData.total || matches.length
    const applications = matches.filter((m: any) => m.user_action === "applied").length
    const matchRate =
      matches.length > 0
        ? Math.round(matches.reduce((sum: number, m: any) => sum + (m.match_score || 0), 0) / matches.length)
        : 0

    return {
      jobsMatched,
      matchRate,
      applications,
    }
  }

  const stats = calculateStats()

  // Calculate AI Insights
  const calculateInsights = () => {
    if (!resume?.parsed_data) {
      return [
        { title: "Resume Strength", value: 0, suggestion: "Upload a resume to get insights" },
        { title: "Skill Match", value: 0, suggestion: "Your skills will align with job requirements" },
        { title: "Profile Completeness", value: 0, suggestion: "Complete your profile to improve matches" },
      ]
    }

    const parsed = resume.parsed_data
    const experience = parsed.experience || []
    const education = parsed.education || []
    const skills = parsed.skills || []

    // ATS Compatibility: Base 50 + 10 if name + 10 if email + 10 if phone + 10 if summary + 10 if work experience
    let atsScore = 50
    if (parsed.full_name) atsScore += 10
    if (parsed.email) atsScore += 10
    if (parsed.phone) atsScore += 10
    if (parsed.summary) atsScore += 10
    if (experience.length > 0) atsScore += 10
    const finalAtsScore = Math.min(atsScore, 100)

    // Keyword Match: (skills.length / 50) * 100, capped at 100
    const keywordMatch = Math.min(Math.round((skills.length / 50) * 100), 100)

    // Impact Score: 30 + (experience.length * 15) + (education.length * 10)
    const impactScore = Math.min(30 + experience.length * 15 + education.length * 10, 100)

    return [
      { title: "Resume Strength", value: finalAtsScore, suggestion: "Your ATS compatibility is solid. Keep details structured." },
      { title: "Skill Match", value: keywordMatch, suggestion: "You have strong keyword alignment with AI positions." },
      {
        title: "Profile Completeness",
        value: impactScore,
        suggestion: "Your profile shows good depth. Add more certifications if available.",
      },
    ]
  }

  const insights = calculateInsights()

  const isLoading = isLoadingMatches || isLoadingTopMatches

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-20 lg:pb-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {greeting}, {user?.full_name?.split(" ")[0] || "there"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {"Here's what's happening with your job search today."}
          </p>
        </div>
        <Link href="/dashboard/jobs">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Sparkles className="mr-2 h-4 w-4" />
            Find New Jobs
          </Button>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Jobs Matched */}
            <div className="group relative overflow-hidden rounded-xl border border-border bg-card/50 p-5 transition-colors hover:border-primary/30">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-neon-violet to-neon-blue opacity-10 blur-2xl transition-opacity group-hover:opacity-20" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-neon-violet to-neon-blue p-[1px]">
                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-card">
                      <Briefcase className="h-5 w-5 text-foreground" />
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium text-neon-emerald">
                    +0
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold text-foreground">{stats.jobsMatched}</p>
                <p className="mt-1 text-sm text-muted-foreground">Jobs Matched</p>
              </div>
            </div>

            {/* Match Rate */}
            <div className="group relative overflow-hidden rounded-xl border border-border bg-card/50 p-5 transition-colors hover:border-primary/30">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-neon-blue to-neon-cyan opacity-10 blur-2xl transition-opacity group-hover:opacity-20" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-neon-blue to-neon-cyan p-[1px]">
                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-card">
                      <Target className="h-5 w-5 text-foreground" />
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium text-neon-emerald">
                    0%
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold text-foreground">{stats.matchRate}%</p>
                <p className="mt-1 text-sm text-muted-foreground">Match Rate</p>
              </div>
            </div>

            {/* Applications */}
            <div className="group relative overflow-hidden rounded-xl border border-border bg-card/50 p-5 transition-colors hover:border-primary/30">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-neon-cyan to-neon-emerald opacity-10 blur-2xl transition-opacity group-hover:opacity-20" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-neon-cyan to-neon-emerald p-[1px]">
                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-card">
                      <FileText className="h-5 w-5 text-foreground" />
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium text-neon-emerald">
                    0%
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold text-foreground">{stats.applications}</p>
                <p className="mt-1 text-sm text-muted-foreground">Applications</p>
              </div>
            </div>

            {/* Profile Views */}
            <div className="group relative overflow-hidden rounded-xl border border-border bg-card/50 p-5 transition-colors hover:border-primary/30">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-neon-pink to-neon-violet opacity-10 blur-2xl transition-opacity group-hover:opacity-20" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-neon-pink to-neon-violet p-[1px]">
                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-card">
                      <TrendingUp className="h-5 w-5 text-foreground" />
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium text-neon-emerald">
                    +28
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold text-foreground">342</p>
                <p className="mt-1 text-sm text-muted-foreground">Profile Views</p>
              </div>
            </div>
          </>
        )}
      </motion.div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Recent Job Matches */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card/50">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Top Job Matches</h2>
                <p className="text-sm text-muted-foreground">AI-curated based on your profile</p>
              </div>
              <Link href="/dashboard/jobs">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            {isLoadingTopMatches ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !topMatches?.matches || topMatches.matches.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No jobs matched yet. Set up preferences in settings to get started.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {topMatches.matches.map((match: any, index: number) => {
                  const job = match.job
                  const salaryDisplay = job.salary_max && job.salary_min ? `$${job.salary_min}k - $${job.salary_max}k` : "Salary not listed"
                  return (
                    <motion.div
                      key={match.jsearch_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group flex items-center gap-4 p-5 transition-colors hover:bg-secondary/30"
                    >
                      {/* Company logo placeholder */}
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>

                      {/* Job info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
                          {job.is_remote && (
                            <span className="flex-shrink-0 rounded-full bg-neon-emerald/20 px-2 py-0.5 text-xs text-neon-emerald">
                              Remote
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.location || "Location not listed"}
                          </span>
                          <span>{salaryDisplay}</span>
                        </div>
                      </div>

                      {/* Match score */}
                      <div className="flex flex-col items-center">
                        <div className="relative h-12 w-12">
                          <svg className="h-12 w-12 -rotate-90">
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              fill="none"
                              stroke="oklch(0.25 0.03 265)"
                              strokeWidth="4"
                            />
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              fill="none"
                              stroke={
                                match.match_score >= 90
                                  ? "oklch(0.7 0.18 155)"
                                  : match.match_score >= 85
                                    ? "oklch(0.75 0.15 200)"
                                    : "oklch(0.62 0.25 290)"
                              }
                              strokeWidth="4"
                              strokeDasharray={`${match.match_score * 1.256} 125.6`}
                              className="transition-all duration-1000"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                            {Math.round(match.match_score)}%
                          </span>
                        </div>
                        <span className="mt-1 text-xs text-muted-foreground">Match</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Insights */}
        <motion.div variants={itemVariants}>
          <div className="rounded-xl border border-border bg-card/50">
            <div className="border-b border-border p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">AI Insights</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Personalized recommendations</p>
            </div>
            <div className="space-y-5 p-5">
              {insights.map((insight, index) => (
                <div key={insight.title}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{insight.title}</span>
                    <span className="text-sm font-bold text-foreground">{insight.value}%</span>
                  </div>
                  <Progress
                    value={insight.value}
                    className="mt-2 h-2 bg-secondary"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">{insight.suggestion}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-5">
              <Link href="/dashboard/resume">
                <Button variant="outline" className="w-full border-border bg-secondary/30 hover:bg-secondary/50">
                  Optimize Resume
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
