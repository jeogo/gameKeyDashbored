"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Check, MoreVertical, Plus, Search, Tags, Trash } from "lucide-react"
import { IProduct, ICategory } from "@/types/interfaces"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import api, { logApiOperation } from "@/lib/api"
import { ApiErrorFallback } from "@/components/api-error-fallback"

// Schema for product form validation - Modified to allow empty content
const productSchema = z.object({
  name: z.string().min(3, "Name must be at least  characters"),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, "Price must be greater than 0"),
  categoryId: z.string().min(1, "Please select a category"),
  digitalContent: z.array(z.string()).default([]), // Changed to allow empty array
  isAvailable: z.boolean().default(true),
  allowPreorder: z.boolean().default(false),
  preorderNote: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

export default function ProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([])
  const [categories, setCategories] = useState<ICategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [availabilityFilter, setAvailabilityFilter] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const { toast } = useToast()
  const [bulkEntryMode, setBulkEntryMode] = useState(false);
  const [bulkContent, setBulkContent] = useState("");
  const [bulkContentPreview, setBulkContentPreview] = useState<string[]>([]);
  const [showBulkPreview, setShowBulkPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [digitalItemAction, setDigitalItemAction] = useState<{type: 'remove' | 'edit', index: number} | null>(null);

  // Product form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      categoryId: "",
      digitalContent: [""],
      isAvailable: true,
      allowPreorder: false,
      preorderNote: "",
    },
  })

  // Fetch products and categories on component mount
  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      console.log("Fetching products...")
      
      try {
        const response = await api.getProducts()
        logApiOperation("getProducts response", response)
        
        if (Array.isArray(response)) {
          setProducts(response)
        } else if (response && Array.isArray(response.data)) {
          setProducts(response.data)
        } else {
          setProducts([])
          console.warn("Unexpected API response format:", response)
        }
      } catch (error) {
        console.error("API call failed:", error)
        setProducts([])
        
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const categoriesResponse = await api.getCategories()
      if (Array.isArray(categoriesResponse)) {
        setCategories(categoriesResponse)
      } else {
        setCategories([])
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories.",
        variant: "destructive",
      })
    }
  }

  // Filter products based on search term, category, and availability
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = categoryFilter === null || product.categoryId === categoryFilter

    const matchesAvailability = 
      availabilityFilter === null ||
      (availabilityFilter === "available" && product.isAvailable) ||
      (availabilityFilter === "unavailable" && !product.isAvailable)

    return matchesSearch && matchesCategory && matchesAvailability
  })

  const handleAddDigitalContent = () => {
    const { digitalContent } = form.getValues()
    form.setValue('digitalContent', [...digitalContent, ""])
  }

  const handleRemoveDigitalContent = (index: number) => {
    setDigitalItemAction({type: 'remove', index});
    setTimeout(() => setDigitalItemAction(null), 300); // Animation timing
    
    const { digitalContent } = form.getValues();
    form.setValue('digitalContent', digitalContent.filter((_, i) => i !== index));
  }

  const handleCreateProduct = async (data: ProductFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Filter out empty items
      const filteredContent = data.digitalContent.filter(item => item.trim().length > 0);
      
      // If no items, set product to unavailable
      if (filteredContent.length === 0) {
        data.isAvailable = false;
      }
      
      // Update with filtered content
      const productData = {
        ...data,
        digitalContent: filteredContent
      };

      const response = await api.createProduct(productData);
      setProducts([...products, response]);
      setSuccessMessage("Product created successfully!");
      
      setTimeout(() => {
        setIsFormDialogOpen(false);
        form.reset();
        setSuccessMessage(null);
      }, 1500);
    } catch (error) {
      console.error("Failed to create product:", error)
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleUpdateProduct = async (data: ProductFormValues) => {
    if (!selectedProduct?._id) return;
    
    try {
      setIsSubmitting(true);
      
      // Filter out empty items
      const filteredContent = data.digitalContent.filter(item => item.trim().length > 0);
      
      // If no items, set product to unavailable
      if (filteredContent.length === 0) {
        data.isAvailable = false;
      }
      
      // Update with filtered content
      const productData = {
        ...data,
        digitalContent: filteredContent
      };

      const response = await api.updateProduct(selectedProduct._id, productData);
      setProducts(products.map(p => p._id === selectedProduct._id ? response : p));
      setSuccessMessage("Product updated successfully!");
      
      setTimeout(() => {
        setIsFormDialogOpen(false);
        setEditMode(false);
        form.reset();
        setSuccessMessage(null);
      }, 1500);
    } catch (error) {
      console.error("Failed to update product:", error)
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDeleteProduct = async () => {
    if (!selectedProduct?._id) return
    
    try {
      await api.deleteProduct(selectedProduct._id)
      setProducts(products.filter(p => p._id !== selectedProduct._id))
      toast({
        title: "Success",
        description: "Product deleted successfully.",
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

  const openEditDialog = (product: IProduct) => {
    setSelectedProduct(product)
    setEditMode(true)
    setBulkEntryMode(false)
    setSuccessMessage(null)
    
    // Reset form with product data
    form.reset({
      name: product.name,
      description: product.description || "",
      price: product.price,
      categoryId: product.categoryId,
      digitalContent: product.digitalContent || [""],
      isAvailable: product.isAvailable,
      allowPreorder: product.allowPreorder || false,
      preorderNote: product.preorderNote || "",
    })
    
    setIsFormDialogOpen(true)
  }

  const openCreateDialog = () => {
    setSelectedProduct(null)
    setEditMode(false)
    setBulkEntryMode(false)
    setSuccessMessage(null)
    form.reset({
      name: "",
      description: "",
      price: 0,
      categoryId: categories.length > 0 ? categories[0]._id || "" : "",
      digitalContent: [""],
      isAvailable: true,
      allowPreorder: false,
      preorderNote: "",
    })
    setIsFormDialogOpen(true)
  }

  const openDetailsDialog = (product: IProduct) => {
    setSelectedProduct(product)
    setIsDetailsDialogOpen(true)
  }

  const openDeleteDialog = (product: IProduct) => {
    setSelectedProduct(product)
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

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c._id === categoryId)
    return category ? category.name : "Unknown"
  }

  // Enhanced bulk content processing
  const processBulkContent = (rawContent: string) => {
    return rawContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  };

  const handleBulkContentChange = (value: string) => {
    // Process and update the digital content directly
    const contentLines = value
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    form.setValue('digitalContent', contentLines);
    
    // Auto-update isAvailable based on content
    if (contentLines.length === 0 && form.getValues().isAvailable) {
      form.setValue('isAvailable', false);
    }
  };

  const getDigitalContentForBulkEdit = () => {
    const content = form.getValues().digitalContent;
    // Filter out empty items and join with newlines
    return content.filter(item => item.trim().length > 0).join("\n");
  };

  const handlePreviewBulkContent = () => {
    const lines = processBulkContent(bulkContent);
    setBulkContentPreview(lines);
    setShowBulkPreview(true);
  };

  const handleConfirmBulkContent = () => {
    if (bulkContentPreview.length > 0) {
      const existingContent = form.getValues().digitalContent;
      form.setValue("digitalContent", [...existingContent, ...bulkContentPreview]);
      setShowBulkPreview(false);
      setBulkContent("");
      setBulkEntryMode(false);

      toast({
        title: "Content Added",
        description: `${bulkContentPreview.length} items have been added to the product content.`,
      });
    }
  };

  const handleCancelBulkPreview = () => {
    setShowBulkPreview(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Manage your digital products inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Select
                value={categoryFilter ?? "all-categories"}
                onValueChange={(value) => setCategoryFilter(value === "all-categories" ? null : value)}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-categories">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id || ""}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={availabilityFilter ?? "all-status"}
                onValueChange={(value) => setAvailabilityFilter(value === "all-status" ? null : value)}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-status">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-4 w-40" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="flex space-x-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <div className="pt-4 border-t flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="border rounded-md p-8 text-center text-muted-foreground">
              <p>No products found</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter(null);
                  setAvailabilityFilter(null);
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product._id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate" title={product.name}>
                          {product.name}
                        </h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetailsDialog(product)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(product)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(product)}
                              className="text-red-600 focus:text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Category</span>
                        <span>{getCategoryName(product.categoryId)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price</span>
                        <span className="font-semibold">${product.price.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {product.isAvailable ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                            Available
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                            Unavailable
                          </Badge>
                        )}
                        
                        {product.allowPreorder && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                            Preorder
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Inventory</span>
                        <span>{product.digitalContent?.length || 0} items</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 bg-muted/40 p-3 border-t flex justify-end items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailsDialog(product)}
                      >
                        View
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openEditDialog(product)}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Details Dialog */}
      {selectedProduct && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
              <DialogDescription>
                Product details and inventory information
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="details">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="inventory">Digital Inventory</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Category</h3>
                    <p>{getCategoryName(selectedProduct.categoryId)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Price</h3>
                    <p className="text-xl font-semibold">${selectedProduct.price.toFixed(2)}</p>
                  </div>
                  
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                    <p className="text-sm whitespace-pre-wrap">{selectedProduct.description || "No description provided"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                    <div className="flex items-center">
                      {selectedProduct.isAvailable ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                          <span>Available</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                          <span>Unavailable</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Pre-order</h3>
                    <div className="flex items-center">
                      {selectedProduct.allowPreorder ? (
                        <>
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          <span>Allowed</span>
                        </>
                      ) : (
                        <span>Not allowed</span>
                      )}
                    </div>
                    {selectedProduct.allowPreorder && selectedProduct.preorderNote && (
                      <p className="text-sm mt-1">{selectedProduct.preorderNote}</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
                    <p>{formatDate(selectedProduct.createdAt)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
                    <p>{formatDate(selectedProduct.updatedAt)}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="inventory" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Digital Content Items ({selectedProduct.digitalContent?.length || 0})</h3>
                    {selectedProduct.digitalContent && selectedProduct.digitalContent.length > 0 ? (
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>Content</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedProduct.digitalContent.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">#{index + 1}</TableCell>
                                <TableCell className="font-mono text-sm">{item}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No digital content items available</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button onClick={() => openEditDialog(selectedProduct)}>Edit Product</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Product Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={(open) => {
        if (!isSubmitting) {
          setIsFormDialogOpen(open)
          if (!open) {
            form.reset()
            setSuccessMessage(null)
          }
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit Product" : "Create New Product"}</DialogTitle>
            <DialogDescription>
              {editMode ? "Update product details and inventory" : "Add a new digital product to your store"}
            </DialogDescription>
          </DialogHeader>
          
          {successMessage ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="bg-green-50 text-green-700 p-4 rounded-md mb-4 flex items-center">
                <Check className="h-6 w-6 mr-2" />
                <span className="font-medium">{successMessage}</span>
              </div>
              <p className="text-muted-foreground text-sm">Redirecting...</p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(editMode ? handleUpdateProduct : handleCreateProduct)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
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
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter product description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                            <SelectItem key={category._id} value={category._id || ""}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Streamlined Digital Content Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel>
                      <div className="flex items-center">
                        Digital Content Items
                        <Badge variant="outline" className="ml-2 bg-muted">
                          {form.getValues().digitalContent.filter(item => item.trim().length > 0).length}
                        </Badge>
                      </div>
                    </FormLabel>
                  </div>

                  <div className="space-y-2">
                    <div className="rounded-md border overflow-hidden">
                      <Textarea
                        placeholder="Enter one item per line:
example1@mail.com:password123
example2@mail.com:password456
activation-code-12345"
                        value={getDigitalContentForBulkEdit()}
                        onChange={(e) => handleBulkContentChange(e.target.value)}
                        rows={6}
                        className="font-mono text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-y"
                      />
                      <div className="bg-muted/30 p-2 border-t flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          مساحة متعددة للإدخال — سطر واحد لكل عنصر
                        </span>
                        <span className="text-xs font-medium">
                          {form.getValues().digitalContent.filter(item => item.trim().length > 0).length} items
                        </span>
                      </div>
                    </div>

                    {/* Visual representation of individual items with easier deletion */}
                    {form.getValues().digitalContent.filter(item => item.trim().length > 0).length > 0 && (
                      <div className="border rounded-md overflow-hidden mt-4">
                        <div className="p-2 bg-muted/30 border-b flex justify-between items-center">
                          <span className="text-xs font-medium">Items Preview</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => form.setValue('digitalContent', [""])}
                          >
                            Clear All
                          </Button>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-0.5">
                          {form.getValues().digitalContent.map((item, index) => (
                            item.trim().length > 0 && (
                              <div 
                                key={index} 
                                className={`flex items-center gap-2 p-2 hover:bg-muted/40 rounded-md transition-colors ${
                                  digitalItemAction?.type === 'remove' && digitalItemAction.index === index 
                                    ? 'opacity-0 scale-95 transition-all' 
                                    : 'opacity-100'
                                }`}
                              >
                                <div className="flex-grow font-mono text-sm truncate">{item}</div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveDigitalContent(index)}
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Add warning for 0 items */}
                {form.getValues().digitalContent.filter(item => item.trim().length > 0).length === 0 && (
                  <div className="rounded-md bg-amber-50 p-3 text-amber-800 text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2 flex-shrink-0">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium">No digital content items</p>
                      <p>Product will be saved as unavailable</p>
                    </div>
                  </div>
                )}
                
                {/* Update isAvailable FormField to disable when no items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isAvailable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                        <div className="space-y-0.5">
                          <FormLabel>Available for Purchase</FormLabel>
                          <FormDescription>
                            {form.getValues().digitalContent.filter(item => item.trim().length > 0).length === 0 
                              ? "Requires digital content items to be available"
                              : "Make this product available in the store"}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                            disabled={form.getValues().digitalContent.filter(item => item.trim().length > 0).length === 0}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="allowPreorder"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-4 border rounded-md">
                        <div className="space-y-0.5">
                          <FormLabel>Allow Pre-orders</FormLabel>
                          <FormDescription>Enable pre-ordering for this product</FormDescription>
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
                </div>
                
                {form.watch("allowPreorder") && (
                  <FormField
                    control={form.control}
                    name="preorderNote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pre-order Note</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Will be delivered within 2 days" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {editMode ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      editMode ? "Update Product" : "Create Product"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 border rounded-md bg-red-50">
            <p className="font-medium">{selectedProduct?.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Category: {selectedProduct ? getCategoryName(selectedProduct.categoryId) : ""}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>Delete Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

