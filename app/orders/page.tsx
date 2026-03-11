"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Search, AlertCircle, Clock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getUsers, initializeStorage, updateUser } from "@/lib/storage"
import { BackButton } from "@/components/back-button"
import type { Order } from "@/lib/mock-data"

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")

  useEffect(() => {
    initializeStorage()
    if (user) {
      const users = getUsers()
      const currentUser = users.find((u) => u.id === user.id)
      setOrders(currentUser?.orders || [])
    }
  }, [user])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const handleMarkAsRead = (orderId: string) => {
    if (!user) return
    const users = getUsers()
    const currentUser = users.find((u) => u.id === user.id)
    if (currentUser) {
      const updatedOrders = currentUser.orders?.map((o) => (o.id === orderId ? { ...o, status: "read" as const } : o)) || []
      updateUser(user.id, { orders: updatedOrders })
      setOrders(updatedOrders)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesPriority = priorityFilter === "all" || order.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const unreadCount = orders.filter((o) => o.status === "unread").length

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Security Orders</h1>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Important security directives and operational updates
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Orders Grid */}
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className={`p-6 border-l-4 transition-all ${
                order.status === "unread"
                  ? "border-l-primary bg-primary/5"
                  : "border-l-muted"
              } ${
                order.priority === "high"
                  ? "border-l-destructive"
                  : order.priority === "medium"
                    ? "border-l-amber-500"
                    : "border-l-primary"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded ${order.status === "unread" ? "bg-primary/20" : "bg-muted"}`}>
                    <AlertCircle className={`w-5 h-5 ${order.status === "unread" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-lg">{order.title}</h3>
                      {order.status === "unread" && (
                        <Badge className="bg-primary/10 text-primary text-[10px] px-2 py-0.5">
                          New
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          order.priority === "high"
                            ? "border-destructive text-destructive"
                            : order.priority === "medium"
                              ? "border-amber-500 text-amber-600"
                              : "border-primary text-primary"
                        }`}
                      >
                        {order.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Issued: {new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-background/50 border border-border/50 p-4 rounded text-sm leading-relaxed whitespace-pre-wrap mb-3">
                {order.message}
              </div>
              {order.status === "unread" && (
                <button
                  onClick={() => handleMarkAsRead(order.id)}
                  className="text-xs text-primary hover:underline"
                >
                  Mark as read
                </button>
              )}
            </Card>
          ))}
          {filteredOrders.length === 0 && (
            <Card className="p-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No orders found</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
