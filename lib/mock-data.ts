export type ItemStatus = "available" | "claimed" | "released" | "donated" | "expired"
export type ClaimStatus = "pending" | "approved" | "rejected" | "released"

export interface Item {
  id: string
  imageUrl: string
  category: string
  color: string
  location: string
  dateFounded: string
  description: string
  status: ItemStatus
  uploadedBy: string
  donationDeadline: string
  uniqueMarkings?: string
}

export interface Claim {
  id: string
  itemId: string
  itemName: string
  itemImage: string
  proofImage: string
  claimantName: string
  claimantEmail: string
  status: ClaimStatus
  claimedAt: string
  releaseNotes?: string
  releasedBy?: string
  releasedAt?: string
}

export interface ReleaseLog {
  id: string
  itemId: string
  itemName: string
  claimantName: string
  volunteerName: string
  timestamp: string
  notes: string
}

export interface Order {
  id: string
  title: string
  message: string
  status: "unread" | "read"
  priority: "low" | "medium" | "high"
  createdAt: string
}

export interface Playbook {
  id: string
  title: string
  scenario: string
  protocol: string
  priority: "low" | "medium" | "high" | "critical"
  updatedAt: string
}

export type MissionStatus = "pending" | "in_progress" | "completed" | "cancelled"

export interface Mission {
  id: string
  title: string
  description: string
  assignedTo: string // User ID
  assignedToName: string // User name for display
  assignedBy: string // Admin/User ID who created it
  assignedByName: string // Admin/User name who created it
  priority: "low" | "medium" | "high" | "critical"
  status: MissionStatus
  dueDate?: string
  location?: string
  instructions: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  completionNotes?: string
}

export interface Location {
  id: string
  name: string
  description?: string
  createdAt: string
}

export type AuditLogType =
  | "user_created"
  | "user_deleted"
  | "user_password_changed"
  | "item_uploaded"
  | "item_claimed"
  | "item_released"
  | "item_donated"
  | "attendance_marked"
  | "service_marked"
  | "location_created"
  | "location_updated"
  | "location_deleted"
  | "playbook_created"
  | "playbook_updated"
  | "playbook_deleted"
  | "mission_created"
  | "mission_assigned"
  | "mission_completed"
  | "mission_cancelled"
  | "system_settings_updated"
  | "login"
  | "logout"
  | "order_sent"
  | "meeting_minutes_created"
  | "meeting_minutes_updated"
  | "meeting_minutes_deleted"

export interface AuditLog {
  id: string
  type: AuditLogType
  userId?: string
  userName?: string
  action: string
  details?: string
  timestamp: string
  ipAddress?: string
  severity: "info" | "warning" | "error" | "critical"
}

export interface ServiceRecord {
  id: string
  serviceDate: string
  attended: boolean
  served: boolean
  notes?: string
  recordedBy: string
  recordedAt: string
}

export interface SystemSettings {
  id: string
  itemExpirationDays: number // Configurable expiration period
  updatedBy: string
  updatedAt: string
}

export interface UserPreferences {
  userId: string
  theme: "light" | "dark" | "system"
  notifications: {
    push: boolean
    missionUpdates: boolean
    claimUpdates: boolean
  }
  updatedAt: string
}

export interface MeetingMinutes {
  id: string
  title: string
  meetingDate: string
  location?: string
  attendees: string[] // Array of user names
  agenda: string[] // Array of agenda items
  discussion: string // Main discussion/notes
  actionItems: Array<{
    item: string
    assignedTo: string // User name
    dueDate?: string
    status: "pending" | "in_progress" | "completed"
  }>
  decisions: string[] // Array of decisions made
  nextMeetingDate?: string
  recordedBy: string // User name who recorded the minutes
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  username: string
  password: string
  role: "user" | "volunteer" | "admin"
  itemsUploaded: number
  claimsSubmitted: number
  joinedAt: string
  vaultPoints: number
  rank: number
  attendanceCount: number
  serviceCount: number
  serviceRecords?: ServiceRecord[]
  claimedItems?: { itemId: string; itemName: string; claimStatus: ClaimStatus; claimedAt: string }[]
  orders?: Order[]
  playbooksAccess?: string[] // IDs of accessible playbooks
}

// Mock Items
export const mockItems: Item[] = [
  {
    id: "1",
    imageUrl: "/black-leather-wallet.png",
    category: "Wallet",
    color: "Black",
    location: "Main Sanctuary - Pew 12",
    dateFounded: "2025-01-15",
    description: "Black leather wallet found in main sanctuary",
    status: "available",
    uploadedBy: "John Doe",
    donationDeadline: "2025-02-14",
    uniqueMarkings: "Embossed initials 'JK' on inside",
  },
  {
    id: "2",
    imageUrl: "/blue-water-bottle.jpg",
    category: "Water Bottle",
    color: "Blue",
    location: "Fellowship Hall",
    dateFounded: "2025-01-16",
    description: "Blue insulated water bottle",
    status: "claimed",
    uploadedBy: "Mary Smith",
    donationDeadline: "2025-02-15",
  },
  {
    id: "3",
    imageUrl: "/silver-wristwatch.png",
    category: "Watch",
    color: "Silver",
    location: "Parking Lot B",
    dateFounded: "2025-01-14",
    description: "Silver wristwatch with black band",
    status: "available",
    uploadedBy: "David Lee",
    donationDeadline: "2025-02-13",
    uniqueMarkings: "Scratched crystal face",
  },
  {
    id: "4",
    imageUrl: "/red-umbrella.jpg",
    category: "Umbrella",
    color: "Red",
    location: "Entrance Lobby",
    dateFounded: "2025-01-17",
    description: "Red compact umbrella",
    status: "available",
    uploadedBy: "Sarah Johnson",
    donationDeadline: "2025-02-16",
  },
  {
    id: "5",
    imageUrl: "/diverse-eyeglasses.png",
    category: "Eyeglasses",
    color: "Black",
    location: "Children's Ministry Room",
    dateFounded: "2025-01-13",
    description: "Black framed reading glasses",
    status: "released",
    uploadedBy: "Mike Wilson",
    donationDeadline: "2025-02-12",
  },
  {
    id: "6",
    imageUrl: "/green-backpack.jpg",
    category: "Backpack",
    color: "Green",
    location: "Youth Room",
    dateFounded: "2025-01-18",
    description: "Green canvas backpack",
    status: "available",
    uploadedBy: "Emily Brown",
    donationDeadline: "2025-02-17",
  },
]

// Mock Claims
export const mockClaims: Claim[] = [
  {
    id: "c1",
    itemId: "2",
    itemName: "Blue Water Bottle",
    itemImage: "/blue-water-bottle.jpg",
    proofImage: "/blue-water-bottle-with-stickers.jpg",
    claimantName: "Jennifer Davis",
    claimantEmail: "jennifer@example.com",
    status: "pending",
    claimedAt: "2025-01-17T10:30:00",
  },
  {
    id: "c2",
    itemId: "5",
    itemName: "Black Eyeglasses",
    itemImage: "/diverse-eyeglasses.png",
    proofImage: "/eyeglasses-on-table.jpg",
    claimantName: "Robert Chen",
    claimantEmail: "robert@example.com",
    status: "released",
    claimedAt: "2025-01-14T14:20:00",
    releaseNotes: "Verified ID and matching prescription details",
    releasedBy: "Volunteer: Tom Anderson",
    releasedAt: "2025-01-15T09:00:00",
  },
]

// Mock Release Logs
export const mockReleaseLogs: ReleaseLog[] = [
  {
    id: "r1",
    itemId: "5",
    itemName: "Black Eyeglasses",
    claimantName: "Robert Chen",
    volunteerName: "Tom Anderson",
    timestamp: "2025-01-15T09:00:00",
    notes: "Verified ID and matching prescription details",
  },
]

// Mock Users
export const mockUsers: User[] = [
  {
    id: "u1",
    name: "John Doe",
    username: "johndoe",
    password: "password123",
    role: "user",
    itemsUploaded: 3,
    claimsSubmitted: 1,
    joinedAt: "2025-01-01",
    vaultPoints: 450,
    rank: 4,
    attendanceCount: 8,
    serviceCount: 3,
    claimedItems: [
      { itemId: "1", itemName: "Black Leather Wallet", claimStatus: "pending", claimedAt: "2025-01-16T10:00:00" },
    ],
    orders: [
      {
        id: "o1",
        title: "Security Protocol Update",
        message: "Please ensure all found items are photographed from at least three angles.",
        status: "unread",
        priority: "high",
        createdAt: "2025-01-20T09:00:00",
      },
    ],
    playbooksAccess: ["pb1"],
  },
  {
    id: "u2",
    name: "Tom Anderson",
    username: "tomanderson",
    password: "password123",
    role: "volunteer",
    itemsUploaded: 0,
    claimsSubmitted: 0,
    joinedAt: "2024-12-15",
    vaultPoints: 0,
    rank: 0,
    attendanceCount: 12,
    serviceCount: 10,
    claimedItems: [],
    orders: [],
    playbooksAccess: ["pb1", "pb2"],
  },
  {
    id: "u3",
    name: "Admin User",
    username: "admin",
    password: "admin123",
    role: "admin",
    itemsUploaded: 0,
    claimsSubmitted: 0,
    joinedAt: "2024-11-01",
    vaultPoints: 0,
    rank: 0,
    attendanceCount: 0,
    serviceCount: 0,
    claimedItems: [],
    orders: [],
    playbooksAccess: ["pb1", "pb2"],
  },
  {
    id: "u4",
    name: "Sarah Johnson",
    username: "sarahjohnson",
    password: "password123",
    role: "user",
    itemsUploaded: 5,
    claimsSubmitted: 2,
    joinedAt: "2024-12-20",
    vaultPoints: 850,
    rank: 1,
    attendanceCount: 15,
    serviceCount: 8,
    claimedItems: [
      { itemId: "3", itemName: "Silver Wristwatch", claimStatus: "pending", claimedAt: "2025-01-15T14:30:00" },
      { itemId: "4", itemName: "Red Umbrella", claimStatus: "released", claimedAt: "2025-01-14T09:15:00" },
    ],
    orders: [],
    playbooksAccess: ["pb1"],
  },
  {
    id: "u5",
    name: "Michael Chen",
    username: "michaelchen",
    password: "password123",
    role: "user",
    itemsUploaded: 2,
    claimsSubmitted: 3,
    joinedAt: "2025-01-05",
    vaultPoints: 620,
    rank: 2,
    attendanceCount: 6,
    serviceCount: 2,
    claimedItems: [
      { itemId: "6", itemName: "Green Backpack", claimStatus: "pending", claimedAt: "2025-01-18T11:00:00" },
      { itemId: "2", itemName: "Blue Water Bottle", claimStatus: "pending", claimedAt: "2025-01-17T10:30:00" },
      { itemId: "5", itemName: "Black Eyeglasses", claimStatus: "released", claimedAt: "2025-01-14T14:20:00" },
    ],
    orders: [],
    playbooksAccess: ["pb2"],
  },
  {
    id: "u6",
    name: "Emily Rodriguez",
    username: "emilyrodriguez",
    password: "password123",
    role: "volunteer",
    itemsUploaded: 1,
    claimsSubmitted: 0,
    joinedAt: "2024-11-15",
    vaultPoints: 0,
    rank: 0,
    attendanceCount: 20,
    serviceCount: 15,
    claimedItems: [],
    orders: [],
    playbooksAccess: ["pb1"],
  },
  {
    id: "u7",
    name: "David Park",
    username: "davidpark",
    password: "password123",
    role: "user",
    itemsUploaded: 1,
    claimsSubmitted: 1,
    joinedAt: "2025-01-10",
    vaultPoints: 150,
    rank: 8,
    attendanceCount: 3,
    serviceCount: 0,
    claimedItems: [
      { itemId: "1", itemName: "Black Leather Wallet", claimStatus: "rejected", claimedAt: "2025-01-12T16:45:00" },
    ],
    orders: [],
    playbooksAccess: ["pb1"],
  },
  {
    id: "u8",
    name: "Jennifer Williams",
    username: "jenniferwilliams",
    password: "password123",
    role: "volunteer",
    itemsUploaded: 0,
    claimsSubmitted: 0,
    joinedAt: "2024-12-01",
    vaultPoints: 0,
    rank: 0,
    attendanceCount: 18,
    serviceCount: 12,
    claimedItems: [],
    orders: [],
    playbooksAccess: ["pb2"],
  },
]

// Mock Playbooks
export const mockPlaybooks: Playbook[] = [
  {
    id: "pb1",
    title: "High-Value Asset Discovery",
    scenario: "Recovery of electronics or jewelry exceeding $500 in value",
    protocol: "Immediate lockdown in Secure Vault B. Require two-person verification for release.",
    priority: "high",
    updatedAt: "2025-01-20T10:00:00",
  },
  {
    id: "pb2",
    title: "Suspicious Claim Pattern",
    scenario: "Multiple claims from same entity within 48-hour window",
    protocol: "Flag for Superuser review. Freeze all active claims for the entity.",
    priority: "critical",
    updatedAt: "2025-01-21T09:30:00",
  },
]

// Mock Missions
export const mockMissions: Mission[] = [
  {
    id: "m1",
    title: "Security Patrol - Main Sanctuary",
    description: "Conduct security sweep of main sanctuary area",
    assignedTo: "u2",
    assignedToName: "Tom Anderson",
    assignedBy: "u3",
    assignedByName: "Admin User",
    priority: "high",
    status: "pending",
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    location: "Main Sanctuary",
    instructions: "Check all entry points, verify security cameras operational, report any suspicious activity.",
    createdAt: "2025-01-22T08:00:00",
    updatedAt: "2025-01-22T08:00:00",
  },
  {
    id: "m2",
    title: "Item Recovery - Parking Lot B",
    description: "Investigate and recover reported lost item in parking area",
    assignedTo: "u6",
    assignedToName: "Emily Rodriguez",
    assignedBy: "u3",
    assignedByName: "Admin User",
    priority: "medium",
    status: "in_progress",
    dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split("T")[0],
    location: "Parking Lot B",
    instructions: "Locate item described in report, secure it, and bring to lost & found office.",
    createdAt: "2025-01-22T09:00:00",
    updatedAt: "2025-01-22T10:30:00",
  },
]

// Mock Locations
export const mockLocations: Location[] = [
  {
    id: "loc1",
    name: "Main Sanctuary - Pew 12",
    description: "Main worship area",
    createdAt: "2025-01-01T00:00:00",
  },
  {
    id: "loc2",
    name: "Fellowship Hall",
    description: "Community gathering space",
    createdAt: "2025-01-01T00:00:00",
  },
  {
    id: "loc3",
    name: "Parking Lot B",
    description: "Secondary parking area",
    createdAt: "2025-01-01T00:00:00",
  },
  {
    id: "loc4",
    name: "Entrance Lobby",
    description: "Main entrance area",
    createdAt: "2025-01-01T00:00:00",
  },
  {
    id: "loc5",
    name: "Children's Ministry Room",
    description: "Children's activities area",
    createdAt: "2025-01-01T00:00:00",
  },
  {
    id: "loc6",
    name: "Youth Room",
    description: "Youth group meeting space",
    createdAt: "2025-01-01T00:00:00",
  },
]

// Audit Log Types - defined above at line 68

export interface AuditLog {
  id: string
  type: AuditLogType
  userId?: string
  userName?: string
  action: string
  details?: string
  timestamp: string
  ipAddress?: string
  severity: "info" | "warning" | "error" | "critical"
}

// Mock Audit Logs
export const mockAuditLogs: AuditLog[] = [
  {
    id: "audit1",
    type: "user_created",
    userId: "u1",
    userName: "John Doe",
    action: "User account created",
    details: "User 'johndoe' created with role 'user'",
    timestamp: "2025-01-01T08:00:00",
    severity: "info",
  },
  {
    id: "audit2",
    type: "item_uploaded",
    userId: "u1",
    userName: "John Doe",
    action: "Item uploaded",
    details: "Black Leather Wallet uploaded",
    timestamp: "2025-01-15T10:30:00",
    severity: "info",
  },
  {
    id: "audit3",
    type: "item_claimed",
    userId: "u1",
    userName: "John Doe",
    action: "Item claimed",
    details: "Claim submitted for Black Leather Wallet",
    timestamp: "2025-01-16T10:00:00",
    severity: "info",
  },
  {
    id: "audit4",
    type: "item_released",
    userId: "u2",
    userName: "Tom Anderson",
    action: "Item released",
    details: "Black Eyeglasses released to Robert Chen",
    timestamp: "2025-01-15T09:00:00",
    severity: "info",
  },
  {
    id: "audit5",
    type: "attendance_marked",
    userId: "u1",
    userName: "John Doe",
    action: "Attendance marked",
    details: "Marked attendance for service on 2025-01-20",
    timestamp: "2025-01-20T10:00:00",
    severity: "info",
  },
]
