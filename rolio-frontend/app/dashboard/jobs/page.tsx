"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { useQuery, useMutation } from "@tanstack/react-query"
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Building2,
  Bookmark,
  ExternalLink,
  DollarSign,
  Users,
  Sparkles,
  ChevronDown,
  X,
  Loader2,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { jobsAPI } from "@/lib/api"

const filters = {
  jobType: ["Full-time", "Part-time", "Contract", "Internship"],
  experience: ["Entry", "Mid", "Senior", "Lead"],
  salary: ["$50k+", "$100k+", "$150k+", "$200k+"],
  location: ["Remote", "Hybrid", "On-site"],
}

interface JobMatch {
  id: string
  jsearch_id: string
  job: {
    title: string
    company: string
    location: string
    description: string
    salary_min?: number
    salary_max?: number
    is_remote: boolean
    job_type?: string
  }
  match_score: number
  match_reasons: string[]
  user_action?: string
  apply_url?: string
}

function JobCard({ job, onMutate, refetch }: { job: JobMatch; onMutate?: () => void; refetch: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), { stiffness: 300, damping: 30 })

  // Detect mobile on mount
  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current || isMobile) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    if (isMobile) return
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }

  const matchScore = Math.round(job.match_score || 0)
  const isSaved = job.user_action === "saved"

  const matchColor = matchScore >= 90
    ? "text-neon-emerald"
    : matchScore >= 85
    ? "text-neon-cyan"
    : "text-violet-400"

  const matchStroke = matchScore >= 90
    ? "oklch(0.7 0.18 155)"
    : matchScore >= 85
    ? "oklch(0.78 0.12 195)"
    : "oklch(0.62 0.25 290)"

  // Format salary range
  const salaryRange = job.job.salary_min && job.job.salary_max
    ? `$${(job.job.salary_min / 1000).toFixed(0)}k - $${(job.job.salary_max / 1000).toFixed(0)}k`
    : "Not specified"

  // Save mutation
  const { mutate: saveJob, isPending: isSavePending } = useMutation({
    mutationFn: () => jobsAPI.saveJob(job.jsearch_id),
    onSuccess: () => {
      toast.success(isSaved ? "Job unsaved" : "Job saved!")
      refetch()
    },
    onError: () => {
      toast.error("Failed to save job")
    },
  })

  // Dismiss mutation
  const { mutate: dismissJob, isPending: isDismissPending } = useMutation({
    mutationFn: () => jobsAPI.dismissJob(job.jsearch_id),
    onSuccess: () => {
      toast.success("Job dismissed")
      refetch()
    },
    onError: () => {
      toast.error("Failed to dismiss job")
    },
  })

  // Apply mutation
  const { mutate: applyJob, isPending: isApplyPending } = useMutation({
    mutationFn: () => jobsAPI.applyJob(job.jsearch_id),
    onSuccess: (response: any) => {
      toast.success("Application submitted!")
      // Try to get apply_url from response, fallback to job object
      const applyUrl = response?.data?.apply_url || job.apply_url
      if (applyUrl) {
        window.open(applyUrl, "_blank")
      } else {
        toast.info("Job link not available, check your applications")
      }
      refetch()
    },
    onError: () => {
      toast.error("Failed to apply to job")
    },
  })

  return (
    <motion.div
      ref={cardRef}
      style={isMobile ? {} : { rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="group relative"
    >
      {/* Glow effect */}
      {!isMobile && (
        <div
          className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary via-accent to-primary opacity-0 blur-xl transition-opacity duration-500 ${isHovered ? "opacity-30" : ""}`}
        />
      )}

      {/* Card */}
      <div className="relative rounded-2xl border border-border bg-card/80 p-5 sm:p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/30">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Company logo placeholder */}
            <div className="flex h-10 sm:h-12 w-10 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl bg-secondary">
              <Building2 className="h-5 sm:h-6 w-5 sm:w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {job.job.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{job.job.company}</p>
            </div>
          </div>

          {/* Match score */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative h-12 sm:h-14 w-12 sm:w-14">
              <svg className="h-12 sm:h-14 w-12 sm:w-14 -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="oklch(0.25 0.03 265)"
                  strokeWidth="3"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke={matchStroke}
                  strokeWidth="3"
                  strokeDasharray={`${matchScore * 1.256} 125.6`}
                  className="transition-all duration-1000"
                />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-bold ${matchColor}`}>
                {matchScore}%
              </span>
            </div>
            <span className="mt-1 text-xs text-muted-foreground">Match</span>
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground line-clamp-2">
          {job.job.description}
        </p>

        {/* Meta info */}
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{job.job.location}</span>
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{salaryRange}</span>
          </span>
        </div>

        {/* Tags */}
        <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
          {job.job.is_remote && (
            <span className="rounded-full bg-neon-emerald/20 px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium text-neon-emerald">
              Remote
            </span>
          )}
          {job.job.job_type && (
            <span className="rounded-full bg-primary/20 px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium text-primary">
              {job.job.job_type}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button
            onClick={() => applyJob()}
            disabled={isApplyPending}
            className="flex-1 h-11 sm:h-auto bg-primary text-primary-foreground hover:bg-primary/90 text-sm sm:text-base"
          >
            {isApplyPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                Quick Apply
                <Sparkles className="ml-2 h-3 sm:h-4 w-3 sm:w-4" />
              </>
            )}
          </Button>
          <div className="flex gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => saveJob()}
              disabled={isSavePending}
              className={`flex-1 sm:flex-none h-11 sm:h-auto border-border ${isSaved ? "bg-primary/20 text-primary" : "bg-secondary/30 hover:bg-secondary/50"}`}
              aria-label={isSaved ? "Unsave job" : "Save job"}
              title={isSaved ? "Unsave job" : "Save job"}
            >
              {isSavePending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => dismissJob()}
              disabled={isDismissPending}
              className="flex-1 sm:flex-none h-11 sm:h-auto border-border bg-secondary/30 hover:bg-secondary/50"
              aria-label="Dismiss job"
              title="Dismiss job"
            >
              {isDismissPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* AI reasoning - shows on hover (desktop) or always (mobile) */}
        <motion.div
          initial={{ opacity: isMobile ? 1 : 0, height: isMobile ? "auto" : 0 }}
          animate={{
            opacity: isMobile || isHovered ? 1 : 0,
            height: isMobile || isHovered ? "auto" : 0
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="mt-3 sm:mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-primary">
              <Sparkles className="h-3 sm:h-4 w-3 sm:w-4 flex-shrink-0" />
              Why this matches you
            </div>
            <ul className="mt-2 space-y-1 text-xs sm:text-sm text-muted-foreground">
              {(job.match_reasons || []).slice(0, 3).map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary flex-shrink-0">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Fetch job matches
  const { data: matches, isLoading, error, refetch } = useQuery({
    queryKey: ["job-matches"],
    queryFn: async () => {
      try {
        const response = await jobsAPI.getMatches(50, 0, 60)
        // Handle both response.data and response directly
        const data = response?.data || response
        console.log('Matches API response:', data)
        // Ensure matches is an array
        if (data && typeof data === 'object') {
          return {
            matches: Array.isArray(data.matches) ? data.matches : Array.isArray(data) ? data : [],
            total: data.total || (Array.isArray(data) ? data.length : 0),
          }
        }
        return { matches: [], total: 0 }
      } catch (err: any) {
        console.error('Error fetching matches:', err)
        throw err
      }
    },
  })

  // Search jobs mutation
  const { mutate: searchJobs, isPending: isSearching } = useMutation({
    mutationFn: () => jobsAPI.search({ limit: 50 }),
    onSuccess: () => {
      toast.success("Search completed! Refreshing matches...")
      refetch()
    },
    onError: (error: any) => {
      const errorMsg =
        error?.response?.data?.detail ||
        "Requires API key in settings and preferences to search"
      toast.error(errorMsg)
    },
  })

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    )
  }

  // Client-side filtering by search query
  const filteredJobs = (matches?.matches || []).filter((job) => {
    const query = searchQuery.toLowerCase()
    return (
      job.job.title.toLowerCase().includes(query) ||
      job.job.company.toLowerCase().includes(query) ||
      job.job.description.toLowerCase().includes(query)
    )
  })

  const totalMatches = matches?.total || 0

  // Get error message for display
  const getErrorMessage = () => {
    if (!error) return null
    if (typeof error === 'string') return error
    if ((error as any)?.response?.data?.detail) return (error as any).response.data.detail
    if ((error as any)?.message) return (error as any).message
    return 'Failed to load job matches. Please try again.'
  }

  const errorMessage = getErrorMessage()

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 pb-20 lg:pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Job Matches
            </h1>
            <p className="mt-1 text-muted-foreground">
              AI-curated opportunities based on your profile
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl border border-border bg-card/80 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Job Matches
          </h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            AI-curated opportunities based on your profile
          </p>
        </div>
        <Button
          onClick={() => searchJobs()}
          disabled={isSearching}
          className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Search Jobs
            </>
          )}
        </Button>
      </div>

      {/* Match count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>{filteredJobs.length} matches found</span>
      </div>

      {/* Error state */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm"
        >
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Failed to load matches</p>
              <p className="mt-1 text-destructive/80">{errorMessage}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-3 border-destructive/20 text-destructive hover:bg-destructive/5"
              >
                Try Again
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search and Filters */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search jobs, companies, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 sm:h-12 bg-secondary/50 pl-10 border-border focus:border-primary text-sm"
            />
          </div>

          {/* Filter button */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="h-11 sm:h-12 border-border bg-secondary/30 hover:bg-secondary/50 flex-shrink-0"
          >
            <Filter className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Filters</span>
            {activeFilters.length > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {activeFilters.length}
              </span>
            )}
            <ChevronDown
              className={`ml-1 h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
            />
          </Button>
        </div>

        {/* Filter panel */}
        <motion.div
          initial={false}
          animate={{ height: showFilters ? "auto" : 0, opacity: showFilters ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(filters).map(([category, options]) => (
                <div key={category}>
                  <h3 className="mb-3 text-sm font-medium text-foreground capitalize">
                    {category.replace(/([A-Z])/g, " $1").trim()}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {options.map((option) => (
                      <button
                        key={option}
                        onClick={() => toggleFilter(option)}
                        className={`rounded-full px-3 py-1.5 text-xs sm:text-sm transition-colors min-h-[44px] sm:min-h-auto flex items-center justify-center ${
                          activeFilters.includes(option)
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Active filters */}
            {activeFilters.length > 0 && (
              <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {activeFilters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => toggleFilter(filter)}
                      className="flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1 text-xs sm:text-sm text-primary min-h-[44px] sm:min-h-auto"
                    >
                      {filter}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setActiveFilters([])}
                  className="text-left text-sm text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Empty state */}
      {!isLoading && filteredJobs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-dashed border-border bg-card/50 p-8 sm:p-12 text-center"
        >
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            No matches yet
          </h3>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground px-4">
            Set your preferences and click "Search Jobs" to find your matches.
          </p>
          <Button
            onClick={() => searchJobs()}
            disabled={isSearching}
            className="mt-6 w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Search Jobs
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Jobs Grid */}
      {filteredJobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2"
        >
          {filteredJobs.map((job, index) => (
            <motion.div
              key={job.jsearch_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <JobCard job={job} refetch={refetch} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
