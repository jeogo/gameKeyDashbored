"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Plus,
  Search,
  Trash,
  Edit,
  Package,
  DollarSign,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  ShoppingBag,
  CheckCircle,
  XCircle
} from "lucide-react"
import { IProduct, ICategory } from "@/types/interfaces"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Updated schema with required fields matching backend
const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  categoryId: z.string().min(1, "Please select a category"),
  digitalContent: z.array(z.string()).min(1, "At least one digital content item is required"),
  isAvailable: z.boolean().default(true),
  allowPreorder: z.boolean().default(false),
})

type ProductFormValues = z.infer<typeof productSchema>

export default function ProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([])
  const [categories, setCategories] = useState<ICategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [bulkEntryMode, setBulkEntryMode] = useState(false)
  const [bulkContent, setBulkContent] = useState("")
  const { toast } = useToast()

  // Product form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      categoryId: "",
      digitalContent: [],
      isAvailable: true,
      allowPreorder: false,
    },
  })

  // Fetch data on component mount
  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [productsResponse, categoriesResponse] = await Promise.all([
        api.getProducts(),
        api.getCategories()
      ])

      // Handle products response
      let productData: IProduct[] = []
      if (Array.isArray(productsResponse)) {
        productData = productsResponse
      } else if (productsResponse && typeof productsResponse === 'object' && 'data' in productsResponse) {
        productData = productsResponse.data as IProduct[]
      }

      // Handle categories response
      let categoryData: ICategory[] = []
      if (Array.isArray(categoriesResponse)) {
        categoryData = categoriesResponse
      } else if (categoriesResponse && Array.isArray(categoriesResponse.data)) {
        categoryData = categoriesResponse.data
      }

      setProducts(productData)
      setCategories(categoryData)
    } catch (error) {
      console.error("Failed to fetch data:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load data"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
  }

  // Filter products - optimized with useMemo for better performance
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = !searchTerm ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategory = categoryFilter === "all" ||
        product.categoryId === categoryFilter

      const matchesAvailability = availabilityFilter === "all" ||
        (availabilityFilter === "available" && product.isAvailable) ||
        (availabilityFilter === "unavailable" && !product.isAvailable)

      return matchesSearch && matchesCategory && matchesAvailability
    })
  }, [products, searchTerm, categoryFilter, availabilityFilter])

  // Get category name
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId)
    return category?.name || "Unknown Category"
  }

  // Handle form submission
  const onSubmit = async (data: ProductFormValues) => {
    try {
      setIsSubmitting(true)

      // Process bulk content if in bulk mode
      if (bulkEntryMode && bulkContent.trim()) {
        const bulkItems = bulkContent
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
        data.digitalContent = [...data.digitalContent, ...bulkItems]
      }

      // Filter out empty strings from digitalContent
      const cleanedDigitalContent = data.digitalContent.filter(item => item.trim().length > 0)

      // Validate that we have at least one digital content item
      if (cleanedDigitalContent.length === 0) {
        toast({
          title: "Validation Error",
          description: "At least one digital content item is required",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Clean up the data before sending - include all required fields
      const productData = {
        name: data.name,
        categoryId: data.categoryId,
        price: data.price,
        digitalContent: cleanedDigitalContent,
        isAvailable: data.isAvailable,
        allowPreorder: data.allowPreorder,
        ...(data.description && data.description.trim() ? { description: data.description } : {}),
      }

      if (editMode && selectedProduct) {
        const response = await api.updateProduct(selectedProduct._id!, productData)
        const updatedProduct = 'data' in response ? response.data : response
        setProducts(products.map(p => p._id === selectedProduct._id ? updatedProduct : p))
        toast({
          title: "Success",
          description: "Product updated successfully",
        })
      } else {
        const response = await api.createProduct(productData)
        const newProduct = 'data' in response ? response.data : response
        setProducts([...products, newProduct])
        toast({
          title: "Success",
          description: "Product created successfully",
        })
      }

      handleCloseForm()
    } catch (error) {
      console.error("Failed to save product:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to save product"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedProduct) return

    try {
      await api.deleteProduct(selectedProduct._id!)
      setProducts(products.filter(p => p._id !== selectedProduct._id))
      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
      setIsDeleteDialogOpen(false)
      setSelectedProduct(null)
    } catch (error) {
      console.error("Failed to delete product:", error)
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle form open/close
  const handleOpenForm = (product?: IProduct) => {
    setEditMode(!!product)
    setSelectedProduct(product || null)

    if (product) {
      form.reset({
        name: product.name,
        description: product.description || "",
        price: product.price,
        categoryId: product.categoryId,
        digitalContent: product.digitalContent || [],
        isAvailable: product.isAvailable,
        allowPreorder: product.allowPreorder || false,
      })
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        categoryId: "",
        digitalContent: [],
        isAvailable: true,
        allowPreorder: false,
      })
    }

    setBulkEntryMode(false)
    setBulkContent("")
    setIsFormDialogOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormDialogOpen(false)
    setEditMode(false)
    setSelectedProduct(null)
    setBulkEntryMode(false)
    setBulkContent("")
    form.reset()
  }

  // Add/remove digital content items
  const addDigitalContentItem = () => {
    const currentContent = form.getValues("digitalContent")
    form.setValue("digitalContent", [...currentContent, ""])
  }

  const removeDigitalContentItem = (index: number) => {
    const currentContent = form.getValues("digitalContent")
    form.setValue("digitalContent", currentContent.filter((_, i) => i !== index))
  }

  const updateDigitalContentItem = (index: number, value: string) => {
    const currentContent = form.getValues("digitalContent")
    const newContent = [...currentContent]
    newContent[index] = value
    form.setValue("digitalContent", newContent)
  }

  // Calculate stats - optimized with useMemo
  const stats = useMemo(() => {
    const available = products.filter(p => p.isAvailable).length
    const unavailable = products.length - available
    const avgPrice = products.length > 0
      ? products.reduce((sum, p) => sum + p.price, 0) / products.length
      : 0
    return {
      total: products.length,
      available,
      unavailable,
      avgPrice
    }
  }, [products])

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  // Get status icon
  const getStatusIcon = (isAvailable: boolean) => {
    if (isAvailable) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    }
    return <XCircle className="h-5 w-5 text-red-600" />
  }

  // Get status color
  const getStatusColor = (isAvailable: boolean) => {
    if (isAvailable) {
      return 'bg-green-100 text-green-800 border-green-200'
    }
    return 'bg-red-100 text-red-800 border-red-200'
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Product Management</h1>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground">
            Manage your digital products and inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => handleOpenForm()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <EyeOff className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unavailable</p>
                <p className="text-2xl font-bold text-red-600">{stats.unavailable}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Price</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.avgPrice > 0 ? formatPrice(stats.avgPrice) : "$0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category._id} value={category._id!}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No products found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== "all" || availabilityFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first product"
              }
            </p>
            {!searchTerm && categoryFilter === "all" && availabilityFilter === "all" && (
              <Button onClick={() => handleOpenForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product._id} className="hover:shadow-lg transition-all duration-200 border-2">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(product.isAvailable)}
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        ID: {product._id?.substring(0, 12)}...
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(product.isAvailable)} border`}>
                    {product.isAvailable ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="text-lg font-bold text-green-600">{formatPrice(product.price)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <Badge variant="outline" className="text-xs">
                      {getCategoryName(product.categoryId)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Digital Content</span>
                    <span className="text-sm font-medium">{product.digitalContent.length} items</span>
                  </div>
                </div>
                {product.description && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedProduct(product)
                    setIsDetailsDialogOpen(true)
                  }}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenForm(product)}
                >
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setSelectedProduct(product)
                    setIsDeleteDialogOpen(true)
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Product Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Product" : "Create New Product"}
            </DialogTitle>
            <DialogDescription>
              {editMode ? "Update the product information" : "Add a new digital product to your inventory"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Steam Gift Card $50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="47.99" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category._id} value={category._id!}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digital Steam gift card valid worldwide"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description of the product
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Available for Purchase
                      </FormLabel>
                      <FormDescription>
                        Enable this product for customers to purchase
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allowPreorder"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Allow Preorder
                      </FormLabel>
                      <FormDescription>
                        Allow customers to preorder this product before it's available
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Digital Content Section */}
              <div className="space-y-4">
                <FormLabel>Digital Content</FormLabel>
                <Tabs value={bulkEntryMode ? "bulk" : "individual"} onValueChange={(value) => setBulkEntryMode(value === "bulk")}>
                  <TabsList>
                    <TabsTrigger value="individual">Individual Entry</TabsTrigger>
                    <TabsTrigger value="bulk">Bulk Entry</TabsTrigger>
                  </TabsList>

                  <TabsContent value="individual" className="space-y-4">
                    {form.watch("digitalContent").map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="STEAM-XXXX-YYYY-ZZZZ or email:password"
                          value={item}
                          onChange={(e) => updateDigitalContentItem(index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDigitalContentItem(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addDigitalContentItem}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Content Item
                    </Button>
                  </TabsContent>

                  <TabsContent value="bulk" className="space-y-4">
                    <Textarea
                      placeholder="Enter one item per line&#10;STEAM-XXXX-YYYY-ZZZZ&#10;email1@example.com:password1&#10;email2@example.com:password2"
                      value={bulkContent}
                      onChange={(e) => setBulkContent(e.target.value)}
                      rows={6}
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter one item per line. These will be added to existing content.
                    </p>
                  </TabsContent>
                </Tabs>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {editMode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editMode ? "Update Product" : "Create Product"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Product Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-medium">{selectedProduct.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Price</label>
                  <p className="text-lg font-medium">{formatPrice(selectedProduct.price)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p>{getCategoryName(selectedProduct.categoryId)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p>{selectedProduct.isAvailable ? "Available" : "Unavailable"}</p>
                </div>
              </div>

              {selectedProduct.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1">{selectedProduct.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Digital Content ({selectedProduct.digitalContent.length} items)
                </label>
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                  {selectedProduct.digitalContent.map((item, index) => (
                    <div key={index} className="text-sm font-mono bg-muted p-2 rounded">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsDetailsDialogOpen(false)
              handleOpenForm(selectedProduct!)
            }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{selectedProduct?.name}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash className="mr-2 h-4 w-4" />
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
