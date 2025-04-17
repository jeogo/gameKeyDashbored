"use client"
import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, MoreVertical, Plus, Search, Trash } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { ICategory } from "@/types/interfaces"
import api, { logApiOperation } from "@/lib/api";
import { ApiErrorFallback } from "@/components/api-error-fallback";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | string | null>(null);
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [categoryName, setCategoryName] = useState("")
  const [categoryDescription, setCategoryDescription] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null);
      console.log("Fetching categories...")
      try {
        const response = await api.getCategories()
        logApiOperation("getCategories response", response);
        
        if (Array.isArray(response)) {
          setCategories(response);
        } else {
          console.warn("Unexpected API response format:", response);
          setError("API returned unexpected data format");
          setCategories([]);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error)
        setError(error instanceof Error ? error : "Failed to fetch categories");
        setCategories([]);
        
        toast({
          title: "Error",
          description: "Failed to load categories. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return

    try {
      const newCategory = {
        name: categoryName,
        description: categoryDescription || undefined
      }
      
      const created = await api.createCategory(newCategory)
      logApiOperation("createCategory response", created);
      
      setCategories([...categories, created])
      
      toast({
        title: "Success",
        description: "Category created successfully.",
      })
      
      setIsEditDialogOpen(false)
      setCategoryName("")
      setCategoryDescription("")
    } catch (error) {
      console.error("Failed to create category:", error)
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateCategory = async () => {
    if (!selectedCategory?._id || !categoryName.trim()) return

    try {
      const updatedCategory = await api.updateCategory(selectedCategory._id, {
        name: categoryName,
        description: categoryDescription || undefined
      })

      setCategories(categories.map(cat => 
        cat._id === selectedCategory._id ? updatedCategory : cat
      ))

      toast({
        title: "Success",
        description: "Category updated successfully.",
      })

      setIsEditDialogOpen(false)
      setSelectedCategory(null)
      setCategoryName("")
      setCategoryDescription("")
    } catch (error) {
      console.error("Failed to update category:", error)
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async () => {
    if (!selectedCategory?._id) return

    try {
      await api.deleteCategory(selectedCategory._id)
      setCategories(categories.filter(cat => cat._id !== selectedCategory._id))

      toast({
        title: "Success",
        description: "Category deleted successfully.",
      })

      setIsDeleteDialogOpen(false)
      setSelectedCategory(null)
    } catch (error) {
      console.error("Failed to delete category:", error)
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openCreateDialog = () => {
    setEditMode(false)
    setCategoryName("")
    setCategoryDescription("")
    setSelectedCategory(null)
    setIsEditDialogOpen(true)
  }

  const openEditDialog = (category: ICategory) => {
    setEditMode(true)
    setSelectedCategory(category)
    setCategoryName(category.name)
    setCategoryDescription(category.description || "")
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (category: ICategory) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  const formatDate = (dateValue: string | Date) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categories Management</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {error && <ApiErrorFallback error={error} resetFn={fetchCategories} />}

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Manage your product categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 w-full max-w-sm">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search categories..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="max-w-sm truncate">
                        {category.description || "—"}
                      </TableCell>
                      <TableCell>{formatDate(category.createdAt)}</TableCell>
                      <TableCell>{formatDate(category.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(category)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(category)}
                                className="text-red-600 focus:text-red-600"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit/Create Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit Category" : "Create Category"}</DialogTitle>
            <DialogDescription>
              {editMode ? "Update existing category details" : "Add a new product category"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                placeholder="Category name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Category description (optional)"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editMode ? handleUpdateCategory : handleCreateCategory}>
              {editMode ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 border rounded-md bg-red-50">
            <p className="font-medium">{selectedCategory?.name}</p>
            {selectedCategory?.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedCategory.description}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

