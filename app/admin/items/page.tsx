"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/status-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { mockItems } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"

export default function AdminItemsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  // Protect route - require authentication and admin role
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    if (user?.role !== "admin") {
      router.push("/dashboard")
      return
    }
  }, [isAuthenticated, user, router])

  // Show nothing while checking authentication
  if (!isAuthenticated || user?.role !== "admin") {
    return null
  }
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredItems = mockItems.filter((item) => {
    const matchesSearch =
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const availableCount = mockItems.filter((i) => i.status === "available").length
  const releasedCount = mockItems.filter((i) => i.status === "released").length
  const donatedCount = mockItems.filter((i) => i.status === "donated").length

  return (
    <div className="min-h-screen bg-background">
      <Navbar role={user?.role || "admin"} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Items Management</h1>
          <p className="text-muted-foreground">View and monitor all items in the system</p>
        </div>

        {/* Filters */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="claimed">Claimed</SelectItem>
                  <SelectItem value="released">Released</SelectItem>
                  <SelectItem value="donated">Donated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{mockItems.length}</p>
            <p className="text-sm text-muted-foreground">Total Items</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{availableCount}</p>
            <p className="text-sm text-muted-foreground">Available</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{releasedCount}</p>
            <p className="text-sm text-muted-foreground">Released</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{donatedCount}</p>
            <p className="text-sm text-muted-foreground">Donated</p>
          </Card>
        </div>

        {/* Items Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Item</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Category</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Location</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Date Found</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Uploaded By</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <div className="relative h-12 w-12 overflow-hidden rounded border border-border">
                        <Image
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.category}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-card-foreground">{item.category}</p>
                      <p className="text-sm text-muted-foreground">{item.color}</p>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{item.location}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(item.dateFounded).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{item.uploadedBy}</td>
                    <td className="p-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="p-4">
                      <Link href={`/items/${item.id}`}>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  )
}
