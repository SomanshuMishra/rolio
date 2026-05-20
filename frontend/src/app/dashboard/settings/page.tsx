'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/Toast'
import api from '@/lib/api'
import Modal from '@/components/Modal'

export default function SettingsPage() {
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
  const [apiProvider, setApiProvider] = useState('openai')
  const [existingKeys, setExistingKeys] = useState<any[]>([])

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
      await api.put('/api/settings/preferences', {
        preferred_roles: preferences.preferred_roles.length > 0 ? preferences.preferred_roles : undefined,
        preferred_locations: preferences.preferred_locations.length > 0 ? preferences.preferred_locations : undefined,
        salary_min: preferences.salary_min || undefined,
        salary_max: preferences.salary_max || undefined,
        remote_preference: preferences.remote_preference,
      })

      addToast('Preferences saved successfully!', 'success')
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
        },
      })

      addToast(`${apiProvider} API key saved successfully!`, 'success')
      setApiKey('')
      setExistingKeys([...existingKeys, response.data])
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to save API key'
      addToast(errorMsg, 'error')
      console.error('Error:', error)
    } finally {
      setIsSaving(false)
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
    <div className="p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-gray-400 mb-8">Configure your preferences and API keys for job matching</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Job Preferences */}
          <motion.div
            className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-semibold mb-6">Job Preferences</h2>
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
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
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
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
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
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                    placeholder="80000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Salary</label>
                  <input
                    type="number"
                    value={preferences.salary_max}
                    onChange={(e) => setPreferences({ ...preferences, salary_max: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                    placeholder="150000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Remote Preference</label>
                <select
                  value={preferences.remote_preference}
                  onChange={(e) => setPreferences({ ...preferences, remote_preference: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
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
            className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">AI Provider</h2>
              <motion.button
                onClick={() => setShowApiGuide(true)}
                className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-blue-400"
                whileHover={{ scale: 1.05 }}
              >
                📖 Setup Guide
              </motion.button>
            </div>

            {/* Existing API Keys */}
            {existingKeys.length > 0 && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400 mb-2">✓ Active API Keys:</p>
                {existingKeys.map((key) => (
                  <div key={key.provider} className="flex justify-between items-center text-sm mb-2 last:mb-0">
                    <span className="capitalize">
                      {key.provider} {key.key_preview}
                    </span>
                    <motion.button
                      onClick={() => handleDeleteApiKey(key.provider)}
                      className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded"
                      whileHover={{ scale: 1.05 }}
                    >
                      Remove
                    </motion.button>
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
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                >
                  <option value="google">Google Gemini - Free & Recommended ⭐</option>
                  <option value="groq">Groq - Free & Super Fast ⚡</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none font-mono"
                  placeholder="sk-••••••••••••••••"
                />
                <p className="text-xs text-gray-400 mt-2">🔒 Encrypted with AES-256, never shared</p>
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
      <Modal isOpen={showApiGuide} onClose={() => setShowApiGuide(false)} title="Get Your Free API Key in 5 Minutes">
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-green-400 mb-2">⭐ Recommended: Google Gemini (Completely Free)</h3>
            <p className="text-xs text-gray-400 mb-2">60 requests/minute • No credit card needed • Truly free forever</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Visit <span className="font-mono text-blue-300">aistudio.google.com/app/apikey</span></li>
              <li>Click "Get API Key" button</li>
              <li>Click "Create API key in new project"</li>
              <li>Copy your new API key</li>
              <li>Paste it above in the API Key field</li>
              <li>Click "Save API Key"</li>
              <li>Ready! Start searching jobs</li>
            </ol>
          </div>

          <div className="border-t border-white/10 pt-4">
            <h3 className="font-semibold text-yellow-400 mb-2">⚡ Alternative: Groq (Also Free & Super Fast)</h3>
            <p className="text-xs text-gray-400 mb-2">30 requests/minute • Extremely fast responses • No credit card needed</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Visit <span className="font-mono text-blue-300">console.groq.com</span></li>
              <li>Sign up with email (free)</li>
              <li>Go to API Keys section</li>
              <li>Create new key and copy it</li>
              <li>Select "Groq" in the dropdown above</li>
              <li>Paste and save your key</li>
              <li>Experience lightning-fast job matching</li>
            </ol>
          </div>

          <p className="text-xs text-gray-400 pt-4 border-t border-white/10">
            💡 Both options are completely free with no credit card required. Choose one and get started!
          </p>
        </div>
      </Modal>

    </div>
  )
}
