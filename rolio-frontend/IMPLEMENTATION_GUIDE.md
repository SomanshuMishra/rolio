# Dashboard Pages Implementation Guide

This guide shows how to wire each dashboard page to the backend APIs. Follow the same pattern for consistency.

## Pattern: Form State + API Call + Error Handling

```tsx
'use client'
import { useQuery, useMutation } from '@tanstack/react-query'
import { jobsAPI } from '@/src/lib/api'

export default function Page() {
  // Fetch data
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobsAPI.getMatches(),
  })

  // Submit data
  const { mutate: saveJob } = useMutation({
    mutationFn: (jobId: string) => jobsAPI.saveJob(jobId),
    onSuccess: () => {
      // Show success toast
      // Refetch data
    },
  })
}
```

---

## Dashboard Home (`app/dashboard/page.tsx`)

**Replace hardcoded stats with real data:**

```tsx
const { data: matches } = useQuery({
  queryKey: ['job-matches'],
  queryFn: () => jobsAPI.getMatches(100), // Get all for counting
})

// Stats:
// - Jobs matched: matches.total || 0
// - Applications: matches.matches?.filter(m => m.user_action === 'applied').length || 0
// - Saved jobs: matches.matches?.filter(m => m.user_action === 'saved').length || 0
// - Match rate: (average of all match_scores).toFixed(0) + '%'

// Top jobs: matches.matches?.slice(0, 3) || []
```

---

## Jobs Page (`app/dashboard/jobs/page.tsx`)

**1. Wire job search button:**
```tsx
const { mutate: searchJobs, isPending: isSearching } = useMutation({
  mutationFn: (params) => jobsAPI.search(params),
  onSuccess: (data) => {
    // Show results
    setJobs(data.data.jobs)
    // Show "X matches found"
  },
  onError: (error) => {
    // Show error toast: "Requires API key in settings + preferences"
  },
})

const handleSearch = () => {
  searchJobs({ limit: 50 })
}
```

**2. Wire job list:**
```tsx
const { data: matches, refetch } = useQuery({
  queryKey: ['job-matches'],
  queryFn: () => jobsAPI.getMatches(20, 0, 60), // limit, offset, minScore
})

// Replace hardcoded jobs with matches.matches
// Show real match_score, match_reasons, company, salary_min/max, location, is_remote
```

**3. Wire save/dismiss/apply buttons:**
```tsx
const { mutate: saveJob } = useMutation({
  mutationFn: (jobId: string) => jobsAPI.saveJob(jobId),
  onSuccess: () => refetch(),
})

const { mutate: dismissJob } = useMutation({
  mutationFn: (jobId: string) => jobsAPI.dismissJob(jobId),
  onSuccess: () => refetch(),
})

const { mutate: applyJob } = useMutation({
  mutationFn: (jobId: string) => jobsAPI.applyJob(jobId),
  onSuccess: (data) => {
    // Open data.data.apply_url in new tab
    window.open(data.data.apply_url, '_blank')
    refetch()
  },
})

// Use job.jsearch_id (external ID) not internal UUID
<button onClick={() => saveJob(job.jsearch_id)}>Save</button>
```

**4. Wire search filters:**
```tsx
// Client-side filtering:
const filtered = (matches.matches || []).filter(job =>
  (searchQuery === '' || 
    job.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.job.company.toLowerCase().includes(searchQuery.toLowerCase()))
)
```

**5. Empty state:**
```tsx
{!matches?.matches?.length && (
  <div className="text-center py-12">
    <p>No matches yet. Set your preferences and click Search Jobs to get started.</p>
  </div>
)}
```

---

## Resume Page (`app/dashboard/resume/page.tsx`)

**1. Load resume data:**
```tsx
const { data: resume, isLoading } = useQuery({
  queryKey: ['resume'],
  queryFn: () => resumeAPI.get(),
})

const { data: parsedData } = useQuery({
  queryKey: ['resume-parsed'],
  queryFn: () => resumeAPI.getParsedData(),
})

// Show parsed_data.skills, experience[], education[]
// Calculate metrics:
// - ATS Compatibility: 80 + (10 if name) + (5 if email) + (5 if phone) = max 100
// - Keyword Match: (parsed_data.skills.length / 50) * 100
// - Impact Score: (experience.length + education.length) * 10 + 50
```

**2. Upload resume:**
```tsx
const { mutate: uploadResume, isPending } = useMutation({
  mutationFn: (file: File) => resumeAPI.upload(file),
  onSuccess: (data) => {
    // Show parsed data
    refetch()
  },
})

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (file && file.type === 'application/pdf') {
    uploadResume(file)
  } else {
    showError('Please upload a PDF file')
  }
}
```

**3. Display sections:**
```tsx
const sections = [
  {
    name: 'Contact Info',
    status: parsedData?.email ? 'complete' : 'incomplete',
    fields: [`Email: ${parsedData?.email}`, `Phone: ${parsedData?.phone}`]
  },
  {
    name: 'Skills',
    status: (parsedData?.skills?.length || 0) > 3 ? 'complete' : 'incomplete',
    fields: parsedData?.skills || []
  },
  {
    name: 'Experience',
    status: (parsedData?.experience?.length || 0) > 0 ? 'complete' : 'incomplete',
  },
  {
    name: 'Education',
    status: (parsedData?.education?.length || 0) > 0 ? 'complete' : 'incomplete',
  },
]
```

---

## Profile Page (`app/dashboard/profile/page.tsx`)

**1. Load user profile:**
```tsx
const { data: profile } = useQuery({
  queryKey: ['profile'],
  queryFn: () => profileAPI.get(),
})

const { data: resume } = useQuery({
  queryKey: ['resume'],
  queryFn: () => resumeAPI.get(),
})

// Show profile.user.full_name, avatar_url
// Experience/Education from resume.parsed_data.experience/education
// Skills from resume.parsed_data.skills
```

**2. Edit profile:**
```tsx
const { mutate: updateProfile } = useMutation({
  mutationFn: (data: { full_name?: string; avatar_url?: string | null }) =>
    profileAPI.update(data),
  onSuccess: () => refetch(),
})

const handleUpdate = (fullName: string, avatarUrl: string) => {
  updateProfile({ full_name: fullName, avatar_url: avatarUrl })
}
```

**3. Display resume sections:**
```tsx
{resume?.parsed_data?.experience?.map(exp => (
  <ExperienceCard
    key={exp.company}
    company={exp.company}
    role={exp.role}
    duration={`${exp.start_date} - ${exp.end_date}`}
    description={exp.description}
  />
))}

{resume?.parsed_data?.education?.map(edu => (
  <EducationCard
    key={edu.institution}
    degree={edu.degree}
    field={edu.field}
    institution={edu.institution}
    year={edu.graduation_year}
  />
))}
```

---

## Settings Page (`app/dashboard/settings/page.tsx`)

**1. API Keys section:**
```tsx
const { data: apiKeys } = useQuery({
  queryKey: ['api-keys'],
  queryFn: () => profileAPI.getApiKeys(),
})

const { mutate: addApiKey } = useMutation({
  mutationFn: (data: { provider: string; apiKey: string; isDefault: boolean }) =>
    profileAPI.addApiKey(data.provider, data.apiKey, undefined, data.isDefault),
  onSuccess: () => refetch(),
})

const { mutate: deleteApiKey } = useMutation({
  mutationFn: (provider: string) => profileAPI.deleteApiKey(provider),
  onSuccess: () => refetch(),
})

// Show key_preview (masked like "sk-...4abc")
// Show provider badge: "Connected" (green) or "Not connected" (yellow)
```

**2. Preferences section:**
```tsx
const { data: preferences } = useQuery({
  queryKey: ['preferences'],
  queryFn: () => settingsAPI.getPreferences(),
})

const { mutate: updatePreferences } = useMutation({
  mutationFn: (data) => settingsAPI.updatePreferences(data),
  onSuccess: () => refetch(),
})

// Salary slider: min/max (convert to strings before sending)
// Remote preference dropdown: "remote", "hybrid", "onsite", "any"
// Preferred roles: multi-select
// Preferred locations: multi-select

const handleSavePreferences = () => {
  updatePreferences({
    preferred_roles: roles,
    preferred_locations: locations,
    salary_min: salaryMin.toString(),
    salary_max: salaryMax.toString(),
    remote_preference: remoteType,
  })
}
```

**3. Other settings:**
- Notifications: Local state (no backend endpoint)
- Theme: Wire to next-themes (already imported)
- Delete account: Placeholder (backend doesn't have this endpoint)

---

## Key Patterns

### Error Handling:
```tsx
{error && (
  <div className="rounded-lg bg-destructive/10 p-3 text-destructive">
    {error}
  </div>
)}
```

### Loading State:
```tsx
{isLoading ? (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
) : (
  // Content
)}
```

### Success Toast:
Use `sonner` which is already installed:
```tsx
import { toast } from 'sonner'

toast.success('Profile updated!')
toast.error('Something went wrong')
```

---

## Testing Checklist

After implementing each page:
- [ ] Data loads and displays
- [ ] Mutations work (save, delete, update)
- [ ] Error states show correct messages
- [ ] Loading states appear during requests
- [ ] Empty states display appropriately
- [ ] Refetch works after mutations
- [ ] No console errors

---

## Notes

- All API functions are exported from `/src/lib/api.ts`
- QueryClient is already set up in `src/providers/QueryProvider.tsx`
- JWT tokens are automatically attached by axios interceptor
- Token refresh happens automatically on 401
- Zustand store handles auth state persistence
