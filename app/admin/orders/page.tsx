"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Plus, MessageSquare } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { ordersApi, usersApi, ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { BackButton } from "@/components/back-button"

export default function AdminOrdersPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [newOrder, setNewOrder] = useState<Partial<any>>({
    title: "",
    message: "",
    priority: "medium",
    userId: "",
  })

  useEffect(() => {
    Promise.all([ordersApi.getAll(), usersApi.getAll()])
      .then(([ordersRes, usersRes]) => {
        setOrders(ordersRes.orders)
        setUsers(usersRes.users)
      })
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Failed to load orders"
        toast({ title: "Error", description: message, variant: "destructive" })
      })
      .finally(() => setIsLoaded(true))
  }, [toast])

  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      router.push("/login")
      return
    }
    if (isLoaded && user?.role !== "admin") {
      router.push("/dashboard")
      return
    }
  }, [isLoaded, isAuthenticated, user, router])

  if (!isLoaded || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
          <div className="mb-6 sm:mb-8 space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-80 bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 w-full bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      order.title.toLowerCase().includes(searchLower) ||
      order.user?.name?.toLowerCase().includes(searchLower) ||
      order.user?.username?.toLowerCase().includes(searchLower) ||
      order.message.toLowerCase().includes(searchLower)
    )
  })

  const handleCreateOrder = async () => {
    if (!newOrder.title || !newOrder.message || !newOrder.userId) {
      toast({
        title: "Error",
        description: "Title, message, and recipient are required",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      await ordersApi.create({
        title: newOrder.title,
        message: newOrder.message,
        priority: newOrder.priority as string,
        userId: newOrder.userId,
      })
      toast({
        title: "Success",
        description: "Order sent successfully",
      })
      const res = await ordersApi.getAll()
      setOrders(res.orders)
      setIsDialogOpen(false)
      setNewOrder({ title: "", message: "", priority: "medium", userId: "" })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to send order"
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const priorityColors: Record<string, string> = {
    high: "bg-destructive text-destructive-foreground",
    medium: "bg-amber-500/20 text-amber-600 border-amber-500/50",
    low: "bg-muted text-muted-foreground",
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BackButton fallbackHref="/admin" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Security Orders</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 w-4 h-4" />
                  New Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Send Security Order</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newOrder.title || ""}
                      onChange={(e) => setNewOrder({ ...newOrder, title: e.target.value })}
                      placeholder="e.g. Weekly service protocol"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <textarea
                      id="message"
                      value={newOrder.message || ""}
                      onChange={(e) => setNewOrder({ ...newOrder, message: e.target.value })}
                      placeholder="Instructions or directive for the recipient"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newOrder.priority || "medium"}
                      onValueChange={(value) => setNewOrder({ ...newOrder, priority: value })}
                    >
                      <SelectTrigger id="priority" className="w-full">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="userId">Recipient *</Label>
                    <Select
                      value={newOrder.userId || ""}
                      onValueChange={(value) => setNewOrder({ ...newOrder, userId: value })}
                    >
                      <SelectTrigger id="userId" className="w-full">
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateOrder} disabled={isSaving} className="w-full">
                    {isSaving ? "Sending..." : "Send Order"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">Send and monitor security directives to users</p>
        </div>

        {/* Search */}
        <Card className="mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, recipient, or message..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{orders.length}</p>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">
              {orders.filter((o) => o.status === "unread").length}
            </p>
            <p className="text-sm text-muted-foreground">Unread</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{orders.filter((o) => o.priority === "high").length}</p>
            <p className="text-sm text-muted-foreground">High Priority</p>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Order</th>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Recipient</th>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Priority</th>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                      No orders to display. Send an order to get started.
                    </td>
                  </tr>
                )}
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm sm:text-base text-card-foreground">{order.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{order.message}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-card-foreground">
                      {order.user?.name || order.user?.username || "Unknown"}
                    </td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 sm:p-4">
                      <Badge variant="outline" className={priorityColors[order.priority] || "bg-muted"}>
                        {order.priority}
                      </Badge>
                    </td>
                    <td className="p-3 sm:p-4">
                      <Badge variant="outline" className={order.status === "unread" ? "bg-blue-500/20 text-blue-600 border-blue-500/50" : "bg-muted text-muted-foreground"}>
                        {order.status}
                      </Badge>
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
