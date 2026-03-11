"use client"

/**
 * Frontend-only data persistence using localStorage
 * This makes the system fully functional without a backend
 */

import type { Item, Claim, User, ReleaseLog, Location, Playbook, AuditLog, ServiceRecord, Mission, SystemSettings, UserPreferences, ItemStatus, MeetingMinutes } from "./mock-data"

const STORAGE_KEYS = {
  ITEMS: "vault_items",
  CLAIMS: "vault_claims",
  USERS: "vault_users",
  RELEASE_LOGS: "vault_release_logs",
  LOCATIONS: "vault_locations",
  PLAYBOOKS: "vault_playbooks",
  AUDIT_LOGS: "vault_audit_logs",
  SERVICE_RECORDS: "vault_service_records",
  MISSIONS: "vault_missions",
  SYSTEM_SETTINGS: "vault_system_settings",
  USER_PREFERENCES: "vault_user_preferences",
  MEETING_MINUTES: "vault_meeting_minutes",
} as const

// Initialize storage with mock data if empty
export function initializeStorage() {
  if (typeof window === "undefined") return

  // Import mock data only when needed
  import("./mock-data").then(({ mockItems, mockClaims, mockUsers, mockReleaseLogs, mockLocations, mockPlaybooks, mockAuditLogs, mockMissions }) => {
    if (!localStorage.getItem(STORAGE_KEYS.ITEMS)) {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(mockItems))
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLAIMS)) {
      localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(mockClaims))
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mockUsers))
    }
    if (!localStorage.getItem(STORAGE_KEYS.RELEASE_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.RELEASE_LOGS, JSON.stringify(mockReleaseLogs))
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOCATIONS)) {
      localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(mockLocations))
    }
    if (!localStorage.getItem(STORAGE_KEYS.PLAYBOOKS)) {
      localStorage.setItem(STORAGE_KEYS.PLAYBOOKS, JSON.stringify(mockPlaybooks))
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(mockAuditLogs))
    }
    if (!localStorage.getItem(STORAGE_KEYS.MISSIONS)) {
      localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(mockMissions))
    }
    if (!localStorage.getItem(STORAGE_KEYS.MEETING_MINUTES)) {
      localStorage.setItem(STORAGE_KEYS.MEETING_MINUTES, JSON.stringify([]))
    }
    // Initialize system settings with default 30 days
    if (!localStorage.getItem(STORAGE_KEYS.SYSTEM_SETTINGS)) {
      const defaultSettings: SystemSettings = {
        id: "settings-1",
        itemExpirationDays: 30,
        updatedBy: "system",
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(defaultSettings))
    }
    // User preferences are created on-demand
  })
}

// Items
export function getItems(): Item[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.ITEMS)
  if (!data || data === "undefined" || data === "null") return []
  let items: Item[] = []
  try {
    const parsed = JSON.parse(data)
    if (!Array.isArray(parsed)) return []
    items = parsed
  } catch {
    return []
  }
  
  // Auto-expire items past donation deadline
  const now = new Date()
  let hasChanges = false
  const updatedItems = items.map((item: Item) => {
    if (item.status === "available" && item.donationDeadline) {
      const deadline = new Date(item.donationDeadline)
      if (deadline < now) {
        hasChanges = true
        return { ...item, status: "expired" as Item["status"] }
      }
    }
    return item
  })
  
  if (hasChanges) {
    saveItems(updatedItems)
    return updatedItems
  }
  
  return items
}

export function saveItems(items: Item[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items))
}

export function addItem(item: Item) {
  const items = getItems()
  items.push(item)
  saveItems(items)
  return item
}

export function updateItem(id: string, updates: Partial<Item>) {
  const items = getItems()
  const index = items.findIndex((i) => i.id === id)
  if (index !== -1) {
    items[index] = { ...items[index], ...updates }
    saveItems(items)
    return items[index]
  }
  return null
}

export function deleteItem(id: string) {
  const items = getItems()
  const filtered = items.filter((i) => i.id !== id)
  saveItems(filtered)
  return filtered.length < items.length
}

// Claims
export function getClaims(): Claim[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.CLAIMS)
  return data ? JSON.parse(data) : []
}

export function saveClaims(claims: Claim[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(claims))
}

export function addClaim(claim: Claim) {
  const claims = getClaims()
  claims.push(claim)
  saveClaims(claims)
  return claim
}

export function updateClaim(id: string, updates: Partial<Claim>) {
  const claims = getClaims()
  const index = claims.findIndex((c) => c.id === id)
  if (index !== -1) {
    claims[index] = { ...claims[index], ...updates }
    saveClaims(claims)
    return claims[index]
  }
  return null
}

// Users
export function getUsers(): User[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.USERS)
  if (!data || data === "undefined" || data === "null") return []
  try {
    const users = JSON.parse(data)
    if (!Array.isArray(users)) return []
    return users
  } catch {
    return []
  }
}

export function saveUsers(users: User[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
}

export function getUserById(id: string): User | null {
  const users = getUsers()
  return users.find((u) => u.id === id) || null
}

export function updateUser(id: string, updates: Partial<User>) {
  const users = getUsers()
  const index = users.findIndex((u) => u.id === id)
  if (index !== -1) {
    users[index] = { ...users[index], ...updates }
    saveUsers(users)
    return users[index]
  }
  return null
}

export function addUser(user: User) {
  const users = getUsers()
  users.push(user)
  saveUsers(users)
  return user
}

export function deleteUser(id: string) {
  const users = getUsers()
  const filtered = users.filter((u) => u.id !== id)
  saveUsers(filtered)
  return filtered.length < users.length
}

// Release Logs
export function getReleaseLogs(): ReleaseLog[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.RELEASE_LOGS)
  if (!data || data === "undefined" || data === "null") return []
  try {
    const logs = JSON.parse(data)
    if (!Array.isArray(logs)) return []
    return logs
  } catch {
    return []
  }
}

export function addReleaseLog(log: ReleaseLog) {
  const logs = getReleaseLogs()
  logs.push(log)
  localStorage.setItem(STORAGE_KEYS.RELEASE_LOGS, JSON.stringify(logs))
  return log
}

// Locations
export function getLocations(): Location[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.LOCATIONS)
  if (!data || data === "undefined" || data === "null") return []
  try {
    const locations = JSON.parse(data)
    if (!Array.isArray(locations)) return []
    return locations
  } catch {
    return []
  }
}

export function saveLocations(locations: Location[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations))
}

export function addLocation(location: Location) {
  const locations = getLocations()
  locations.push(location)
  saveLocations(locations)
  return location
}

export function updateLocation(id: string, updates: Partial<Location>) {
  const locations = getLocations()
  const index = locations.findIndex((l) => l.id === id)
  if (index !== -1) {
    locations[index] = { ...locations[index], ...updates }
    saveLocations(locations)
    return locations[index]
  }
  return null
}

export function deleteLocation(id: string) {
  const locations = getLocations()
  const filtered = locations.filter((l) => l.id !== id)
  saveLocations(filtered)
  return filtered.length < locations.length
}

// Playbooks
export function getPlaybooks(): Playbook[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.PLAYBOOKS)
  if (!data || data === "undefined" || data === "null") return []
  try {
    const playbooks = JSON.parse(data)
    if (!Array.isArray(playbooks)) return []
    return playbooks
  } catch {
    return []
  }
}

export function savePlaybooks(playbooks: Playbook[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.PLAYBOOKS, JSON.stringify(playbooks))
}

export function addPlaybook(playbook: Playbook) {
  const playbooks = getPlaybooks()
  playbooks.push(playbook)
  savePlaybooks(playbooks)
  return playbook
}

export function updatePlaybook(id: string, updates: Partial<Playbook>) {
  const playbooks = getPlaybooks()
  const index = playbooks.findIndex((p) => p.id === id)
  if (index !== -1) {
    playbooks[index] = { ...playbooks[index], ...updates }
    savePlaybooks(playbooks)
    return playbooks[index]
  }
  return null
}

export function deletePlaybook(id: string) {
  const playbooks = getPlaybooks()
  const filtered = playbooks.filter((p) => p.id !== id)
  savePlaybooks(filtered)
  return filtered.length < playbooks.length
}

// Audit Logs
export function getAuditLogs(): AuditLog[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)
  if (!data || data === "undefined" || data === "null") return []
  try {
    const logs = JSON.parse(data)
    if (!Array.isArray(logs)) return []
    return logs
  } catch {
    return []
  }
}

export function addAuditLog(log: AuditLog) {
  const logs = getAuditLogs()
  logs.push(log)
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs))
  return log
}

// Service Records
export function getServiceRecords(): ServiceRecord[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.SERVICE_RECORDS)
  if (!data || data === "undefined" || data === "null") return []
  try {
    const records = JSON.parse(data)
    if (!Array.isArray(records)) return []
    return records
  } catch {
    return []
  }
}

export function saveServiceRecords(records: ServiceRecord[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.SERVICE_RECORDS, JSON.stringify(records))
}

export function addServiceRecord(record: ServiceRecord & { userId: string }) {
  const records = getServiceRecords()
  records.push(record as any) // ServiceRecord doesn't have userId in interface, but we store it
  saveServiceRecords(records)
  return record
}

// Missions
export function getMissions(): Mission[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MISSIONS)
    if (!data || data === "undefined" || data === "null") return []
    return JSON.parse(data)
  } catch (error) {
    console.error("Error parsing missions from localStorage:", error)
    return []
  }
}

export function saveMissions(missions: Mission[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions))
}

export function addMission(mission: Mission) {
  const missions = getMissions()
  missions.push(mission)
  saveMissions(missions)
  return mission
}

export function updateMission(id: string, updates: Partial<Mission>) {
  const missions = getMissions()
  const index = missions.findIndex((m) => m.id === id)
  if (index !== -1) {
    missions[index] = { ...missions[index], ...updates, updatedAt: new Date().toISOString() }
    saveMissions(missions)
    return missions[index]
  }
  return null
}

export function deleteMission(id: string) {
  const missions = getMissions()
  const filtered = missions.filter((m) => m.id !== id)
  saveMissions(filtered)
  return filtered.length < missions.length
}

export function getMissionsByUser(userId: string): Mission[] {
  return getMissions().filter((m) => m.assignedTo === userId)
}

// System Settings
export function getSystemSettings(): SystemSettings {
  if (typeof window === "undefined") {
    return { id: "settings-1", itemExpirationDays: 30, updatedBy: "system", updatedAt: new Date().toISOString() }
  }
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SYSTEM_SETTINGS)
    if (!data || data === "undefined" || data === "null") {
      const defaultSettings: SystemSettings = {
        id: "settings-1",
        itemExpirationDays: 30,
        updatedBy: "system",
        updatedAt: new Date().toISOString(),
      }
      saveSystemSettings(defaultSettings)
      return defaultSettings
    }
    return JSON.parse(data)
  } catch (error) {
    console.error("Error parsing system settings:", error)
    return { id: "settings-1", itemExpirationDays: 30, updatedBy: "system", updatedAt: new Date().toISOString() }
  }
}

export function saveSystemSettings(settings: SystemSettings) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.SYSTEM_SETTINGS, JSON.stringify(settings))
}

export function updateSystemSettings(updates: Partial<SystemSettings>, updatedBy: string) {
  const settings = getSystemSettings()
  const updated = {
    ...settings,
    ...updates,
    updatedBy,
    updatedAt: new Date().toISOString(),
  }
  saveSystemSettings(updated)
  return updated
}

// User Preferences
export function getUserPreferences(userId: string): UserPreferences | null {
  if (typeof window === "undefined") return null
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES)
    if (!data || data === "undefined" || data === "null") return null
    const preferences = JSON.parse(data)
    return preferences[userId] || null
  } catch (error) {
    console.error("Error parsing user preferences:", error)
    return null
  }
}

export function saveUserPreferences(userId: string, preferences: UserPreferences) {
  if (typeof window === "undefined") return
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES)
    let allPreferences: Record<string, any> = {}
    if (data && data !== "undefined" && data !== "null") {
      try {
        const parsed = JSON.parse(data)
        if (typeof parsed === "object" && parsed !== null) {
          allPreferences = parsed
        }
      } catch {
        allPreferences = {}
      }
    }
    allPreferences[userId] = {
      ...preferences,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(allPreferences))
  } catch (error) {
    console.error("Error saving user preferences:", error)
  }
}

export function updateUserPreferences(userId: string, updates: Partial<UserPreferences>) {
  const existing = getUserPreferences(userId)
  const defaultPreferences: UserPreferences = {
    userId,
    theme: "system",
    notifications: {
      push: true,
      missionUpdates: true,
      claimUpdates: true,
    },
    updatedAt: new Date().toISOString(),
  }
  const updated = {
    ...defaultPreferences,
    ...existing,
    ...updates,
    userId,
    updatedAt: new Date().toISOString(),
  }
  saveUserPreferences(userId, updated)
  return updated
}

export function getDefaultUserPreferences(): UserPreferences {
  return {
    userId: "",
    theme: "system",
    notifications: {
      push: true,
      missionUpdates: true,
      claimUpdates: true,
    },
    updatedAt: new Date().toISOString(),
  }
}

// Meeting Minutes
export function getMeetingMinutes(): MeetingMinutes[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.MEETING_MINUTES)
  if (!data || data === "undefined" || data === "null") return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function getMeetingMinutesById(id: string): MeetingMinutes | undefined {
  const minutes = getMeetingMinutes()
  return minutes.find((m) => m.id === id)
}

export function addMeetingMinutes(minutes: MeetingMinutes): MeetingMinutes {
  const allMinutes = getMeetingMinutes()
  allMinutes.push(minutes)
  localStorage.setItem(STORAGE_KEYS.MEETING_MINUTES, JSON.stringify(allMinutes))
  return minutes
}

export function updateMeetingMinutes(id: string, updates: Partial<MeetingMinutes>): MeetingMinutes | null {
  const allMinutes = getMeetingMinutes()
  const index = allMinutes.findIndex((m) => m.id === id)
  if (index === -1) return null
  
  allMinutes[index] = {
    ...allMinutes[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEYS.MEETING_MINUTES, JSON.stringify(allMinutes))
  return allMinutes[index]
}

export function deleteMeetingMinutes(id: string): boolean {
  const allMinutes = getMeetingMinutes()
  const filtered = allMinutes.filter((m) => m.id !== id)
  if (filtered.length === allMinutes.length) return false
  
  localStorage.setItem(STORAGE_KEYS.MEETING_MINUTES, JSON.stringify(filtered))
  return true
}
