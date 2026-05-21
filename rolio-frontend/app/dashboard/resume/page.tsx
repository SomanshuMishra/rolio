"use client"

import { useState, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { resumeAPI } from "@/src/lib/api"
import { toast } from "sonner"
import {
  FileText,
  Upload,
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Eye,
  Wand2,
  RefreshCw,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

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

interface ParsedData {
  name?: string
  email?: string
  phone?: string
  summary?: string
  skills?: string[]
  experience?: Array<any>
  education?: Array<any>
  languages?: string[]
  certifications?: Array<any>
}

interface ResumeData {
  raw_text?: string
  parsed_data?: ParsedData
}

export default function ResumePage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // Load resume data
  const { data: resume, isLoading: isLoadingResume } = useQuery({
    queryKey: ['resume'],
    queryFn: () => resumeAPI.get().then((res) => res.data as ResumeData),
  })

  const { data: parsedData, isLoading: isLoadingParsed } = useQuery({
    queryKey: ['resume-parsed'],
    queryFn: () => resumeAPI.getParsedData().then((res) => res.data as ParsedData),
  })

  // Upload mutation
  const { mutate: uploadResume, isPending: isUploading } = useMutation({
    mutationFn: (file: File) => resumeAPI.upload(file),
    onSuccess: () => {
      toast.success("Resume uploaded successfully!")
      queryClient.invalidateQueries({ queryKey: ['resume'] })
      queryClient.invalidateQueries({ queryKey: ['resume-parsed'] })
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Failed to upload resume"
      toast.error(message)
    },
  })

  // Re-analyze mutation
  const { mutate: reanalyze, isPending: isReanalyzing } = useMutation({
    mutationFn: () => resumeAPI.getParsedData(),
    onSuccess: () => {
      toast.success("Resume re-analyzed!")
      queryClient.invalidateQueries({ queryKey: ['resume-parsed'] })
    },
    onError: () => {
      toast.error("Failed to re-analyze resume")
    },
  })

  // Calculate metrics
  const calculateATSScore = (): number => {
    if (!parsedData) return 0
    let score = 50
    if (parsedData.name) score += 10
    if (parsedData.email) score += 10
    if (parsedData.phone) score += 10
    if (parsedData.summary) score += 10
    if (parsedData.experience && parsedData.experience.length > 0) score += 10
    return Math.min(score, 100)
  }

  const calculateKeywordMatch = (): number => {
    if (!parsedData?.skills) return 0
    const score = (parsedData.skills.length / 50) * 100
    return Math.min(score, 100)
  }

  const calculateImpactScore = (): number => {
    if (!parsedData) return 0
    const experienceCount = parsedData.experience?.length || 0
    const educationCount = parsedData.education?.length || 0
    const score = 30 + (experienceCount * 15) + (educationCount * 10)
    return Math.min(score, 100)
  }

  const atsScore = calculateATSScore()
  const keywordScore = calculateKeywordMatch()
  const impactScore = calculateImpactScore()
  const overallScore = Math.round((atsScore + keywordScore + impactScore) / 3)

  // Section analysis
  const sections = [
    {
      name: "Contact",
      status: parsedData?.email ? "complete" : "incomplete",
      feedback: parsedData?.email ? "Email is present" : "Add your contact email",
      icon: CheckCircle2,
    },
    {
      name: "Skills",
      status: (parsedData?.skills?.length || 0) > 5 ? "complete" : (parsedData?.skills?.length || 0) >= 3 ? "warning" : "incomplete",
      feedback: (parsedData?.skills?.length || 0) > 5 ? "Strong skills section" : (parsedData?.skills?.length || 0) > 0 ? `${parsedData.skills?.length} skills listed` : "Add relevant skills",
      icon: (parsedData?.skills?.length || 0) > 5 ? CheckCircle2 : AlertCircle,
    },
    {
      name: "Experience",
      status: (parsedData?.experience?.length || 0) > 1 ? "complete" : (parsedData?.experience?.length || 0) > 0 ? "warning" : "incomplete",
      feedback: (parsedData?.experience?.length || 0) > 1 ? "Multiple roles found" : (parsedData?.experience?.length || 0) > 0 ? "Add more work experience" : "No work experience listed",
      icon: (parsedData?.experience?.length || 0) > 1 ? CheckCircle2 : AlertCircle,
    },
    {
      name: "Education",
      status: (parsedData?.education?.length || 0) > 0 ? "complete" : "incomplete",
      feedback: parsedData?.education?.length ? "Education section complete" : "Add your education details",
      icon: (parsedData?.education?.length || 0) > 0 ? CheckCircle2 : AlertCircle,
    },
    {
      name: "Languages",
      status: (parsedData?.languages?.length || 0) > 1 ? "complete" : (parsedData?.languages?.length || 0) > 0 ? "warning" : "incomplete",
      feedback: (parsedData?.languages?.length || 0) > 1 ? "Multiple languages" : (parsedData?.languages?.length || 0) > 0 ? "Only one language" : "No languages listed",
      icon: (parsedData?.languages?.length || 0) > 1 ? CheckCircle2 : AlertCircle,
    },
    {
      name: "Certifications",
      status: (parsedData?.certifications?.length || 0) > 0 ? "complete" : "incomplete",
      feedback: parsedData?.certifications?.length ? "Certifications present" : "Add relevant certifications",
      icon: (parsedData?.certifications?.length || 0) > 0 ? CheckCircle2 : AlertCircle,
    },
  ]

  // AI suggestions
  const aiSuggestions = [
    {
      section: "Skills",
      suggestion: (parsedData?.skills?.length || 0) < 10 ? "Add more technical skills to improve keyword matching" : "Consider organizing skills by category",
    },
    {
      section: "Certifications",
      suggestion: (parsedData?.certifications?.length || 0) === 0 ? "Add relevant industry certifications to stand out" : "Highlight your top certifications",
    },
    {
      section: "Summary",
      suggestion: parsedData?.summary ? "Enhance with metrics and quantifiable achievements" : "Add a professional summary at the top",
    },
  ]

  // Word count and read time
  const wordCount = resume?.raw_text ? resume.raw_text.split(/\s+/).length : 0
  const readTime = Math.ceil(wordCount / 200)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type === "application/pdf") {
        uploadResume(file)
      } else {
        toast.error("Please upload a PDF file")
      }
    }
  }

  const handleDragAndDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type === "application/pdf") {
      uploadResume(file)
    } else {
      toast.error("Please upload a PDF file")
    }
  }

  const isLoading = isLoadingResume || isLoadingParsed
  const hasResume = resume?.raw_text && parsedData

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-20 lg:pb-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Resume Intelligence
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            AI-powered analysis and optimization for your resume
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
          <Button
            variant="outline"
            className="h-11 sm:h-auto border-border bg-secondary/30 hover:bg-secondary/50 text-sm sm:text-base"
            disabled
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button
            className="h-11 sm:h-auto bg-primary text-primary-foreground hover:bg-primary/90 text-sm sm:text-base"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload New
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !hasResume ? (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-12 text-center"
        >
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No resume uploaded</h3>
          <p className="mt-2 text-muted-foreground">Upload a PDF to get started with AI-powered resume analysis</p>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDragAndDrop}
            className="mt-6 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-8 cursor-pointer hover:border-primary/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 text-sm font-medium text-primary">Drag and drop your PDF here or click to browse</p>
          </div>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Left column - Resume preview */}
          <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Score card */}
            <div className="rounded-2xl border border-border bg-card/50 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Overall Score</h2>
                <Button
                  variant="outline"
                  onClick={() => reanalyze()}
                  disabled={isReanalyzing}
                  className="border-border bg-secondary/30 hover:bg-secondary/50"
                >
                  {isReanalyzing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Re-analyze
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
                {/* Score circle */}
                <div className="relative h-24 sm:h-32 w-24 sm:w-32 flex-shrink-0 mx-auto sm:mx-0">
                  <svg className="h-24 sm:h-32 w-24 sm:w-32 -rotate-90" viewBox="0 0 128 128">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="oklch(0.25 0.03 265)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke={overallScore >= 80 ? "oklch(0.7 0.18 155)" : overallScore >= 60 ? "oklch(0.78 0.12 195)" : "oklch(0.65 0.25 350)"}
                      strokeWidth="8"
                      strokeDasharray={`${overallScore * 3.52} 352`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl sm:text-3xl font-bold text-foreground">{overallScore}%</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">Score</span>
                  </div>
                </div>

                {/* Score breakdown */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">ATS Compatibility</span>
                    <span className={`font-medium ${atsScore >= 80 ? "text-neon-emerald" : atsScore >= 60 ? "text-neon-cyan" : "text-destructive"}`}>
                      {Math.round(atsScore)}%
                    </span>
                  </div>
                  <Progress value={atsScore} className="h-2 bg-secondary" />

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Keyword Match</span>
                    <span className={`font-medium ${keywordScore >= 80 ? "text-neon-emerald" : keywordScore >= 60 ? "text-neon-cyan" : "text-destructive"}`}>
                      {Math.round(keywordScore)}%
                    </span>
                  </div>
                  <Progress value={keywordScore} className="h-2 bg-secondary" />

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Impact Score</span>
                    <span className={`font-medium ${impactScore >= 80 ? "text-neon-emerald" : impactScore >= 60 ? "text-neon-cyan" : "text-destructive"}`}>
                      {Math.round(impactScore)}%
                    </span>
                  </div>
                  <Progress value={impactScore} className="h-2 bg-secondary" />
                </div>
              </div>
            </div>

            {/* Section breakdown */}
            <div className="rounded-2xl border border-border bg-card/50 p-6">
              <h2 className="text-lg font-semibold text-foreground">Section Analysis</h2>
              <div className="mt-4 space-y-4">
                {sections.map((section) => (
                  <div key={section.name} className="rounded-lg border border-border bg-secondary/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {section.status === "complete" ? (
                          <CheckCircle2 className="h-5 w-5 text-neon-emerald" />
                        ) : section.status === "warning" ? (
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        )}
                        <span className="font-medium text-foreground">{section.name}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground pl-8">{section.feedback}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right column - AI suggestions */}
          <motion.div variants={itemVariants} className="col-span-1 space-y-4 sm:space-y-6">
            {/* Quick stats */}
            <div className="rounded-2xl border border-border bg-card/50 p-6">
              <h2 className="text-lg font-semibold text-foreground">Resume Stats</h2>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Word count
                  </span>
                  <span className="font-semibold text-foreground">{wordCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    Read time
                  </span>
                  <span className="font-semibold text-foreground">~{readTime} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Visibility boost
                  </span>
                  <span className="font-semibold text-neon-emerald">+34%</span>
                </div>
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="rounded-2xl border border-border bg-card/50 p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">AI Suggestions</h2>
              </div>
              <div className="mt-4 space-y-4">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Wand2 className="h-4 w-4" />
                      {suggestion.section}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{suggestion.suggestion}</p>
                    <Button size="sm" variant="ghost" className="mt-2 h-8 text-primary hover:text-primary">
                      Apply suggestion
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimize CTA */}
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-6">
              <h3 className="font-semibold text-foreground">AI Resume Optimizer</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Let AI automatically enhance your resume for maximum impact and ATS compatibility.
              </p>
              <Button className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled>
                <Wand2 className="mr-2 h-4 w-4" />
                Optimize with AI
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
