export type ItemStatus = "available" | "claimed" | "released" | "donated"
export type ClaimStatus = "pending" | "released" | "rejected"

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

export interface ServiceRecord {
  id: string
  serviceDate: string
  attended: boolean
  served: boolean
  notes?: string
  recordedBy: string
  recordedAt: string
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
