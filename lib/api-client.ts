// API client utility for making requests to the backend

const API_BASE = "/api"

export type ItemStatus = "available" | "claimed" | "released" | "donated" | "expired"

export interface Item {
  id: string
  imageUrl: string
  category: string
  color: string
  location: string
  dateFounded: string
  description: string
  status: ItemStatus
  donationDeadline: string | null
  uniqueMarkings: string | null
  uploadedBy: { id: string; name?: string; username?: string }
  createdAt?: string
  updatedAt?: string
}

export interface Location {
  id: string
  name: string
  description?: string | null
  createdAt?: string
}

export interface UserListItem {
  id: string
  name: string
  username: string
  role: string
  itemsUploaded?: number
  claimsSubmitted?: number
  vaultPoints?: number
  rank?: number
  attendanceCount?: number
  serviceCount?: number
  joinedAt?: string
  createdAt?: string
  updatedAt?: string
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(options?.headers as any)
  headers.set("Content-Type", "application/json")

  // Auth is carried by the httpOnly `auth_token` cookie (set at login),
  // so no token is ever stored in or read from client storage.
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: "same-origin",
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new ApiError(response.status, error.error || response.statusText)
  }

  return response.json()
}

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    fetchApi<{ user: UserListItem & { tokenVersion?: number }; message: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: (userId?: string, username?: string) =>
    fetchApi<{ message: string }>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ userId, username }),
    }),

  changePassword: (userId: string, currentPassword: string, newPassword: string) =>
    fetchApi<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ userId, currentPassword, newPassword }),
    }),
}

// Users API
export const usersApi = {
  getAll: (search?: string) =>
    fetchApi<{ users: UserListItem[] }>(`/users${search ? `?search=${encodeURIComponent(search)}` : ""}`),

  getById: (id: string) => fetchApi<{ user: UserListItem }>(`/users/${id}`),

  create: (data: { name: string; username: string; password: string; role: string }) =>
    fetchApi<{ user: UserListItem; message: string }>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{ name: string; role: string }>) =>
    fetchApi<{ user: UserListItem; message: string }>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/users/${id}`, {
      method: "DELETE",
    }),
}

// Items API
export const itemsApi = {
  getAll: (params?: { search?: string; status?: string; category?: string; location?: string; uploadedById?: string; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set("search", params.search)
    if (params?.status) searchParams.set("status", params.status)
    if (params?.category) searchParams.set("category", params.category)
    if (params?.location) searchParams.set("location", params.location)
    if (params?.uploadedById) searchParams.set("uploadedById", params.uploadedById)
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    const query = searchParams.toString()
    return fetchApi<{ items: Item[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/items${query ? `?${query}` : ""}`
    )
  },

  getById: (id: string) => fetchApi<{ item: Item }>(`/items/${id}`),

  create: (data: {
    imageUrl: string
    category: string
    color?: string
    location: string
    dateFounded: string
    description?: string
    uniqueMarkings?: string
  }) =>
    fetchApi<{ item: Item; message: string }>("/items", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{ status: string; description: string }>) =>
    fetchApi<{ item: Item; message: string }>(`/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/items/${id}`, {
      method: "DELETE",
    }),
}

// Claims API
export const claimsApi = {
  getAll: (params?: { status?: string; claimantId?: string; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set("status", params.status)
    if (params?.claimantId) searchParams.set("claimantId", params.claimantId)
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    const query = searchParams.toString()
    return fetchApi<{ claims: any[] }>(`/claims${query ? `?${query}` : ""}`)
  },

  getById: (id: string) => fetchApi<{ claim: any }>(`/claims/${id}`),

  create: (data: { itemId: string; proofImage: string; claimantId: string; notes?: string }) =>
    fetchApi<{ claim: any; message: string }>("/claims", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: {
    status?: string
    releaseNotes?: string
    releasedBy?: string
    volunteerId?: string
  }) =>
    fetchApi<{ claim: any; message: string }>(`/claims/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
}

// Locations API
export const locationsApi = {
  getAll: () => fetchApi<{ locations: Location[] }>("/locations"),

  create: (data: { name: string; description?: string; userId?: string }) =>
    fetchApi<{ location: any; message: string }>("/locations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; description?: string; userId?: string }) =>
    fetchApi<{ location: any; message: string }>(`/locations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string, userId?: string) =>
    fetchApi<{ message: string }>(`/locations/${id}${userId ? `?userId=${userId}` : ""}`, {
      method: "DELETE",
    }),
}

// Playbooks API
export const playbooksApi = {
  getAll: () => fetchApi<{ playbooks: any[] }>("/playbooks"),

  create: (data: { title: string; scenario: string; protocol: string; priority?: string; userId?: string }) =>
    fetchApi<{ playbook: any; message: string }>("/playbooks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: {
    title?: string
    scenario?: string
    protocol?: string
    priority?: string
    userId?: string
  }) =>
    fetchApi<{ playbook: any; message: string }>(`/playbooks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string, userId?: string) =>
    fetchApi<{ message: string }>(`/playbooks/${id}${userId ? `?userId=${userId}` : ""}`, {
      method: "DELETE",
    }),
}

// Audit Logs API
export const auditLogsApi = {
  getAll: (params?: { search?: string; type?: string; severity?: string; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set("search", params.search)
    if (params?.type) searchParams.set("type", params.type)
    if (params?.severity) searchParams.set("severity", params.severity)
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    const query = searchParams.toString()
    return fetchApi<{ logs: any[] }>(`/audit-logs${query ? `?${query}` : ""}`)
  },
}

// Service Records API
export const serviceRecordsApi = {
  getByUserId: (userId: string) =>
    fetchApi<{ records: any[] }>(`/service-records?userId=${userId}`),

  create: (data: {
    userId: string
    serviceDate: string
    attended: boolean
    served: boolean
    notes?: string
    recordedBy?: string
  }) =>
    fetchApi<{ record: any; message: string }>("/service-records", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// Release Logs API
export const releaseLogsApi = {
  getAll: (search?: string) =>
    fetchApi<{ logs: any[] }>(`/release-logs${search ? `?search=${encodeURIComponent(search)}` : ""}`),
}

// Orders API
export const ordersApi = {
  getAll: () => fetchApi<{ orders: any[] }>("/orders"),

  markRead: (id: string) =>
    fetchApi<{ order: any; message: string }>(`/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "read" }),
    }),
}

// Missions API
export const missionsApi = {
  getAll: () => fetchApi<{ missions: any[] }>("/missions"),

  create: (data: {
    title: string
    description?: string
    instructions: string
    priority?: string
    status?: string
    dueDate?: string | null
    location?: string | null
    assignedTo: string
  }) =>
    fetchApi<{ mission: any; message: string }>("/missions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: {
    title?: string
    description?: string
    instructions?: string
    priority?: string
    status?: string
    dueDate?: string | null
    location?: string | null
    completionNotes?: string
    assignedTo?: string
  }) =>
    fetchApi<{ mission: any; message: string }>(`/missions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/missions/${id}`, {
      method: "DELETE",
    }),
}

// Meeting Minutes API
export const meetingMinutesApi = {
  getAll: () => fetchApi<{ minutes: any[] }>("/meeting-minutes"),

  create: (data: Record<string, unknown>) =>
    fetchApi<{ minutes: any; message: string }>("/meeting-minutes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Record<string, unknown>) =>
    fetchApi<{ minutes: any; message: string }>(`/meeting-minutes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/meeting-minutes/${id}`, {
      method: "DELETE",
    }),
}
