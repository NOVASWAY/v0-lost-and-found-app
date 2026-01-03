"use client"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { addAuditLog } from "@/lib/audit-logger"
import { getItems, getClaims, initializeStorage, getUserPreferences, updateUserPreferences, getDefaultUserPreferences } from "@/lib/storage"

export default function ProfilePage() {
  const { user, isAuthenticated, changePassword } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [items, setItems] = useState(getItems())
  const [claims, setClaims] = useState(getClaims())
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)

  useEffect(() => {
    initializeStorage()
    setItems(getItems())
    setClaims(getClaims())
    if (user?.id) {
      const userPrefs = getUserPreferences(user.id) || getDefaultUserPreferences()
      setPreferences({ ...userPrefs, userId: user.id })
    }
  }, [user])

  // Protect route - require authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
  }, [isAuthenticated, router])

  // Show nothing while checking authentication
  if (!isAuthenticated) {
    return null
  }

  const userUploads = items.filter((item) => item.uploadedBy === user?.name)
  const userClaims = claims.filter((claim) => claim.claimantName === user?.name)
  const releasedClaims = userClaims.filter((claim) => claim.status === "released")

  const handleSave = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    })
    setIsEditing(false)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)
    const success = await changePassword(currentPassword, newPassword)

    if (success) {
      addAuditLog("user_password_changed", "Password changed", user?.id, user?.name, "User password updated", "info")
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setIsChangingPassword(false)
    } else {
      toast({
        title: "Password Change Failed",
        description: "Current password is incorrect.",
        variant: "destructive",
      })
      setIsChangingPassword(false)
    }
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
            <h3 className="mb-4 text-lg font-semibold text-card-foreground">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}>
                {isChangingPassword ? "Changing Password..." : "Change Password"}
              </Button>
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

          {/* User Preferences */}
          {preferences && (
            <Card className="mt-6 p-6">
              <h3 className="mb-4 text-lg font-semibold text-card-foreground">Preferences</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={preferences.theme}
                    onValueChange={(value: "light" | "dark" | "system") => {
                      const updated = updateUserPreferences(user!.id, { theme: value })
                      setPreferences(updated)
                      // Apply theme immediately
                      if (value === "system") {
                        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
                        document.documentElement.classList.toggle("dark", systemTheme === "dark")
                      } else {
                        document.documentElement.classList.toggle("dark", value === "dark")
                      }
                      toast({
                        title: "Theme Updated",
                        description: `Theme changed to ${value}.`,
                      })
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label>Notifications</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-notif" className="font-normal">Push Notifications</Label>
                        <p className="text-xs text-muted-foreground">Receive browser push notifications</p>
                      </div>
                      <Checkbox
                        id="push-notif"
                        checked={preferences.notifications.push}
                        onCheckedChange={(checked) => {
                          const updated = updateUserPreferences(user!.id, {
                            notifications: { ...preferences.notifications, push: checked === true },
                          })
                          setPreferences(updated)
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="mission-notif" className="font-normal">Mission Updates</Label>
                        <p className="text-xs text-muted-foreground">Get notified about mission assignments</p>
                      </div>
                      <Checkbox
                        id="mission-notif"
                        checked={preferences.notifications.missionUpdates}
                        onCheckedChange={(checked) => {
                          const updated = updateUserPreferences(user!.id, {
                            notifications: { ...preferences.notifications, missionUpdates: checked === true },
                          })
                          setPreferences(updated)
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="claim-notif" className="font-normal">Claim Updates</Label>
                        <p className="text-xs text-muted-foreground">Get notified about claim status changes</p>
                      </div>
                      <Checkbox
                        id="claim-notif"
                        checked={preferences.notifications.claimUpdates}
                        onCheckedChange={(checked) => {
                          const updated = updateUserPreferences(user!.id, {
                            notifications: { ...preferences.notifications, claimUpdates: checked === true },
                          })
                          setPreferences(updated)
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
