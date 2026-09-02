"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tag, Plus, Edit, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { occurrenceCategoriesApi, ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { BackButton } from "@/components/back-button"
import { sanitizeInput } from "@/lib/client-security"

const PRESET_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"]

export default function AdminOccurrenceCategoriesPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [categories, setCategories] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null)
  const [newCategory, setNewCategory] = useState({ name: "", color: "#6366f1" })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    occurrenceCategoriesApi.getAll()
      .then((res) => {
        setCategories(res.categories)
      })
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Failed to load categories"
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 w-full bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  const handleSave = async () => {
    const sanitizedName = sanitizeInput(newCategory.name.trim())
    const sanitizedColor = sanitizeInput(newCategory.color.trim())

    if (!sanitizedName) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      })
      return
    }

    if (!sanitizedColor || !/^#[0-9a-fA-F]{6}$/.test(sanitizedColor)) {
      toast({
        title: "Error",
        description: "Please enter a valid hex color",
        variant: "destructive",
      })
      return
    }

    const payload = { name: sanitizedName, color: sanitizedColor }

    try {
      if (editingCategory) {
        await occurrenceCategoriesApi.update(editingCategory.id, payload)
        toast({
          title: "Success",
          description: "Category updated successfully",
        })
      } else {
        await occurrenceCategoriesApi.create(payload)
        toast({
          title: "Success",
          description: "Category created successfully",
        })
      }
      const res = await occurrenceCategoriesApi.getAll()
      setCategories(res.categories)
      setIsDialogOpen(false)
      setTimeout(() => {
        setEditingCategory(null)
        setNewCategory({ name: "", color: "#6366f1" })
      }, 100)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save category"
      toast({ title: "Error", description: message, variant: "destructive" })
    }
  }

  const handleEdit = (category: any) => {
    setEditingCategory(category)
    setNewCategory({ name: category.name, color: category.color || "#6366f1" })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string, name: string) => {
    setItemToDelete({ id, name })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    try {
      await occurrenceCategoriesApi.delete(itemToDelete.id)
      toast({
        title: "Success",
        description: "Category deleted successfully",
      })
      const res = await occurrenceCategoriesApi.getAll()
      setCategories(res.categories)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to delete category"
      toast({ title: "Error", description: message, variant: "destructive" })
    }
    setDeleteDialogOpen(false)
    setItemToDelete(null)
  }

  const resetForm = () => {
    setNewCategory({ name: "", color: "#6366f1" })
    setEditingCategory(null)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BackButton fallbackHref="/admin" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">Occurrence Categories</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage occurrence book categories</p>
            </div>
            <Button onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              New Category
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) {
                handleDialogClose()
              }
            }}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Edit Category" : "Create Category"}</DialogTitle>
                  <DialogDescription className="sr-only">
                    {editingCategory ? "Edit category details" : "Create a new occurrence category"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Category name"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className="h-8 w-8 rounded-full border-2 transition-all"
                          style={{
                            backgroundColor: color,
                            borderColor: newCategory.color === color ? "hsl(var(--foreground))" : "transparent",
                          }}
                          onClick={() => setNewCategory({ ...newCategory, color })}
                          title={color}
                        />
                      ))}
                    </div>
                    <Input
                      id="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      placeholder="#6366f1"
                      maxLength={7}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleDialogClose}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>{editingCategory ? "Update" : "Create"}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {categories.length === 0 ? (
          <Card className="p-12 text-center">
            <Tag className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No categories found. Create your first category.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category: any) => (
              <Card key={category.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color || "#6366f1" }}
                    />
                    <span className="font-medium text-card-foreground">{category.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(category)} title="Edit">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(category.id, category.name)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{itemToDelete?.name}&quot;? Categories linked to existing occurrences cannot be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDeleteDialogOpen(false)
                setItemToDelete(null)
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
