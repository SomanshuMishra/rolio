// API Response Types

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: string
  is_active: boolean
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
  token_type: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface ParsedResumeData {
  name?: string
  email?: string
  phone?: string
  location?: string
  summary?: string
  skills: string[]
  languages: string[]
  certifications: string[]
  experience: Experience[]
  education: Education[]
}

export interface Experience {
  company?: string
  role?: string
  start_date?: string
  end_date?: string
  location?: string
  description?: string
  skills_used?: string[]
}

export interface Education {
  degree?: string
  field?: string
  institution?: string
  graduation_year?: number
  gpa?: number
}

export interface ResumeResponse {
  id: string
  filename: string
  s3_file_path: string
  upload_date: string
  parsed_data: ParsedResumeData
  raw_text?: string
}

export interface Job {
  id: string
  jsearch_id: string
  title: string
  company: string
  location: string
  is_remote: boolean
  salary_min?: number
  salary_max?: number
  description?: string
  requirements?: string[]
  apply_url: string
  posted_at?: string
  match_score?: number
  match_reasons?: string[]
  matching_skills?: string[]
  salary_match?: boolean
  location_match?: boolean
}

export interface JobSearchResponse {
  search_id: string
  total_matches: number
  matches_returned: number
  processing_time_ms: number
  jobs: Job[]
}

export interface JobMatches {
  total: number
  limit: number
  offset: number
  matches: JobMatchWithAction[]
}

export interface JobMatchWithAction {
  match_id: string
  job: Job
  match_score: number
  match_reasons: string[]
  user_action?: string
  created_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  preferred_roles: string[]
  preferred_locations: string[]
  salary_min?: string
  salary_max?: string
  remote_preference: string
  years_of_experience?: string
  created_at: string
  updated_at: string
}

export interface APIKey {
  id: string
  provider: string
  model_preference?: string
  created_at: string
  key_preview: string
}
