"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { ItemCard } from "@/components/item-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getItems, getLocations, initializeStorage } from "@/lib/storage"

export default function BrowsePage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [colorFilter, setColorFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [items, setItems] = useState(getItems())
  const [locations, setLocations] = useState(getLocations())

  useEffect(() => {
    initializeStorage()
    setItems(getItems())
    setLocations(getLocations())
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category.toLowerCase() === categoryFilter
    const matchesColor = colorFilter === "all" || item.color.toLowerCase().includes(colorFilter)
    const matchesLocation =
      locationFilter === "all" || item.location.toLowerCase() === locationFilter.toLowerCase()

    return matchesSearch && matchesCategory && matchesColor && matchesLocation
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar role={user?.role || "user"} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Browse Lost Items</h1>
          <p className="text-muted-foreground">Search through found items to locate your belongings</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          <div className="flex flex-wrap gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="wallet">Wallet</SelectItem>
                <SelectItem value="keys">Keys</SelectItem>
                <SelectItem value="watch">Watch</SelectItem>
                <SelectItem value="water bottle">Water Bottle</SelectItem>
                <SelectItem value="umbrella">Umbrella</SelectItem>
                <SelectItem value="eyeglasses">Eyeglasses</SelectItem>
                <SelectItem value="backpack">Backpack</SelectItem>
              </SelectContent>
            </Select>

            <Select value={colorFilter} onValueChange={setColorFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colors</SelectItem>
                <SelectItem value="black">Black</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="green">Green</SelectItem>
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.name}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Items Grid */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">{filteredItems.length} items found</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              id={item.id}
              imageUrl={item.imageUrl}
              category={item.category}
              color={item.color}
              dateFound={new Date(item.dateFounded)}
              location={item.location}
              status={item.status}
              donationDeadline={item.donationDeadline ? new Date(item.donationDeadline) : undefined}
            />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No items found matching your search criteria</p>
          </div>
        )}
      </main>
    </div>
  )
}
