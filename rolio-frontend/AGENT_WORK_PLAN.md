# Parallel Agent Work Plan

## Overview
5 agents will work independently on 5 dashboard pages simultaneously.
Each agent has complete autonomy over their assigned page file.
No file conflicts — each agent modifies exactly one page.tsx file.

---

## Agent 1: Jobs Page Implementation
**File**: `app/dashboard/jobs/page.tsx`
**Status**: PENDING

### Detailed Tasks:
1. Replace hardcoded jobs array with real API calls:
   - Import useQuery, useMutation from @tanstack/react-query
   - Import jobsAPI from @/src/lib/api
   - useQuery for getMatches (queryKey: ['job-matches'])
   - Show loading skeleton while fetching

2. Wire "Search Jobs" button:
   - useMutation for jobsAPI.search()
   - Show loading spinner during search
   - Update matches when search completes
   - Display error toast on failure

3. Replace hardcoded job cards with real data:
   - Map over matches.matches
   - Use job.jsearch_id for actions (NOT internal UUID)
   - Display: job.job.title, company, location, salary_min/max, is_remote
   - Show match_score with color coding (emerald >=90, cyan >=85, violet <85)
   - Show match_reasons in the hover panel

4. Wire save button:
   - useMutation for jobsAPI.saveJob(job.jsearch_id)
   - Toggle saved state
   - Refetch on success
   - Show success toast

5. Wire dismiss button:
   - useMutation for jobsAPI.dismissJob(job.jsearch_id)
   - Remove from visible list
   - Refetch on success

6. Wire "Quick Apply" button:
   - useMutation for jobsAPI.applyJob(job.jsearch_id)
   - Open apply_url in new tab
   - Show "Applied" state
   - Refetch on success

7. Wire search filter (client-side):
   - searchQuery state to filter by title/company/description

8. Empty state:
   - Show "No matches yet..." if no jobs
   - Add "Search Jobs" button link

9. Error handling:
   - Show toast: "Requires API key and preferences to search"
   - Show error messages for each action

### Reference Code Location:
- useQuery pattern: See IMPLEMENTATION_GUIDE.md section "Jobs Page"
- Error handling: See `app/login/page.tsx` for toast pattern
- API functions: `src/lib/api.ts` - jobsAPI object

---

## Agent 2: Settings Page Implementation
**File**: `app/dashboard/settings/page.tsx`
**Status**: PENDING

### Detailed Tasks:
1. API Keys Section:
   - useQuery for profileAPI.getApiKeys()
   - Display OpenAI and Anthropic cards
   - Show key_preview (masked format)
   - Show "Connected" (green) or "Not connected" (yellow) badge

2. Add API Key form:
   - useMutation for profileAPI.addApiKey()
   - Pass params as: provider, api_key, model_preference (optional), is_default
   - IMPORTANT: Use query params, not JSON body: 
     `axios.post(..., null, { params: { provider, api_key, ... } })`
   - Show success toast after adding
   - Refetch keys
   - Clear form after success

3. Delete API Key:
   - useMutation for profileAPI.deleteApiKey(provider)
   - Show confirmation alert
   - Refetch on success

4. Job Preferences Section:
   - useQuery for settingsAPI.getPreferences()
   - Load current: preferred_roles, preferred_locations, salary_min/max, remote_preference

5. Preferences Form:
   - Salary range slider: min/max inputs
   - Remote type dropdown: "remote", "hybrid", "onsite", "any"
   - Preferred roles: multi-select or tag input
   - Preferred locations: multi-select or tag input
   - Save button

6. Update Preferences:
   - useMutation for settingsAPI.updatePreferences()
   - IMPORTANT: Pass as query params:
     `axios.put(..., null, { params: { preferred_roles: [...], ... } })`
   - Convert salary numbers to strings before sending
   - Show success toast
   - Refetch on success

7. Notifications Section:
   - Local state (no backend): New Job Matches, Application Updates, Messages, Marketing
   - Toggle switches

8. Theme Section:
   - useTheme() from next-themes (already imported in layout)
   - 3 buttons: Dark (default), Light, System
   - Show which is selected

9. Account Section:
   - Show user email from authStore
   - Password change: placeholder link (backend doesn't have this)
   - Delete account: placeholder button (backend doesn't have this)

### Reference Code Location:
- useQuery/useMutation: IMPLEMENTATION_GUIDE.md "Settings Page"
- API quirk (query params): src/lib/api.ts settingsAPI section
- Theme: components/theme-provider.tsx shows how it's set up

---

## Agent 3: Resume Page Implementation
**File**: `app/dashboard/resume/page.tsx`
**Status**: PENDING

### Detailed Tasks:
1. Load Resume:
   - useQuery for resumeAPI.get()
   - useQuery for resumeAPI.getParsedData()
   - Show loading state

2. Upload Section:
   - Drag-and-drop zone OR file picker
   - useMutation for resumeAPI.upload(file)
   - Accept only PDF files
   - Show uploading spinner
   - On success: show parsed data, refetch

3. Overall Score Circle:
   - Calculate average of 3 scores
   - Color by score: emerald >=80, cyan >=60, pink <60
   - SVG circle progress (copy from Jobs page card)

4. Calculate & Display Three Metrics:
   - **ATS Compatibility**: 
     - Base 50 + 10 if name + 10 if email + 10 if phone + 10 if summary + 10 if work experience
     - Max 100, show in emerald
   
   - **Keyword Match**: 
     - (parsed_data.skills.length / 50) * 100, capped at 100
     - Show in cyan
   
   - **Impact Score**: 
     - 30 + (experience.length * 15) + (education.length * 10)
     - Max 100, show in primary color

   - Each with Progress bar component

5. Section Analysis Cards:
   - Display all 6 sections: Contact, Skills, Experience, Education, Languages, Certifications
   - For each, show:
     - CheckCircle2 (green) if present, AlertCircle (yellow) if missing
     - Section name + calculated score
     - Brief feedback text
   
   Status logic:
   - Contact: "Complete" if email present
   - Skills: "Strong" if > 5 skills, "Weak" if < 3
   - Experience: "Strong" if > 1 role
   - Education: "Complete" if degree present
   - Languages: "Complete" if > 1
   - Certifications: "Complete" if > 0

6. AI Suggestions Section:
   - 3 placeholder suggestions OR derive from parsed data gaps
   - "Add more certifications", "Expand skills section", etc.
   - "Apply suggestion" ghost button (placeholder action)

7. Resume Stats:
   - Word count: raw_text.split(' ').length
   - Read time: "~X min" = words / 200
   - Visibility boost: hardcoded "+34%" is fine

8. Empty State:
   - If no resume: "No resume uploaded. Upload a PDF to get started."
   - Show upload button

9. Re-analyze Button:
   - Just refetch parsed data (already analyzed on upload)
   - Show RefreshCw animate-spin icon during fetch

### Reference Code Location:
- useQuery/useMutation: IMPLEMENTATION_GUIDE.md "Resume Page"
- Progress bars: components/ui/progress.tsx
- SVG circle: See Jobs page job card for match_score circle code
- File upload: src/lib/api.ts resumeAPI.upload()

---

## Agent 4: Profile Page Implementation
**File**: `app/dashboard/profile/page.tsx`
**Status**: PENDING

### Detailed Tasks:
1. Load Data:
   - useQuery for profileAPI.get()
   - useQuery for resumeAPI.get() (for experience/education/skills)
   - Show loading state

2. Profile Header Card:
   - Avatar: gradient background with user initials
   - Avatar click → file picker for new image (optional enhancement)
   - Name: display user.full_name
   - Title: display user.full_name or "Professional" if not set
   - Email: display user.email
   - Location: display resume.parsed_data.location if available

3. Social Links:
   - Placeholder GitHub, LinkedIn, Globe icons
   - No backend storage needed, show as clickable placeholders

4. Edit Profile Button:
   - useMutation for profileAPI.update()
   - Modal or inline edit form
   - Fields: full_name
   - Optional: avatar_url (image upload)
   - Show success toast

5. About Section:
   - Display resume.parsed_data.summary or generic text
   - Edit ghost button → open modal to update profile

6. Experience Timeline:
   - Display resume.parsed_data.experience
   - For each: company, role, start_date to end_date, location, description
   - Vertical timeline layout with left border
   - Small dot at each entry

7. Education Section:
   - Display resume.parsed_data.education
   - For each: degree, field, institution, graduation_year, gpa (if available)
   - Similar card layout to experience

8. Skills Section:
   - Display resume.parsed_data.skills (array of strings)
   - For each skill: show as pill/badge
   - Add static progress bar showing "mastery" (80%, 90%, etc. - hardcoded per skill)
   - Example skills: React 95%, TypeScript 90%, Node.js 85%, Python 80%

9. Profile Stats:
   - Jobs matched: count from job matches API
   - Applications sent: count where user_action === 'applied'
   - Interviews scheduled: hardcoded placeholder (no backend tracking)

10. Empty States:
    - If no resume: "Upload a resume to see experience and education"
    - If no experience: "No work experience yet"

### Reference Code Location:
- useQuery/useMutation: IMPLEMENTATION_GUIDE.md "Profile Page"
- Form pattern: See register/login pages
- Timeline: Use border-l and position: relative for vertical line
- Profile API: src/lib/api.ts profileAPI object

---

## Agent 5: Dashboard Home Implementation
**File**: `app/dashboard/page.tsx`
**Status**: PENDING

### Detailed Tasks:
1. Load Data:
   - useQuery for jobsAPI.getMatches()
   - useQuery for resumeAPI.get() (for insights)
   - Show loading skeleton

2. Stats Grid (4 cards):
   - Replace hardcoded values with real data:
   
   **Card 1 - Jobs Matched**:
   - Value: matches.total || 0
   - Change: calculate from matches in last 7 days (or just "0")
   - Icon: Briefcase with violet gradient bg
   
   **Card 2 - Match Rate**:
   - Value: average of match_scores from all matches, formatted as "XX%"
   - Change: "0%" (hardcode is fine)
   - Icon: Target with blue gradient bg
   
   **Card 3 - Applications**:
   - Value: count of matches where user_action === 'applied'
   - Change: "0%" (hardcode is fine)
   - Icon: Send with cyan gradient bg
   
   **Card 4 - Profile Views**:
   - Value: hardcoded 342 (no backend tracking)
   - Change: hardcoded +28
   - Icon: Eye with emerald gradient bg

3. Header Greeting:
   - Time-based: "Good morning/afternoon/evening, {user.full_name}"
   - Get user from authStore
   - "Find New Jobs" CTA button → links to /dashboard/jobs

4. Top Job Matches Card:
   - useQuery for jobsAPI.getMatches(3) to get top 3
   - Display as list (not cards)
   - Each row: company logo, title, location, match score circle, salary range
   - Show "View all jobs" link → /dashboard/jobs

5. AI Insights Card:
   - 3 insights derived from resume data:
     - "Resume Strength: {ats_score}%"
     - "Skill Match: {keyword_match}%"
     - "Profile Completeness: {impact_score}%"
   - Each with Progress bar
   - Each with descriptive text
   - "Optimize Resume" button → /dashboard/resume

6. Empty State:
   - If no matches: "No jobs matched yet. Set up preferences in settings to get started."
   - If no resume: "Upload a resume to begin AI job matching."

7. Animations:
   - Keep existing Framer Motion stagger animations
   - Add loading skeleton if fetching

### Reference Code Location:
- useQuery pattern: IMPLEMENTATION_GUIDE.md "Dashboard Home"
- User data: useAuthStore()
- Stats cards: Current hardcoded array at top of file
- Match calculation: Average of match_scores

---

## Integration Checklist (After All Agents Complete)

- [ ] All pages load without console errors
- [ ] All API calls use correct endpoints and params
- [ ] All mutations refetch relevant data
- [ ] Error toasts appear on failures
- [ ] Loading states appear during requests
- [ ] Empty states display appropriately
- [ ] No hardcoded "John Doe" / test data remaining
- [ ] All forms submit correctly with correct params
- [ ] Query params used for API keys and preferences (not JSON body)
- [ ] jsearch_id used for job actions (not internal UUID)
- [ ] Authorization header automatically attached
- [ ] Token refresh works on 401

---

## Success Criteria

Each page should:
1. ✅ Load real data from backend APIs
2. ✅ Handle all user actions (save, delete, update, search)
3. ✅ Show appropriate loading/error/empty states
4. ✅ Display success/error toasts
5. ✅ Refetch data after mutations
6. ✅ Maintain existing animations and UI
7. ✅ Have NO console errors
8. ✅ Have NO TypeScript errors

---

## Files NOT to Modify

- `app/layout.tsx` — Already complete
- `app/login/page.tsx` — Already complete
- `app/register/page.tsx` — Already complete
- `app/dashboard/layout.tsx` — Already complete
- `src/lib/api.ts` — Already complete
- `src/store/authStore.ts` — Already complete
- Any component in `components/` — Not needed
- Landing page files — Not needed

---

## Files to Modify (One per Agent)

1. **Agent 1** → `app/dashboard/jobs/page.tsx`
2. **Agent 2** → `app/dashboard/settings/page.tsx`
3. **Agent 3** → `app/dashboard/resume/page.tsx`
4. **Agent 4** → `app/dashboard/profile/page.tsx`
5. **Agent 5** → `app/dashboard/page.tsx`

No overlapping files = no conflicts!
