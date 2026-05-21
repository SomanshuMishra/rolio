# Local Testing Guide — Before Any Git Commits

**Important**: Test everything locally first. Only commit after verifying all features work.

---

## 1. SETUP

### Terminal 1 — Start Backend
```bash
cd /Users/somanshumishra/myspace/auto-apply-jobs/backend
python -m uvicorn app.main:app --reload
```
✅ Should output: `Uvicorn running on http://127.0.0.1:8000`

### Terminal 2 — Start Frontend
```bash
cd /Users/somanshumishra/myspace/auto-apply-jobs/rolio-frontend
npm install  # Only if not done already
npm run dev
```
✅ Should output: `▲ Next.js 16.2.6`  
✅ Opens on `http://localhost:3000`

---

## 2. DESKTOP TESTING (1024px+)

### Register & Login
```
1. Visit http://localhost:3000
2. Click "Get Started"
3. Enter name, email, password (8+ chars)
4. Click "Create Account"
   ✅ Should redirect to /dashboard
   ✅ Sidebar shows your name and initials
   ✅ No console errors
```

### Add API Key (in Settings)
```
1. Sidebar → Settings
2. Scroll to "API Keys" section
3. Enter:
   - Provider: openai
   - API Key: sk-proj-test12345 (or real key)
4. Click "Add Key"
   ✅ Key appears in list
   ✅ Shows as "Connected"
```

### Set Preferences (in Settings)
```
1. Scroll to "Job Preferences"
2. Set:
   - Salary: $100k - $200k
   - Remote: "Remote"
   - Roles: Add "Engineer", "Developer"
   - Locations: Add "San Francisco", "NYC"
3. Click "Save Preferences"
   ✅ Toast shows "Saved successfully"
   ✅ Values persist on page reload
```

### Upload Resume (in Resume page)
```
1. Sidebar → Resume
2. Find a PDF file or create one
3. Drag and drop OR click to select
4. Wait for parsing
   ✅ Shows parsed data (contact, skills, experience)
   ✅ Shows 3 scores (ATS, Keyword Match, Impact)
   ✅ Shows 6 section cards
```

### Search Jobs (in Jobs page)
```
1. Sidebar → Jobs
   ✅ Should show existing matches (or empty state)
2. Click "Search Jobs" button
   ✅ Loading spinner appears
   ✅ Jobs load from API
   ✅ Shows job cards with:
     - Company name
     - Job title
     - Location
     - Salary range
     - Match score (colored circle)
     - Match reasons on hover
```

### Job Actions (still in Jobs page)
```
1. On a job card, click:
   - Bookmark icon (save job)
     ✅ Changes color, shows "Saved"
   - X icon (dismiss job)
     ✅ Job disappears from list
   - "Apply" button
     ✅ Opens job URL in new tab
```

### Profile Page
```
1. Sidebar → Profile
   ✅ Shows your name from registration
   ✅ Shows email
   ✅ Shows avatar with initials
   ✅ Shows experience/education from resume
   ✅ Shows skills
```

### Dashboard Home
```
1. Sidebar → Dashboard (or click ROLIO logo)
   ✅ Shows 4 stat cards:
     - Jobs Matched
     - Match Rate %
     - Applications
     - Profile Views
   ✅ Shows top 3 jobs
   ✅ Shows AI insights (3 progress bars)
```

### Logout
```
1. Click user avatar in sidebar (bottom)
   ✅ Should logout
   ✅ Redirects to /login
   ✅ Sidebar hidden
```

---

## 3. MOBILE TESTING (320px - 480px)

### Device Size Simulation
In Chrome DevTools:
```
1. Press F12 to open DevTools
2. Click device icon (toggle device toolbar)
3. Select "iPhone 12/13" or "iPhone SE"
4. Resize to 375px width
```

### Jobs Page (Mobile)
```
1. Go to /dashboard/jobs
   ✅ Job cards show in SINGLE COLUMN (not 2)
   ✅ Search bar full-width
   ✅ Buttons stacked properly
   ✅ No horizontal scroll
   ✅ 3D effects disabled (no tilt)
   ✅ Text readable
   ✅ Buttons clickable (not too small)
```

### Resume Page (Mobile)
```
1. Go to /dashboard/resume
   ✅ Sections stack vertically
   ✅ Upload area full-width
   ✅ Progress circles responsive
   ✅ All text readable
   ✅ No overflow
```

### Profile Page (Mobile)
```
1. Go to /dashboard/profile
   ✅ Profile info stacks
   ✅ Avatar properly sized
   ✅ Timeline readable
   ✅ Skills list flows properly
```

### Settings Page (Mobile)
```
1. Go to /dashboard/settings
   ✅ Forms full-width
   ✅ Inputs properly sized
   ✅ Sections stack
   ✅ Toggle switches clickable
   ✅ No horizontal scroll
```

### Dashboard Home (Mobile)
```
1. Go to /dashboard
   ✅ Stats in SINGLE COLUMN (not 4)
   ✅ Cards responsive
   ✅ All readable
```

### Bottom Navigation (Mobile)
```
1. On mobile, check bottom nav
   ✅ 5 nav items visible
   ✅ Icons only (no labels)
   ✅ 60px tall (touch-friendly)
   ✅ Clickable and responsive
```

---

## 4. TABLET TESTING (640px - 1024px)

### Layout Changes
```
1. Resize to iPad size (768px)
2. Check each page:
   ✅ Jobs: 1-2 columns (responsive)
   ✅ Resume: Sections in 2 columns
   ✅ Settings: Forms 2 columns
   ✅ Dashboard: Stats 2-4 columns
   ✅ All readable, no overflow
```

---

## 5. JOBS PAGE SPECIFIC TESTING

### Data Display Fix Verification
```
1. Make sure you have:
   - Valid API key in Settings
   - Preferences set in Settings
   
2. Go to /dashboard/jobs
3. Check:
   ✅ Jobs load from API (not empty)
   ✅ Job cards visible with data
   ✅ Match scores show (colored)
   ✅ Company names correct
   ✅ Job titles correct
   
4. If jobs don't show:
   - Check browser console (F12 → Console)
   - Look for error messages
   - Check API call in Network tab (F12 → Network)
   - Report exact error
```

### Error Handling
```
1. Clear API key in Settings
2. Try "Search Jobs"
   ✅ Should show error toast:
     "Requires API key in settings..."
   
3. Add invalid API key
4. Try "Search Jobs"
   ✅ Should show error from API
```

### Search & Filter
```
1. Search for "Engineer" in jobs
   ✅ Filters to matching jobs only
   
2. Click "Filters"
   ✅ Filter panel opens
   
3. Select filter options
   ✅ Jobs update (client-side filtering)
   
4. Clear filters
   ✅ Back to all jobs
```

---

## 6. BROWSER CONSOLE CHECK

**Critical**: Check for console errors

```
1. Press F12 to open DevTools
2. Go to "Console" tab
3. Test all pages
   ✅ NO red errors
   ✅ NO TypeScript errors
   ✅ Only normal logs OK
```

### Common Issues & Fixes

**Issue**: "Cannot find module '@/...'"
- Fix: Run `npm install` again

**Issue**: "jobsAPI is undefined"
- Fix: Check that `src/lib/api.ts` exists and imports are correct

**Issue**: Jobs page shows empty despite API data
- Fix: This should be fixed now, but if still broken:
  - Check Network tab for API response
  - Verify response format
  - Report exact API response

**Issue**: Mobile layout broken
- Fix: Check for horizontal scroll
  - Use DevTools to find overflow elements
  - Report which element is overflowing

---

## 7. TESTING CHECKLIST

### Functionality
- [ ] Register works
- [ ] Login works
- [ ] Can add API key
- [ ] Can set preferences
- [ ] Can upload resume
- [ ] Can search jobs (jobs display!)
- [ ] Can save/dismiss/apply jobs
- [ ] Can edit profile
- [ ] Can logout

### Desktop (1024px+)
- [ ] 2-column job cards
- [ ] 4-column stats
- [ ] All elements visible
- [ ] Hover effects work
- [ ] 3D card effects work

### Mobile (375px)
- [ ] 1-column job cards
- [ ] 1-column stat cards
- [ ] No horizontal scroll
- [ ] All text readable
- [ ] Buttons clickable (44px+)
- [ ] Bottom nav visible
- [ ] 3D effects disabled

### Tablet (768px)
- [ ] 2-column cards
- [ ] Responsive grid
- [ ] All readable
- [ ] No overflow

### Console
- [ ] No red errors
- [ ] No TypeScript errors
- [ ] Network tab shows successful API calls

---

## 8. WHAT TO REPORT IF ISSUES

If you find any issues, please report:

```
Issue: [Brief description]
  Browser: Chrome/Firefox/Safari
  Size: Desktop/Mobile/Tablet
  Page: /dashboard/jobs (or which page)
  Steps to reproduce:
    1. ...
    2. ...
    3. ...
  Expected: [What should happen]
  Actual: [What actually happens]
  Console error: [If any]
```

---

## 9. WHEN EVERYTHING WORKS

Once all tests pass:
1. ✅ Jobs display correctly
2. ✅ Mobile responsive works
3. ✅ No console errors
4. ✅ All features functional

**Then** we can commit with git!

---

## 10. QUICK REFERENCE

### Start Dev Servers
```bash
# Terminal 1 - Backend
cd backend && python -m uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd rolio-frontend && npm run dev
```

### Test Flow
```
1. Register & login
2. Add API key in Settings
3. Set preferences in Settings
4. Upload resume in Resume page
5. Search jobs in Jobs page
6. Test on mobile (DevTools)
7. Check console for errors
8. Report any issues
```

### Key URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- DevTools: F12

---

**Ready to test?** 🚀

Let me know what you find, and we'll fix any issues before committing!
