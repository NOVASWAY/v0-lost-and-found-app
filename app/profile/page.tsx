"use client"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { mockItems, mockClaims } from "@/lib/mock-data"

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || "")

  const userUploads = mockItems.filter((item) => item.uploadedBy === user?.name)
  const userClaims = mockClaims.filter((claim) => claim.claimantName === user?.name)
  const releasedClaims = userClaims.filter((claim) => claim.status === "released")

  const handleSave = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    })
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role={user?.role || "user"} />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account information</p>
          </div>

          <Card className="p-6">
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault()
                handleSave()
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" type="text" value={user?.username || ""} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" type="text" value={user?.role || "user"} disabled className="capitalize" />
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="mb-4 text-lg font-semibold text-card-foreground">Change Password</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" disabled={!isEditing} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {!isEditing ? (
                  <Button type="button" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button type="submit">Save Changes</Button>
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </form>
          </Card>

          <Card className="mt-6 p-6">
            <h3 className="mb-4 text-lg font-semibold text-card-foreground">Account Statistics</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-2xl font-bold text-card-foreground">{userUploads.length}</p>
                <p className="text-sm text-muted-foreground">Items Uploaded</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{userClaims.length}</p>
                <p className="text-sm text-muted-foreground">Claims Submitted</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{releasedClaims.length}</p>
                <p className="text-sm text-muted-foreground">Items Received</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
