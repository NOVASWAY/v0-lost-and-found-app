/**
 * Frontend-only data persistence using localStorage
 * This makes the system fully functional without a backend
 */

import type { Item, Claim, User, ReleaseLog, Location, Playbook, AuditLog, ServiceRecord } from "./mock-data"

const STORAGE_KEYS = {
  ITEMS: "vault_items",
  CLAIMS: "vault_claims",
  USERS: "vault_users",
  RELEASE_LOGS: "vault_release_logs",
  LOCATIONS: "vault_locations",
  PLAYBOOKS: "vault_playbooks",
  AUDIT_LOGS: "vault_audit_logs",
  SERVICE_RECORDS: "vault_service_records",
} as const

// Initialize storage with mock data if empty
export function initializeStorage() {
  if (typeof window === "undefined") return

  // Import mock data only when needed
  import("./mock-data").then(({ mockItems, mockClaims, mockUsers, mockReleaseLogs, mockLocations, mockPlaybooks, mockAuditLogs }) => {
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
  })
}

// Items
export function getItems(): Item[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.ITEMS)
  return data ? JSON.parse(data) : []
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
  return data ? JSON.parse(data) : []
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
  return data ? JSON.parse(data) : []
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
  return data ? JSON.parse(data) : []
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
  return data ? JSON.parse(data) : []
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
  return data ? JSON.parse(data) : []
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
  return data ? JSON.parse(data) : []
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

