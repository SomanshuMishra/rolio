# API Reference

**Base URL**: `http://localhost:8000/api`

All authenticated endpoints require `Authorization: Bearer <access_token>` header.

---

## Authentication Endpoints

### POST /auth/register
Register new user account.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "secure_password_min_8_chars",
  "full_name": "John Doe"
}
```

**Response** (200):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2024-05-20T10:00:00Z"
  },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

**Errors**:
- `409`: Email already exists
- `400`: Invalid email or weak password

---

### POST /auth/login
Login with email and password.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "secure_password_min_8_chars"
}
```

**Response** (200):
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

**Errors**:
- `401`: Invalid credentials
- `404`: User not found

---

### POST /auth/refresh
Refresh expired access token.

**Request**:
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response** (200):
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

**Errors**:
- `401`: Invalid or revoked refresh token
- `400`: Missing refresh_token

---

### POST /auth/logout
Revoke refresh token (logout).

**Response** (200):
```json
{
  "message": "Successfully logged out"
}
```

---

## Profile Endpoints

### GET /profile
Get current user's profile.

**Response** (200):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://s3.amazonaws.com/...",
    "created_at": "2024-05-20T10:00:00Z"
  },
  "preferences": {
    "id": "uuid",
    "preferred_roles": ["Backend Engineer", "Full Stack Engineer"],
    "preferred_locations": ["San Francisco", "Remote"],
    "salary_min": 100000,
    "salary_max": 200000,
    "remote_preference": "remote",
    "years_of_experience": 5
  }
}
```

---

### PUT /profile
Update user profile (name, avatar).

**Request**:
```json
{
  "full_name": "John Doe Updated",
  "avatar_url": "https://s3.amazonaws.com/..."
}
```

**Response** (200): Updated user object.

---

### POST /profile/api-keys
Add encrypted API key for OpenAI or Claude.

**Request**:
```json
{
  "provider": "openai",
  "api_key": "sk-...",
  "model_preference": "gpt-4"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "provider": "openai",
  "model_preference": "gpt-4",
  "created_at": "2024-05-20T10:00:00Z",
  "key_preview": "sk-...****"
}
```

**Errors**:
- `400`: Invalid provider (must be "openai" or "anthropic")
- `400`: Invalid API key format
- `409`: API key for this provider already exists

---

### DELETE /profile/api-keys/{provider}
Remove API key.

**Parameters**:
- `provider`: "openai" or "anthropic"

**Response** (200):
```json
{
  "message": "API key deleted successfully"
}
```

---

### GET /profile/api-keys
List all stored API key providers (no actual keys returned).

**Response** (200):
```json
{
  "api_keys": [
    {
      "provider": "openai",
      "model_preference": "gpt-4",
      "created_at": "2024-05-20T10:00:00Z",
      "key_preview": "sk-...****"
    }
  ]
}
```

---

## Resume Endpoints

### POST /resume/upload
Upload and parse resume PDF.

**Request**: Multipart form-data
- `file`: PDF file (max 10MB)

**Response** (201):
```json
{
  "resume": {
    "id": "uuid",
    "filename": "resume.pdf",
    "s3_file_path": "resumes/user123/resume.pdf",
    "upload_date": "2024-05-20T10:00:00Z",
    "parsed_data": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1-555-0123",
      "location": "San Francisco, CA",
      "summary": "Experienced backend engineer with 5+ years...",
      "skills": ["Python", "FastAPI", "PostgreSQL", "AWS", "React"],
      "experience": [
        {
          "company": "TechCorp",
          "role": "Senior Backend Engineer",
          "start_date": "2020-01",
          "end_date": "present",
          "description": "Led backend architecture redesign...",
          "skills_used": ["Python", "FastAPI", "PostgreSQL"]
        }
      ],
      "education": [
        {
          "degree": "Bachelor of Science",
          "field": "Computer Science",
          "institution": "University of California",
          "graduation_year": 2018,
          "gpa": 3.8
        }
      ],
      "certifications": ["AWS Solutions Architect", "Kubernetes CKA"]
    },
    "raw_text": "John Doe\n..."
  }
}
```

**Errors**:
- `400`: Invalid file format (must be PDF)
- `400`: File too large
- `400`: Unable to parse PDF (scanned image)
- `413`: File size exceeds limit

---

### GET /resume
Get current user's parsed resume.

**Response** (200):
```json
{
  "resume": {
    "id": "uuid",
    "filename": "resume.pdf",
    "s3_file_path": "resumes/user123/resume.pdf",
    "upload_date": "2024-05-20T10:00:00Z",
    "parsed_data": { ... }
  }
}
```

**Errors**:
- `404`: No resume uploaded yet

---

### DELETE /resume
Delete uploaded resume.

**Response** (200):
```json
{
  "message": "Resume deleted successfully"
}
```

---

## Jobs Endpoints

### POST /jobs/search
Trigger AI-powered job search and matching.

Uses:
- User's parsed resume
- User's preferences
- User's chosen AI provider (OpenAI/Claude) for embeddings
- JSearch API for job listings

**Request** (optional):
```json
{
  "limit": 10,
  "force_refresh": false
}
```

**Response** (200):
```json
{
  "search_id": "uuid",
  "total_matches": 45,
  "matches_returned": 10,
  "processing_time_ms": 3500,
  "jobs": [
    {
      "id": "uuid",
      "jsearch_id": "12345",
      "title": "Senior Backend Engineer",
      "company": "TechCorp",
      "location": "San Francisco, CA",
      "is_remote": true,
      "salary_min": 140000,
      "salary_max": 180000,
      "description": "Looking for experienced Python engineer...",
      "apply_url": "https://techcorp.com/careers/...",
      "posted_at": "2024-05-15T08:00:00Z",
      "match_score": 87.5,
      "match_reasons": [
        "Strong Python skills match (5+ years)",
        "Senior role matches your experience level",
        "Salary range $140k-$180k within your preference",
        "Remote role matches your preference",
        "San Francisco is in your preferred locations"
      ]
    }
  ]
}
```

**Errors**:
- `400`: User has no resume uploaded
- `400`: User has no preferences set
- `400`: User has no API key configured
- `500`: AI provider API call failed (check user's API key)
- `500`: JSearch API error

---

### GET /jobs/matches
Get previously computed job matches for current user.

**Query Parameters**:
- `limit` (default 20): Number of results
- `offset` (default 0): Pagination offset
- `sort_by` (default "score"): "score" | "date" | "salary"
- `min_score` (default 0): Filter matches by minimum score (0-100)

**Response** (200):
```json
{
  "total": 45,
  "limit": 20,
  "offset": 0,
  "matches": [
    {
      "match_id": "uuid",
      "job": { ... job object ... },
      "match_score": 87.5,
      "match_reasons": [ ... ],
      "user_action": "saved",
      "created_at": "2024-05-20T10:30:00Z"
    }
  ]
}
```

---

### POST /jobs/{job_id}/save
Save a job to user's saved list.

**Response** (200):
```json
{
  "message": "Job saved",
  "action": "saved"
}
```

---

### POST /jobs/{job_id}/dismiss
Dismiss a job (don't show similar matches).

**Response** (200):
```json
{
  "message": "Job dismissed",
  "action": "dismissed"
}
```

---

### POST /jobs/{job_id}/apply
Mark a job as applied. Opens external apply link.

**Response** (200):
```json
{
  "message": "Job marked as applied",
  "action": "applied",
  "apply_url": "https://techcorp.com/careers/..."
}
```

---

## Settings Endpoints

### GET /settings/preferences
Get user's job search preferences.

**Response** (200):
```json
{
  "id": "uuid",
  "preferred_roles": ["Backend Engineer", "Full Stack Engineer"],
  "preferred_locations": ["San Francisco", "Remote"],
  "salary_min": 100000,
  "salary_max": 200000,
  "remote_preference": "remote",
  "years_of_experience": 5,
  "created_at": "2024-05-20T10:00:00Z",
  "updated_at": "2024-05-20T10:00:00Z"
}
```

---

### PUT /settings/preferences
Update job search preferences.

**Request**:
```json
{
  "preferred_roles": ["Backend Engineer", "Full Stack Engineer"],
  "preferred_locations": ["San Francisco", "Remote"],
  "salary_min": 100000,
  "salary_max": 200000,
  "remote_preference": "remote",
  "years_of_experience": 5
}
```

**Response** (200): Updated preferences object.

---

## Error Response Format

All errors follow this format:

```json
{
  "detail": "Error description",
  "error_code": "ERROR_CODE",
  "timestamp": "2024-05-20T10:00:00Z"
}
```

**Common HTTP Status Codes**:
- `200`: Success
- `201`: Created
- `400`: Bad request (validation error)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (user doesn't have permission)
- `404`: Not found
- `409`: Conflict (resource already exists)
- `413`: Payload too large
- `500`: Server error
- `503`: Service unavailable

---

## Rate Limiting

Backend API endpoints are rate limited:
- **Auth endpoints**: 5 requests/minute per IP
- **File uploads**: 10 requests/hour per user
- **Search endpoint**: 3 requests/hour per user (due to AI API costs)
- **Other endpoints**: 100 requests/minute per user

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705764523
```

If rate limited, receives `429 Too Many Requests`.

---

## Pagination

List endpoints support pagination:

**Query Parameters**:
- `limit`: Results per page (default 20, max 100)
- `offset`: Number of items to skip (default 0)

**Response includes**:
```json
{
  "total": 150,
  "limit": 20,
  "offset": 0,
  "results": [ ... ]
}
```

---

## Sorting

Supported sort fields vary by endpoint. Use `sort_by` query param:
- Default: Most relevant (by date or match score)
- `score`: Match score (descending)
- `salary`: Salary (descending)
- `date`: Posted date (newest first)

---

## Authentication Best Practices

1. Store tokens securely in httpOnly cookies or encrypted localStorage
2. Refresh access token before expiry (30min)
3. Validate token signature on frontend (optional, backend validates)
4. Clear tokens on logout
5. Use HTTPS only in production
6. Rotate refresh tokens on each refresh request

---

See **ARCHITECTURE.md** for data flow diagrams.
