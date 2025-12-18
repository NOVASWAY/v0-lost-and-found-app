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

export interface User {
  id: string
  name: string
  email: string
  role: "user" | "volunteer" | "admin"
  itemsUploaded: number
  claimsSubmitted: number
  joinedAt: string
  claimedItems?: { itemId: string; itemName: string; claimStatus: ClaimStatus; claimedAt: string }[]
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
    email: "john@example.com",
    role: "user",
    itemsUploaded: 3,
    claimsSubmitted: 1,
    joinedAt: "2025-01-01",
    claimedItems: [
      { itemId: "1", itemName: "Black Leather Wallet", claimStatus: "pending", claimedAt: "2025-01-16T10:00:00" },
    ],
  },
  {
    id: "u2",
    name: "Tom Anderson",
    email: "tom@example.com",
    role: "volunteer",
    itemsUploaded: 0,
    claimsSubmitted: 0,
    joinedAt: "2024-12-15",
    claimedItems: [],
  },
  {
    id: "u3",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    itemsUploaded: 0,
    claimsSubmitted: 0,
    joinedAt: "2024-11-01",
    claimedItems: [],
  },
  {
    id: "u4",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    role: "user",
    itemsUploaded: 5,
    claimsSubmitted: 2,
    joinedAt: "2024-12-20",
    claimedItems: [
      { itemId: "3", itemName: "Silver Wristwatch", claimStatus: "pending", claimedAt: "2025-01-15T14:30:00" },
      { itemId: "4", itemName: "Red Umbrella", claimStatus: "released", claimedAt: "2025-01-14T09:15:00" },
    ],
  },
  {
    id: "u5",
    name: "Michael Chen",
    email: "michael@example.com",
    role: "user",
    itemsUploaded: 2,
    claimsSubmitted: 3,
    joinedAt: "2025-01-05",
    claimedItems: [
      { itemId: "6", itemName: "Green Backpack", claimStatus: "pending", claimedAt: "2025-01-18T11:00:00" },
      { itemId: "2", itemName: "Blue Water Bottle", claimStatus: "pending", claimedAt: "2025-01-17T10:30:00" },
      { itemId: "5", itemName: "Black Eyeglasses", claimStatus: "released", claimedAt: "2025-01-14T14:20:00" },
    ],
  },
  {
    id: "u6",
    name: "Emily Rodriguez",
    email: "emily@example.com",
    role: "volunteer",
    itemsUploaded: 1,
    claimsSubmitted: 0,
    joinedAt: "2024-11-15",
    claimedItems: [],
  },
  {
    id: "u7",
    name: "David Park",
    email: "david@example.com",
    role: "user",
    itemsUploaded: 1,
    claimsSubmitted: 1,
    joinedAt: "2025-01-10",
    claimedItems: [
      { itemId: "1", itemName: "Black Leather Wallet", claimStatus: "rejected", claimedAt: "2025-01-12T16:45:00" },
    ],
  },
  {
    id: "u8",
    name: "Jennifer Williams",
    email: "jennifer@example.com",
    role: "volunteer",
    itemsUploaded: 0,
    claimsSubmitted: 0,
    joinedAt: "2024-12-01",
    claimedItems: [],
  },
]
