"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Key,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Loader2
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { profileAPI, settingsAPI } from "@/lib/api"
import { useAuthStore } from "@/src/store/authStore"

const settingsSections = [
  { id: "api", label: "AI API Keys", icon: Key },
  { id: "preferences", label: "Job Preferences", icon: Database },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "account", label: "Account", icon: Shield },
]

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

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("api")
  const [showOpenAIKey, setShowOpenAIKey] = useState(false)
  const [showClaudeKey, setShowClaudeKey] = useState(false)
  const [newApiKeyProvider, setNewApiKeyProvider] = useState("openai")
  const [newApiKeyValue, setNewApiKeyValue] = useState("")
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  const user = useAuthStore((state) => state.user)

  const [notifications, setNotifications] = useState({
    jobMatches: true,
    applications: true,
    messages: true,
    marketing: false,
  })

  // Preferences form state
  const [preferences, setPreferences] = useState({
    preferred_roles: [] as string[],
    preferred_locations: [] as string[],
    salary_min: null as string | null,
    salary_max: null as string | null,
    remote_preference: "any" as string,
  })
  const [rolesInput, setRolesInput] = useState("")
  const [locationsInput, setLocationsInput] = useState("")

  // API Keys Query
  const { data: apiKeysData, isLoading: keysLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => profileAPI.getApiKeys(),
  })

  const apiKeys = apiKeysData?.data?.api_keys || []

  // Preferences Query
  const { data: preferencesData, isLoading: preferencesLoading } = useQuery({
    queryKey: ["preferences"],
    queryFn: () => settingsAPI.getPreferences(),
  })

  useEffect(() => {
    if (preferencesData?.data) {
      const prefs = preferencesData.data
      setPreferences({
        preferred_roles: prefs.preferred_roles || [],
        preferred_locations: prefs.preferred_locations || [],
        salary_min: prefs.salary_min ? String(prefs.salary_min) : null,
        salary_max: prefs.salary_max ? String(prefs.salary_max) : null,
        remote_preference: prefs.remote_preference || "any",
      })
    }
  }, [preferencesData])

  // Add API Key Mutation
  const addApiKeyMutation = useMutation({
    mutationFn: () =>
      profileAPI.addApiKey(newApiKeyProvider, newApiKeyValue),
    onSuccess: () => {
      toast.success("API key added successfully!")
      setNewApiKeyProvider("openai")
      setNewApiKeyValue("")
      queryClient.invalidateQueries({ queryKey: ["api-keys"] })
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.detail || "Failed to add API key"
      toast.error(errorMsg)
    },
  })

  // Delete API Key Mutation
  const deleteApiKeyMutation = useMutation({
    mutationFn: (provider: string) =>
      profileAPI.deleteApiKey(provider),
    onSuccess: () => {
      toast.success("API key deleted")
      queryClient.invalidateQueries({ queryKey: ["api-keys"] })
    },
    onError: () => {
      toast.error("Failed to delete API key")
    },
  })

  // Update Preferences Mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: () =>
      settingsAPI.updatePreferences({
        preferred_roles: preferences.preferred_roles,
        preferred_locations: preferences.preferred_locations,
        salary_min: preferences.salary_min,
        salary_max: preferences.salary_max,
        remote_preference: preferences.remote_preference,
      }),
    onSuccess: () => {
      toast.success("Preferences updated!")
      queryClient.invalidateQueries({ queryKey: ["preferences"] })
    },
    onError: () => {
      toast.error("Failed to update preferences")
    },
  })

  const handleAddRole = () => {
    if (rolesInput.trim() && !preferences.preferred_roles.includes(rolesInput.trim())) {
      setPreferences((prev) => ({
        ...prev,
        preferred_roles: [...prev.preferred_roles, rolesInput.trim()],
      }))
      setRolesInput("")
    }
  }

  const handleRemoveRole = (role: string) => {
    setPreferences((prev) => ({
      ...prev,
      preferred_roles: prev.preferred_roles.filter((r) => r !== role),
    }))
  }

  const handleAddLocation = () => {
    if (
      locationsInput.trim() &&
      !preferences.preferred_locations.includes(locationsInput.trim())
    ) {
      setPreferences((prev) => ({
        ...prev,
        preferred_locations: [...prev.preferred_locations, locationsInput.trim()],
      }))
      setLocationsInput("")
    }
  }

  const handleRemoveLocation = (location: string) => {
    setPreferences((prev) => ({
      ...prev,
      preferred_locations: prev.preferred_locations.filter(
        (l) => l !== location
      ),
    }))
  }

  const handleDeleteApiKey = (provider: string) => {
    if (confirm(`Are you sure you want to delete the ${provider} API key?`)) {
      deleteApiKeyMutation.mutate(provider)
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-20 lg:pb-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </motion.div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-4">
        {/* Sidebar */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-1">
          <nav className="flex flex-wrap gap-2 sm:flex-col sm:space-y-1 lg:space-y-1 lg:flex-col">
            {settingsSections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center justify-center sm:justify-start gap-1 sm:gap-3 rounded-lg px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm transition-colors whitespace-nowrap sm:whitespace-normal flex-1 sm:flex-none sm:w-full min-h-[44px] sm:min-h-auto ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
                  <span className="font-medium hidden sm:inline">{section.label}</span>
                </button>
              )
            })}
          </nav>
        </motion.div>

        {/* Content */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-3">
          <div className="rounded-2xl border border-border bg-card/50 p-4 sm:p-6">
            {/* API Keys Section */}
            {activeSection === "api" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">AI API Keys</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Connect your AI providers for enhanced job matching and resume analysis
                  </p>
                </div>

                {keysLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Display existing keys */}
                    {apiKeys.length > 0 ? (
                      <div className="space-y-4">
                        {apiKeys.map((key: any) => {
                          const isOpenAI = key.provider === "openai"
                          const isClaude = key.provider === "anthropic"
                          return (
                            <div key={key.provider} className="rounded-lg border border-border bg-secondary/30 p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                      isOpenAI
                                        ? "bg-[#10a37f]/20"
                                        : "bg-[#d4a574]/20"
                                    }`}
                                  >
                                    <span className={`text-lg font-bold ${
                                      isOpenAI
                                        ? "text-[#10a37f]"
                                        : "text-[#d4a574]"
                                    }`}>
                                      {isOpenAI ? "O" : "C"}
                                    </span>
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-foreground">
                                      {isOpenAI ? "OpenAI" : "Anthropic Claude"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      {isOpenAI ? "GPT-4, GPT-3.5" : "Claude 3 Opus, Sonnet"}
                                    </p>
                                  </div>
                                </div>
                                <span className="flex items-center gap-1 text-sm text-emerald-500">
                                  <Check className="h-4 w-4" />
                                  Connected
                                </span>
                              </div>
                              <div className="mt-4">
                                <Label htmlFor={`${key.provider}-key`} className="text-foreground">
                                  API Key
                                </Label>
                                <div className="mt-2 flex gap-2">
                                  <div className="relative flex-1">
                                    <Input
                                      id={`${key.provider}-key`}
                                      type="password"
                                      value={key.key_preview}
                                      readOnly
                                      className="pr-10 bg-secondary/50 border-border"
                                    />
                                  </div>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteApiKey(key.provider)}
                                    disabled={deleteApiKeyMutation.isPending}
                                  >
                                    {deleteApiKeyMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : null}

                    {/* Add new API Key form */}
                    <div className="border-t border-border pt-6">
                      <h3 className="font-medium text-foreground mb-4">Add New API Key</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="provider" className="text-foreground">
                            Provider
                          </Label>
                          <select
                            id="provider"
                            value={newApiKeyProvider}
                            onChange={(e) => setNewApiKeyProvider(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-foreground"
                          >
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="api-key-input" className="text-foreground">
                            API Key
                          </Label>
                          <div className="mt-2 flex gap-2">
                            <div className="relative flex-1">
                              <Input
                                id="api-key-input"
                                type="password"
                                placeholder={
                                  newApiKeyProvider === "openai"
                                    ? "sk-..."
                                    : "sk-ant-..."
                                }
                                value={newApiKeyValue}
                                onChange={(e) => setNewApiKeyValue(e.target.value)}
                                className="pr-10 bg-secondary/50 border-border"
                              />
                            </div>
                            <Button
                              onClick={() => addApiKeyMutation.mutate()}
                              disabled={
                                !newApiKeyValue.trim() ||
                                addApiKeyMutation.isPending
                              }
                            >
                              {addApiKeyMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Add Key"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Job Preferences Section */}
            {activeSection === "preferences" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Job Preferences</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Set your job search preferences and filters
                  </p>
                </div>

                {preferencesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Salary Range */}
                    <div className="rounded-lg border border-border bg-secondary/30 p-4">
                      <h3 className="font-medium text-foreground text-sm sm:text-base">Salary Range</h3>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label htmlFor="salary-min" className="text-xs sm:text-sm text-muted-foreground">
                            Minimum
                          </Label>
                          <Input
                            id="salary-min"
                            type="number"
                            placeholder="e.g., 50000"
                            value={preferences.salary_min || ""}
                            onChange={(e) =>
                              setPreferences((prev) => ({
                                ...prev,
                                salary_min: e.target.value || null,
                              }))
                            }
                            className="mt-2 h-11 sm:h-auto bg-secondary/50 border-border text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="salary-max" className="text-xs sm:text-sm text-muted-foreground">
                            Maximum
                          </Label>
                          <Input
                            id="salary-max"
                            type="number"
                            placeholder="e.g., 150000"
                            value={preferences.salary_max || ""}
                            onChange={(e) =>
                              setPreferences((prev) => ({
                                ...prev,
                                salary_max: e.target.value || null,
                              }))
                            }
                            className="mt-2 h-11 sm:h-auto bg-secondary/50 border-border text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Remote Preference */}
                    <div className="rounded-lg border border-border bg-secondary/30 p-4">
                      <Label htmlFor="remote-pref" className="font-medium text-foreground">
                        Remote Work Preference
                      </Label>
                      <select
                        id="remote-pref"
                        value={preferences.remote_preference}
                        onChange={(e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            remote_preference: e.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-foreground"
                      >
                        <option value="any">Any</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="onsite">On-site</option>
                      </select>
                    </div>

                    {/* Preferred Roles */}
                    <div className="rounded-lg border border-border bg-secondary/30 p-4">
                      <Label className="font-medium text-foreground">Preferred Job Roles</Label>
                      <div className="mt-4 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., Software Engineer"
                            value={rolesInput}
                            onChange={(e) => setRolesInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                handleAddRole()
                              }
                            }}
                            className="bg-secondary/50 border-border"
                          />
                          <Button onClick={handleAddRole} variant="outline">
                            Add
                          </Button>
                        </div>
                        {preferences.preferred_roles.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {preferences.preferred_roles.map((role) => (
                              <div
                                key={role}
                                className="flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-sm text-primary"
                              >
                                {role}
                                <button
                                  onClick={() => handleRemoveRole(role)}
                                  className="text-primary hover:text-primary/80"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preferred Locations */}
                    <div className="rounded-lg border border-border bg-secondary/30 p-4">
                      <Label className="font-medium text-foreground">Preferred Locations</Label>
                      <div className="mt-4 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., San Francisco, CA"
                            value={locationsInput}
                            onChange={(e) => setLocationsInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                handleAddLocation()
                              }
                            }}
                            className="bg-secondary/50 border-border"
                          />
                          <Button onClick={handleAddLocation} variant="outline">
                            Add
                          </Button>
                        </div>
                        {preferences.preferred_locations.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {preferences.preferred_locations.map((location) => (
                              <div
                                key={location}
                                className="flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-sm text-primary"
                              >
                                {location}
                                <button
                                  onClick={() => handleRemoveLocation(location)}
                                  className="text-primary hover:text-primary/80"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => updatePreferencesMutation.mutate()}
                      className="w-full"
                      disabled={updatePreferencesMutation.isPending}
                    >
                      {updatePreferencesMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Preferences"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Notification Preferences</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose what notifications you want to receive
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: "jobMatches", label: "New Job Matches", desc: "Get notified when AI finds jobs matching your profile" },
                    { key: "applications", label: "Application Updates", desc: "Status changes on your job applications" },
                    { key: "messages", label: "Messages", desc: "Direct messages from recruiters and employers" },
                    { key: "marketing", label: "Marketing", desc: "Tips, product updates, and promotional content" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof typeof notifications]}
                        onCheckedChange={(checked) =>
                          setNotifications((prev) => ({ ...prev, [item.key]: checked }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Appearance Section */}
            {activeSection === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Customize the look and feel of your dashboard
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h3 className="font-medium text-foreground">Theme</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Select your preferred color theme
                  </p>
                  <div className="mt-4 flex gap-4">
                    <button
                      onClick={() => setTheme("dark")}
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                        theme === "dark"
                          ? "border-primary bg-card/50"
                          : "border-border bg-card/50 opacity-50"
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full bg-[#050816]" />
                      <span className={`text-sm ${theme === "dark" ? "text-foreground" : "text-muted-foreground"}`}>
                        Dark
                      </span>
                    </button>
                    <button
                      onClick={() => setTheme("light")}
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                        theme === "light"
                          ? "border-primary bg-card/50"
                          : "border-border bg-card/50 opacity-50"
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full bg-white" />
                      <span className={`text-sm ${theme === "light" ? "text-foreground" : "text-muted-foreground"}`}>
                        Light
                      </span>
                    </button>
                    <button
                      onClick={() => setTheme("system")}
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                        theme === "system"
                          ? "border-primary bg-card/50"
                          : "border-border bg-card/50 opacity-50"
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-white to-[#050816]" />
                      <span className={`text-sm ${theme === "system" ? "text-foreground" : "text-muted-foreground"}`}>
                        System
                      </span>
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h3 className="font-medium text-foreground">Language</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose your preferred language
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <span className="text-foreground">English (US)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Account Section */}
            {activeSection === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Account Settings</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage your account and security settings
                  </p>
                </div>

                {/* User Email */}
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h3 className="font-medium text-foreground">Email Address</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{user?.email}</p>
                </div>

                {/* Password */}
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <h3 className="font-medium text-foreground">Password</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Change your account password
                  </p>
                  <Button variant="outline" className="mt-4 border-border" disabled>
                    Coming Soon
                  </Button>
                </div>

                {/* Delete Account */}
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <h3 className="font-medium text-destructive">Danger Zone</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button variant="destructive" className="mt-4" disabled>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account (Coming Soon)
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
