"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useQuery, useMutation } from "@tanstack/react-query"
import {
  User,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  Edit3,
  Plus,
  Github,
  Linkedin,
  Globe,
  Award,
  TrendingUp,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { profileAPI, resumeAPI, jobsAPI } from "@/lib/api"
import { useAuthStore } from "@/src/store/authStore"

// Hardcoded skill mastery levels (mapped to skill names from resume)
const skillMasteryMap: Record<string, number> = {
  React: 95,
  TypeScript: 90,
  "Node.js": 85,
  Python: 80,
  "Machine Learning": 75,
  "System Design": 82,
  JavaScript: 88,
  "Next.js": 92,
  "SQL": 85,
  "MongoDB": 80,
}

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

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editFullName, setEditFullName] = useState(user?.full_name || "")

  // Fetch profile data
  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileAPI.get(),
  })

  // Fetch resume data
  const { data: resume, isLoading: isResumeLoading } = useQuery({
    queryKey: ["resume"],
    queryFn: () => resumeAPI.get(),
  })

  // Fetch job matches for stats
  const { data: matches, isLoading: isMatchesLoading } = useQuery({
    queryKey: ["job-matches"],
    queryFn: () => jobsAPI.getMatches(100),
  })

  // Update profile mutation
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useMutation({
    mutationFn: (data: { full_name?: string; avatar_url?: string | null }) =>
      profileAPI.update(data),
    onSuccess: () => {
      setIsEditingProfile(false)
      refetchProfile()
    },
  })

  const handleSaveProfile = () => {
    if (editFullName.trim()) {
      updateProfile({ full_name: editFullName })
    }
  }

  // Extract data from APIs
  const profileData = profile?.data?.user || user
  const resumeData = resume?.data
  const parsedData = resumeData?.parsed_data || {}

  // Get initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Calculate stats
  const jobsMatched = matches?.data?.total || 0
  const applicationsCount =
    matches?.data?.matches?.filter((m: any) => m.user_action === "applied").length || 0
  const interviewsCount = 5 // Hardcoded placeholder

  // Get location from resume if available
  const location = parsedData?.location || ""

  // Get skills with mastery levels
  const skillsWithMastery = (parsedData?.skills || []).map((skill: string) => ({
    name: skill,
    level: skillMasteryMap[skill] || 75, // Default to 75 if not in map
  }))

  // Filter out empty skills
  const filteredSkills = skillsWithMastery.filter((s) => s.name && s.name.trim())

  const isLoading = isProfileLoading || isResumeLoading || isMatchesLoading

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-20 lg:pb-6"
    >
      {/* Header Card */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-border bg-card/50"
      >
        {/* Background gradient */}
        <div
          className="absolute inset-0 h-32"
          style={{
            background: `
              linear-gradient(135deg, oklch(0.62 0.25 290 / 0.3) 0%, oklch(0.75 0.15 200 / 0.2) 50%, oklch(0.65 0.25 350 / 0.2) 100%)
            `,
          }}
        />

        <div className="relative p-4 pt-16 sm:p-6 sm:pt-20 lg:p-8 lg:pt-24">
          <div className="flex flex-col gap-4 sm:gap-6 sm:flex-row sm:items-end sm:justify-between">
            {/* Avatar and basic info */}
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end items-center sm:items-stretch">
              <div className="relative -mt-12 sm:-mt-16 lg:-mt-20">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-background bg-gradient-to-br from-primary to-accent text-2xl font-bold text-primary-foreground sm:h-24 sm:w-24 sm:text-3xl lg:h-32 lg:w-32 lg:text-4xl">
                  {getInitials(profileData?.full_name)}
                </div>
                <button className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90">
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
              <div>
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 w-32 bg-secondary rounded animate-pulse" />
                    <div className="h-5 w-48 bg-secondary rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                      {profileData?.full_name || "User"}
                    </h1>
                    <p className="text-lg text-primary">Professional</p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {location}
                        </span>
                      )}
                      {profileData?.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {profileData.email}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <Button
                variant="outline"
                className="h-10 sm:h-auto border-border bg-secondary/30 hover:bg-secondary/50 text-xs sm:text-sm"
                onClick={() => {
                  setEditFullName(profileData?.full_name || "")
                  setIsEditingProfile(true)
                }}
                disabled={isLoading}
              >
                <Edit3 className="mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Social links */}
          <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary/30 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary">
              <Github className="h-5 w-5" />
            </a>
            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary/30 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary/30 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary">
              <Globe className="h-5 w-5" />
            </a>
          </div>
        </div>
      </motion.div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsEditingProfile(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6"
          >
            <h2 className="text-xl font-bold text-foreground mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditingProfile(false)}
                  disabled={isUpdatingProfile}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isUpdatingProfile || !editFullName.trim()}
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left column */}
        <div className="col-span-1 lg:col-span-2 space-y-4 sm:space-y-6">
          {/* About */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-border bg-card/50 p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">About</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                <Edit3 className="mr-1 h-4 w-4" />
                Edit
              </Button>
            </div>
            {isLoading ? (
              <div className="mt-4 space-y-2">
                <div className="h-4 w-full bg-secondary rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-secondary rounded animate-pulse" />
              </div>
            ) : parsedData?.summary ? (
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {parsedData.summary}
              </p>
            ) : (
              <p className="mt-4 text-muted-foreground italic">
                No summary available. Upload a resume to see your professional summary.
              </p>
            )}
          </motion.div>

          {/* Experience */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-border bg-card/50 p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Experience</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>
            {isLoading ? (
              <div className="mt-4 space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-32 bg-secondary rounded animate-pulse" />
                    <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : parsedData?.experience && parsedData.experience.length > 0 ? (
              <div className="mt-4 space-y-6">
                {parsedData.experience.map((exp: any, index: number) => (
                  <div key={index} className="relative pl-6 border-l-2 border-border">
                    <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary" />
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{exp.role || exp.title || "Role"}</h3>
                        <p className="text-sm text-primary">{exp.company}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {exp.start_date && exp.end_date && `${exp.start_date} - ${exp.end_date}`}
                      </span>
                    </div>
                    {exp.location && (
                      <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {exp.location}
                      </p>
                    )}
                    {exp.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-muted-foreground italic">
                No work experience yet. Upload a resume to see your experience.
              </p>
            )}
          </motion.div>

          {/* Education */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-border bg-card/50 p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Education</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>
            {isLoading ? (
              <div className="mt-4 space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-40 bg-secondary rounded animate-pulse" />
                    <div className="h-4 w-32 bg-secondary rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : parsedData?.education && parsedData.education.length > 0 ? (
              <div className="mt-4 space-y-4">
                {parsedData.education.map((edu: any, index: number) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {edu.degree}
                          </h3>
                          <p className="text-sm text-primary">{edu.institution}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {edu.graduation_year}
                        </span>
                      </div>
                      {edu.field && (
                        <p className="mt-1 text-sm text-muted-foreground">{edu.field}</p>
                      )}
                      {edu.gpa && (
                        <p className="mt-1 text-sm text-muted-foreground">GPA: {edu.gpa}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-muted-foreground italic">
                No education records yet. Upload a resume to see your education.
              </p>
            )}
          </motion.div>
        </div>

        {/* Right column */}
        <div className="col-span-1 space-y-4 sm:space-y-6">
          {/* Skills */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-border bg-card/50 p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Skills</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                <Edit3 className="mr-1 h-4 w-4" />
                Edit
              </Button>
            </div>
            {isLoading ? (
              <div className="mt-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
                    <div className="h-2 w-full bg-secondary rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : filteredSkills.length > 0 ? (
              <div className="mt-4 space-y-4">
                {filteredSkills.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{skill.name}</span>
                      <span className="text-muted-foreground">{skill.level}%</span>
                    </div>
                    <Progress value={skill.level} className="mt-2 h-2 bg-secondary" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-muted-foreground italic text-sm">
                No skills yet. Upload a resume to see your skills.
              </p>
            )}
          </motion.div>

          {/* Profile stats */}
          <motion.div
            variants={itemVariants}
            className="rounded-2xl border border-border bg-card/50 p-6"
          >
            <h2 className="text-lg font-semibold text-foreground">Profile Stats</h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  Jobs matched
                </span>
                {isLoading ? (
                  <div className="h-4 w-8 bg-secondary rounded animate-pulse" />
                ) : (
                  <span className="font-semibold text-foreground">{jobsMatched}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Applications sent
                </span>
                {isLoading ? (
                  <div className="h-4 w-8 bg-secondary rounded animate-pulse" />
                ) : (
                  <span className="font-semibold text-foreground">{applicationsCount}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="h-4 w-4" />
                  Interviews scheduled
                </span>
                <span className="font-semibold text-foreground">{interviewsCount}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
