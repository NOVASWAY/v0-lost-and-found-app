"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MapPin, Plus, Edit, Trash2, Search } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getLocations, addLocation, updateLocation, deleteLocation, initializeStorage } from "@/lib/storage"
import { addAuditLog } from "@/lib/audit-logger"
import { useToast } from "@/hooks/use-toast"
import { BackButton } from "@/components/back-button"
import type { Location } from "@/lib/mock-data"

export default function AdminLocationsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [locations, setLocations] = useState<Location[]>(getLocations())
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [newLocation, setNewLocation] = useState<Partial<Location>>({
    name: "",
    description: "",
  })

  useEffect(() => {
    initializeStorage()
    setLocations(getLocations())
  }, [])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== "admin") {
    return null
  }

  const filteredLocations = locations.filter((loc) => {
    const searchLower = searchQuery.toLowerCase()
    return loc.name.toLowerCase().includes(searchLower) || (loc.description || "").toLowerCase().includes(searchLower)
  })

  const handleSaveLocation = () => {
    if (!newLocation.name?.trim()) {
      toast({
        title: "Error",
        description: "Location name is required",
        variant: "destructive",
      })
      return
    }

    if (editingLocation) {
      const updated = updateLocation(editingLocation.id, {
        name: newLocation.name,
        description: newLocation.description || "",
      })
      if (updated) {
        addAuditLog(
          "location_updated",
          "Location updated",
          user.id,
          user.name,
          `Location '${newLocation.name}' updated`,
          "info"
        )
        toast({
          title: "Success",
          description: "Location updated successfully",
        })
        setLocations(getLocations())
        setIsDialogOpen(false)
        setEditingLocation(null)
        setNewLocation({ name: "", description: "" })
      }
    } else {
      const added = addLocation({
        id: `loc${Math.random().toString(36).substr(2, 9)}`,
        name: newLocation.name,
        description: newLocation.description || "",
        createdAt: new Date().toISOString(),
      })
      if (added) {
        addAuditLog(
          "location_created",
          "Location created",
          user.id,
          user.name,
          `Location '${newLocation.name}' created`,
          "info"
        )
        toast({
          title: "Success",
          description: "Location created successfully",
        })
        setLocations(getLocations())
        setIsDialogOpen(false)
        setNewLocation({ name: "", description: "" })
      }
    }
  }

  const handleDeleteLocation = (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return

    const location = locations.find((l) => l.id === id)
    if (location) {
      deleteLocation(id)
      addAuditLog("location_deleted", "Location deleted", user.id, user.name, `Location '${location.name}' deleted`, "warning")
      toast({
        title: "Success",
        description: "Location deleted successfully",
      })
      setLocations(getLocations())
    }
  }

  const openEditDialog = (location: Location) => {
    setEditingLocation(location)
    setNewLocation({
      name: location.name,
      description: location.description || "",
    })
    setIsDialogOpen(true)
  }

  const openNewDialog = () => {
    setEditingLocation(null)
    setNewLocation({ name: "", description: "" })
    setIsDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BackButton fallbackHref="/admin" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Location Management</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog}>
                  <Plus className="mr-2 w-4 h-4" />
                  Add Location
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingLocation ? "Edit Location" : "Create New Location"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Location Name *</Label>
                    <Input
                      id="name"
                      value={newLocation.name || ""}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      placeholder="e.g., Main Entrance, Parking Lot A"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newLocation.description || ""}
                      onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                      placeholder="Optional description..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveLocation}>
                      {editingLocation ? "Update" : "Create"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">Manage locations where items are found</p>
        </div>

        {/* Search */}
        <Card className="mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {/* Locations Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLocations.map((location) => (
            <Card key={location.id} className="p-6 hover:border-primary/50 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded bg-primary/10">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{location.name}</h3>
                    {location.description && (
                      <p className="text-sm text-muted-foreground">{location.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {new Date(location.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(location)}
                  className="flex-1"
                >
                  <Edit className="mr-2 w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteLocation(location.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 w-4 h-4" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
          {filteredLocations.length === 0 && (
            <Card className="p-12 text-center col-span-full">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No locations found</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
