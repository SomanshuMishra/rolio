import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const tokens = localStorage.getItem('rolio_tokens')
      if (tokens) {
        const { accessToken } = JSON.parse(tokens)
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`
        }
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for token refresh on 401
let isRefreshing = false
let failedQueue: Array<{
  onSuccess: (token: string) => void
  onError: (error: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.onError(error)
    } else if (token) {
      prom.onSuccess(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    if (error.response?.status === 401) {
      if (isRefreshing) {
        return new Promise((onSuccess, onError) => {
          failedQueue.push({ onSuccess, onError })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      isRefreshing = true

      try {
        if (typeof window !== 'undefined') {
          const tokens = localStorage.getItem('rolio_tokens')
          if (tokens) {
            const { refreshToken } = JSON.parse(tokens)
            const refreshResponse = await axios.post(`${API_URL}/api/auth/refresh`, {
              refresh_token: refreshToken,
            })

            const { access_token, refresh_token } = refreshResponse.data
            localStorage.setItem(
              'rolio_tokens',
              JSON.stringify({
                accessToken: access_token,
                refreshToken: refresh_token,
              })
            )

            api.defaults.headers.common.Authorization = `Bearer ${access_token}`
            originalRequest.headers.Authorization = `Bearer ${access_token}`
            processQueue(null, access_token)

            return api(originalRequest)
          }
        }
      } catch (err) {
        processQueue(err, null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('rolio_tokens')
          window.location.href = '/login'
        }
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ============= AUTH ENDPOINTS =============

export const authAPI = {
  register: (data: {
    email: string
    password: string
    full_name: string
  }) =>
    api.post('/api/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),

  logout: (refreshToken: string) =>
    api.post('/api/auth/logout', { refresh_token: refreshToken }),

  refresh: (refreshToken: string) =>
    api.post('/api/auth/refresh', { refresh_token: refreshToken }),
}

// ============= RESUME ENDPOINTS =============

export const resumeAPI = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  get: () => api.get('/api/resume/'),

  getParsedData: () => api.get('/api/resume/parsed-data'),

  delete: () => api.delete('/api/resume/'),
}

// ============= JOBS ENDPOINTS =============

export const jobsAPI = {
  getSkills: () => api.get('/api/jobs/skills'),

  search: (params: { limit?: number; force_refresh?: boolean; required_skills?: string[] }) =>
    api.post('/api/jobs/search', params),

  getMatches: (limit = 20, offset = 0, minScore = 60) =>
    api.get('/api/jobs/matches', { params: { limit, offset, min_score: minScore } }),

  saveJob: (jobId: string) => api.post(`/api/jobs/jobs/${jobId}/save`),

  dismissJob: (jobId: string) => api.post(`/api/jobs/jobs/${jobId}/dismiss`),

  applyJob: (jobId: string) => api.post(`/api/jobs/jobs/${jobId}/apply`),

  searchAsync: (params: { limit?: number; force_refresh?: boolean; required_skills?: string[] }) =>
    api.post('/api/jobs/search-async', params),

  searchStatus: (searchId: string) => api.get(`/api/jobs/search-status/${searchId}`),

  searchResults: (searchId: string, limit = 50, offset = 0, minScore = 60) =>
    api.get(`/api/jobs/search-results/${searchId}`, {
      params: { limit, offset, min_score: minScore },
    }),

  exportResults: (searchId: string, minScore = 60) =>
    api.get(`/api/jobs/search-results/${searchId}/export`, {
      params: { min_score: minScore },
      responseType: 'blob',
    }),
}

// ============= PROFILE ENDPOINTS =============

export const profileAPI = {
  get: () => api.get('/api/profile'),

  update: (data: { full_name?: string; avatar_url?: string | null }) =>
    api.put('/api/profile', data),

  getApiKeys: () => api.get('/api/profile/api-keys'),

  addApiKey: (provider: string, apiKey: string, modelPreference?: string, isDefault = false) =>
    api.post('/api/profile/api-keys', null, {
      params: { provider, api_key: apiKey, model_preference: modelPreference, is_default: isDefault },
    }),

  deleteApiKey: (provider: string) => api.delete(`/api/profile/api-keys/${provider}`),

  setDefaultApiKey: (provider: string) => api.put(`/api/profile/api-keys/${provider}/default`),
}

// ============= SETTINGS ENDPOINTS =============

export const settingsAPI = {
  getPreferences: () => api.get('/api/settings/preferences'),

  updatePreferences: (data: {
    preferred_roles?: string[]
    preferred_locations?: string[]
    salary_min?: string | null
    salary_max?: string | null
    remote_preference?: string
    years_of_experience?: string
  }) =>
    api.put('/api/settings/preferences', null, { params: data }),
}

export default api
