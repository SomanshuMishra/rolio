'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import api from '@/lib/api'
import Modal from '@/components/Modal'

export default function SettingsPage() {
  // Dark theme styling will be applied to the return JSX
  const router = useRouter()
  const { addToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [showApiGuide, setShowApiGuide] = useState(false)

  const [preferences, setPreferences] = useState<{
    preferred_roles: string[]
    preferred_locations: string[]
    salary_min: string
    salary_max: string
    remote_preference: string
  }>({
    preferred_roles: [],
    preferred_locations: [],
    salary_min: '',
    salary_max: '',
    remote_preference: 'any',
  })

  const [apiKey, setApiKey] = useState('')
  const [apiProvider, setApiProvider] = useState('google')
  const [modelPreference, setModelPreference] = useState('')
  const [existingKeys, setExistingKeys] = useState<any[]>([])
  const [settingDefault, setSettingDefault] = useState<string | null>(null)

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [prefsRes, keysRes] = await Promise.all([
          api.get('/api/settings/preferences'),
          api.get('/api/profile/api-keys'),
        ])

        if (prefsRes.data) {
          setPreferences(prefsRes.data)
        }

        if (keysRes.data?.api_keys) {
          setExistingKeys(keysRes.data.api_keys)
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }

    loadData()
  }, [])

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Save preferences
      await api.put('/api/settings/preferences', {
        preferred_roles: preferences.preferred_roles.length > 0 ? preferences.preferred_roles : undefined,
        preferred_locations: preferences.preferred_locations.length > 0 ? preferences.preferred_locations : undefined,
        salary_min: preferences.salary_min || undefined,
        salary_max: preferences.salary_max || undefined,
        remote_preference: preferences.remote_preference,
      })

      addToast('Preferences saved! Starting job search...', 'success')

      // Trigger async job search
      try {
        const searchResponse = await api.post('/api/jobs/search-async', {
          limit: 50,
          force_refresh: true,
          required_skills: [],
        })

        const searchId = searchResponse.data.search_id

        // Redirect to jobs page with search_id
        router.push(`/dashboard/jobs?search_id=${searchId}`)
      } catch (searchError: any) {
        console.error('Failed to start search:', searchError)
        addToast('Preferences saved, but failed to start job search', 'error')
      }
    } catch (error: any) {
      addToast('Failed to save preferences', 'error')
      console.error('Error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!apiKey.trim()) {
      addToast('Please enter an API key', 'error')
      return
    }

    setIsSaving(true)

    try {
      const response = await api.post('/api/profile/api-keys', null, {
        params: {
          provider: apiProvider,
          api_key: apiKey,
          model_preference: modelPreference || undefined,
          is_default: existingKeys.length === 0, // Set as default if first key
        },
      })

      addToast(`${apiProvider} API key saved successfully!`, 'success')
      setApiKey('')
      setModelPreference('')
      // Update existing key or add new one
      const existingIndex = existingKeys.findIndex((k) => k.provider === apiProvider)
      if (existingIndex >= 0) {
        const updated = [...existingKeys]
        updated[existingIndex] = response.data
        setExistingKeys(updated)
      } else {
        setExistingKeys([...existingKeys, response.data])
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to save API key'
      addToast(errorMsg, 'error')
      console.error('Error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetDefault = async (provider: string) => {
    setSettingDefault(provider)
    try {
      await api.put(`/api/profile/api-keys/${provider}/default`)
      addToast(`${provider} set as default provider`, 'success')
      // Update all keys
      const updated = existingKeys.map((k) => ({
        ...k,
        is_default: k.provider === provider,
      }))
      setExistingKeys(updated)
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to set default'
      addToast(errorMsg, 'error')
      console.error('Error:', error)
    } finally {
      setSettingDefault(null)
    }
  }

  const handleDeleteApiKey = async (provider: string) => {
    try {
      await api.delete(`/api/profile/api-keys/${provider}`)
      addToast(`${provider} API key deleted`, 'success')
      setExistingKeys(existingKeys.filter((k) => k.provider !== provider))
    } catch (error) {
      addToast('Failed to delete API key', 'error')
    }
  }


  return (
    <div className="min-h-screen p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl md:text-5xl font-bold mb-2 ai-text">Settings</h1>
        <p className="text-slate-400 text-sm md:text-base mb-8">Configure your preferences and API keys for job matching</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Job Preferences */}
          <motion.div
            className="cyber-glass border border-cyan-500/30 rounded-xl p-6 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg md:text-xl font-semibold mb-6 text-cyan-300">Job Preferences</h2>
            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Preferred Roles (comma-separated)</label>
                <input
                  type="text"
                  value={preferences.preferred_roles?.join(', ') || ''}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      preferred_roles: e.target.value.split(',').map((r) => r.trim()),
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-purple-100 rounded-lg text-[#0f172a] text-sm focus:border-blue-500 outline-none"
                  placeholder="e.g., Software Engineer, Python Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preferred Locations (comma-separated)</label>
                <input
                  type="text"
                  value={preferences.preferred_locations?.join(', ') || ''}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      preferred_locations: e.target.value.split(',').map((l) => l.trim()),
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-purple-100 rounded-lg text-[#0f172a] text-sm focus:border-blue-500 outline-none"
                  placeholder="e.g., San Francisco, New York, Remote"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Min Salary</label>
                  <input
                    type="number"
                    value={preferences.salary_min}
                    onChange={(e) => setPreferences({ ...preferences, salary_min: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-purple-100 rounded-lg text-[#0f172a] text-sm focus:border-blue-500 outline-none"
                    placeholder="80000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Salary</label>
                  <input
                    type="number"
                    value={preferences.salary_max}
                    onChange={(e) => setPreferences({ ...preferences, salary_max: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-purple-100 rounded-lg text-[#0f172a] text-sm focus:border-blue-500 outline-none"
                    placeholder="150000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Remote Preference</label>
                <select
                  value={preferences.remote_preference}
                  onChange={(e) => setPreferences({ ...preferences, remote_preference: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-purple-100 rounded-lg text-[#0f172a] text-sm focus:border-blue-500 outline-none"
                >
                  <option value="any">Any</option>
                  <option value="remote">Remote Only</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>

              <motion.button
                type="submit"
                disabled={isSaving}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </motion.button>
            </form>
          </motion.div>

          {/* AI Configuration */}
          <motion.div
            className="bg-gradient-to-br from-white to-white border border-purple-100 rounded-xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">AI Provider</h2>
              <motion.button
                onClick={() => setShowApiGuide(true)}
                className="text-xs px-3 py-1 bg-white/50 hover:bg-white/20 rounded text-blue-400"
                whileHover={{ scale: 1.05 }}
              >
                📖 Setup Guide
              </motion.button>
            </div>

            {/* Existing API Keys */}
            {existingKeys.length > 0 && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400 mb-3">✓ Active API Keys:</p>
                {existingKeys.map((key) => (
                  <div key={key.provider} className="flex items-center justify-between text-sm mb-3 last:mb-0 p-3 bg-white rounded">
                    <div className="flex-1">
                      <div className="capitalize font-medium">
                        {key.provider} {key.key_preview}
                      </div>
                      {key.model_preference && (
                        <div className="text-xs text-gray-600 mt-1">Model: {key.model_preference}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {key.is_default ? (
                        <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                          📌 Default
                        </span>
                      ) : (
                        <motion.button
                          onClick={() => handleSetDefault(key.provider)}
                          disabled={settingDefault === key.provider}
                          className="text-xs px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded disabled:opacity-50"
                          whileHover={{ scale: 1.05 }}
                        >
                          Set Default
                        </motion.button>
                      )}
                      <motion.button
                        onClick={() => handleDeleteApiKey(key.provider)}
                        className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded"
                        whileHover={{ scale: 1.05 }}
                      >
                        Remove
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSaveApiKey} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">AI Provider</label>
                <select
                  value={apiProvider}
                  onChange={(e) => setApiProvider(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-purple-100 rounded-lg text-[#0f172a] text-sm focus:border-blue-500 outline-none"
                >
                  <option value="google">Google Gemini ⭐ Free & Recommended</option>
                  <option value="groq">Groq ⚡ Free & Super Fast</option>
                  <option value="openai">OpenAI - GPT-4</option>
                  <option value="anthropic">Claude (Anthropic)</option>
                  <option value="grok">Grok (X.AI)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-purple-100 rounded-lg text-[#0f172a] text-sm focus:border-blue-500 outline-none font-mono"
                  placeholder="sk-••••••••••••••••"
                />
                <p className="text-xs text-gray-600 mt-2">🔒 Encrypted with AES-256, never shared</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Model Preference (Optional)</label>
                <input
                  type="text"
                  value={modelPreference}
                  onChange={(e) => setModelPreference(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-purple-100 rounded-lg text-[#0f172a] text-sm focus:border-blue-500 outline-none"
                  placeholder="e.g., gpt-4, claude-3-sonnet"
                />
                <p className="text-xs text-gray-600 mt-2">Specify which model to use for this provider (optional)</p>
              </div>

              <motion.button
                type="submit"
                disabled={isSaving}
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSaving ? 'Saving...' : 'Save API Key'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </motion.div>

      {/* API Setup Guide Modal */}
      <Modal isOpen={showApiGuide} onClose={() => setShowApiGuide(false)} title="Get Your API Key for Any Provider">
        <div className="space-y-4 text-sm max-h-[600px] overflow-y-auto">
          <div>
            <h3 className="font-semibold text-green-400 mb-2">⭐ Google Gemini (Completely Free - Recommended)</h3>
            <p className="text-xs text-gray-600 mb-2">60 requests/minute • Web search grounding • No credit card needed</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-300 text-xs">
              <li>Visit <span className="font-mono text-blue-300">aistudio.google.com/app/apikey</span></li>
              <li>Click "Get API Key" button</li>
              <li>Click "Create API key in new project"</li>
              <li>Copy and paste above</li>
            </ol>
          </div>

          <div className="border-t border-purple-100 pt-3">
            <h3 className="font-semibold text-yellow-400 mb-2">⚡ Groq (Free & Lightning Fast)</h3>
            <p className="text-xs text-gray-600 mb-2">30 requests/minute • Extremely fast inference • No credit card needed</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-300 text-xs">
              <li>Visit <span className="font-mono text-blue-300">console.groq.com</span></li>
              <li>Sign up with email (free)</li>
              <li>Go to API Keys section</li>
              <li>Create new key and copy</li>
            </ol>
          </div>

          <div className="border-t border-purple-100 pt-3">
            <h3 className="font-semibold text-blue-400 mb-2">💬 OpenAI (GPT-4, Paid)</h3>
            <p className="text-xs text-gray-600 mb-2">Pay-as-you-go • Highly capable • API keys at platform.openai.com</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-300 text-xs">
              <li>Visit <span className="font-mono text-blue-300">platform.openai.com/api-keys</span></li>
              <li>Create new secret key</li>
              <li>Select OpenAI in dropdown above</li>
              <li>Paste your key</li>
            </ol>
          </div>

          <div className="border-t border-purple-100 pt-3">
            <h3 className="font-semibold text-purple-400 mb-2">🧠 Claude/Anthropic (Paid)</h3>
            <p className="text-xs text-gray-600 mb-2">State-of-the-art • Great for analysis • API keys at console.anthropic.com</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-300 text-xs">
              <li>Visit <span className="font-mono text-blue-300">console.anthropic.com/keys</span></li>
              <li>Create new API key</li>
              <li>Select Anthropic in dropdown</li>
              <li>Paste your key</li>
            </ol>
          </div>

          <div className="border-t border-purple-100 pt-3">
            <h3 className="font-semibold text-red-400 mb-2">🚀 Grok/X.AI (Paid)</h3>
            <p className="text-xs text-gray-600 mb-2">Real-time data • Powerful reasoning • API keys at console.x.ai</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-300 text-xs">
              <li>Visit <span className="font-mono text-blue-300">console.x.ai</span></li>
              <li>Create new API key</li>
              <li>Select Grok in dropdown</li>
              <li>Paste your key</li>
            </ol>
          </div>

          <p className="text-xs text-gray-600 pt-3 border-t border-purple-100">
            💡 Start with free options (Gemini or Groq). Only one default provider is used for job matching.
          </p>
        </div>
      </Modal>

    </div>
  )
}
