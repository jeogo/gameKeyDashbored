"use client"
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Eye, MoreVertical, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { IOrder } from "@/types/interfaces"
import api, { logApiOperation } from "@/lib/api"
import { ApiErrorFallback } from "@/components/api-error-fallback"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function OrdersPage() {
  const [orders, setOrders] = useState<IOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isFulfillDialogOpen, setIsFulfillDialogOpen] = useState(false)
  const [fulfillmentContent, setFulfillmentContent] = useState("")
  const [fulfillmentNote, setFulfillmentNote] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [orderTypeFilter, setOrderTypeFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, orderTypeFilter, searchTerm])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      setIsRefreshing(true)
      console.log("Fetching orders...")

      try {
        const response = await api.getOrders()
        logApiOperation("getOrders response", response)

        // Handle various API response formats
        if (response && typeof response === 'object' && 'orders' in response && Array.isArray(response.orders)) {
          // If API returns { orders: [...] }
          setOrders(response.orders)
        } else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
          // If API returns { data: [...] }
          setOrders(response.data)
        } else if (Array.isArray(response)) {
          // If API returns orders array directly
          setOrders(response)
        } else {
          console.warn("Unexpected API response format:", response)
          setError("API returned unexpected data format")
          setOrders([]) // No more sample data
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error)
        setError(error instanceof Error ? error : "Failed to fetch orders")
        setOrders([]) // No more sample data
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: "pending" | "completed" | "cancelled", note?: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus, note)
      
      // Update local state
      setOrders(orders.map(order => 
        order._id === orderId ? {
          ...order,
          status: newStatus,
          updatedAt: new Date(),
          completedAt: newStatus === "completed" ? new Date() : order.completedAt,
          statusHistory: [...(order.statusHistory || []), {
            status: newStatus,
            timestamp: new Date(),
            note
          }]
        } : order
      ))
      
      // Update selected order if open in dialog
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
          updatedAt: new Date(),
          completedAt: newStatus === "completed" ? new Date() : selectedOrder.completedAt,
          statusHistory: [...(selectedOrder.statusHistory || []), {
            status: newStatus,
            timestamp: new Date(),
            note
          }]
        })
      }
      
      toast({
        title: "Status Updated",
        description: `Order status changed to ${newStatus}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    }
  }

  const handleFulfillPreorder = async () => {
    if (!selectedOrder?._id) return
    
    try {
      // Call API to fulfill preorder with content and mark as completed
      const result = await api.fulfillPreorder(selectedOrder._id, {
        digitalContent: fulfillmentContent,
        note: fulfillmentNote
      });
      
      // Update local state
      setOrders(orders.map(order => 
        order._id === selectedOrder._id ? {
          ...order,
          status: "completed",
          updatedAt: new Date(),
          completedAt: new Date(),
          preorderConfirmationDate: new Date(),
          statusHistory: [...(order.statusHistory || []), {
            status: "completed",
            timestamp: new Date(),
            note: fulfillmentNote
          }]
        } : order
      ))
      
      toast({
        title: "Preorder Fulfilled",
        description: "The preorder has been fulfilled and completed successfully.",
      })
      
      setIsFulfillDialogOpen(false)
      setFulfillmentContent("")
      setFulfillmentNote("")
      setIsDetailsDialogOpen(false) // Close the details dialog too
    } catch (error) {
      console.error("Failed to fulfill preorder:", error)
      toast({
        title: "Error",
        description: "Failed to fulfill preorder. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      order._id?.toLowerCase().includes(searchLower) ||
      order.status.toLowerCase().includes(searchLower) ||
      order.type.toLowerCase().includes(searchLower);
      
    const matchesStatus = 
      statusFilter === null || 
      order.status === statusFilter;
      
    const matchesType =
      orderTypeFilter === null ||
      order.type === orderTypeFilter;
      
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate pagination values
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const openDetailsDialog = (order: IOrder) => {
    setSelectedOrder(order)
    setIsDetailsDialogOpen(true)
  }

  const formatDate = (dateValue: Date | string) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <Button 
          variant="outline" 
          onClick={fetchOrders} 
          disabled={isRefreshing || loading}
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && <ApiErrorFallback error={error} resetFn={fetchOrders} />}

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Manage all incoming orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search orders..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Status Filter */}
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Order Type Filter */}
            <Select
              value={orderTypeFilter || "all"}
              onValueChange={(value) => setOrderTypeFilter(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="preorder">Preorder</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(null).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-4 w-32" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <div className="mt-4 pt-4 border-t flex justify-end">
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : currentItems.length === 0 ? (
            <div className="border rounded-md p-8 text-center text-muted-foreground">
              <p>No orders found</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter(null);
                  setOrderTypeFilter(null);
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentItems.map(order => (
                <Card key={order._id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate" title={order._id}>
                          #{order._id}
                        </h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetailsDialog(order)}>
                              View Details
                            </DropdownMenuItem>
                            {order.status !== 'completed' && order.type === 'preorder' && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedOrder(order);
                                setIsFulfillDialogOpen(true);
                              }}>
                                Fulfill Preorder
                              </DropdownMenuItem>
                            )}
                            {order.status !== 'completed' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order._id!, "completed")}>
                                Mark as Completed
                              </DropdownMenuItem>
                            )}
                            {order.status !== 'cancelled' && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order._id!, "cancelled")}>
                                Cancel Order
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={order.type === 'preorder' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                          {order.type.charAt(0).toUpperCase() + order.type.slice(1)}
                        </Badge>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount</span>
                        <span className="font-medium">${order.totalAmount.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Date</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 bg-muted/40 p-3 border-t flex justify-between items-center">
                      <Button variant="ghost" size="sm" onClick={() => openDetailsDialog(order)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      
                      {order.status === 'pending' && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => order.type === 'preorder' ? 
                            (setSelectedOrder(order), setIsFulfillDialogOpen(true)) : 
                            handleUpdateStatus(order._id!, 'completed')
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {order.type === 'preorder' ? 'Fulfill' : 'Complete'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>

        {/* Pagination Footer */}
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min(indexOfFirstItem + 1, totalItems)} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} orders
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1); // Reset to first page when changing items per page
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="48">48</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">per page</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="hidden md:flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show 5 pages at most, centered around current page
                  const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                  const pageNum = startPage + i;
                  
                  return pageNum <= totalPages ? (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => paginate(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ) : null;
                })}
              </div>
              
              <div className="md:hidden">
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>Order #{selectedOrder._id}</DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="history">Status History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                    <div>{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Order Type</h3>
                    <p className="capitalize">{selectedOrder.type}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">User ID</h3>
                    <p>{selectedOrder.userId}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Product ID</h3>
                    <p>{selectedOrder.productId}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Quantity</h3>
                    <p>{selectedOrder.quantity}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Unit Price</h3>
                    <p>${selectedOrder.unitPrice.toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Amount</h3>
                    <p className="text-xl font-semibold">${selectedOrder.totalAmount.toFixed(2)}</p>
                  </div>
                  
                  {selectedOrder.customerNote && (
                    <div className="col-span-full">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Customer Note</h3>
                      <p className="text-sm">{selectedOrder.customerNote}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
                    <p>{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Updated At</h3>
                    <p>{formatDate(selectedOrder.updatedAt)}</p>
                  </div>
                  
                  {selectedOrder.completedAt && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Completed At</h3>
                      <p>{formatDate(selectedOrder.completedAt)}</p>
                    </div>
                  )}
                  
                  {selectedOrder.type === "preorder" && selectedOrder.preorderConfirmationDate && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Preorder Confirmation Date</h3>
                      <p>{formatDate(selectedOrder.preorderConfirmationDate)}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="history">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Status History</h3>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Note</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 ? (
                          selectedOrder.statusHistory.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{getStatusBadge(item.status)}</TableCell>
                              <TableCell>{formatDate(item.timestamp)}</TableCell>
                              <TableCell>{item.note || '—'}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                              No status history available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <div className="flex flex-wrap gap-2 justify-end">
                {selectedOrder.status !== 'completed' && selectedOrder.type === 'preorder' && (
                  <Button 
                    onClick={() => {
                      setIsFulfillDialogOpen(true);
                      setIsDetailsDialogOpen(false);
                    }}
                    className="sm:order-1"
                  >
                    Fulfill Preorder
                  </Button>
                )}
                {selectedOrder.status !== 'completed' && (
                  <Button 
                    onClick={() => handleUpdateStatus(selectedOrder._id!, 'completed')} 
                    variant="default"
                    className="sm:order-2"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </Button>
                )}
                {selectedOrder.status !== 'cancelled' && (
                  <Button 
                    onClick={() => handleUpdateStatus(selectedOrder._id!, 'cancelled')} 
                    variant="destructive"
                    className="sm:order-3"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Order
                  </Button>
                )}
                <Button 
                  onClick={() => setIsDetailsDialogOpen(false)} 
                  variant="outline"
                  className="sm:order-4"
                >
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isFulfillDialogOpen} onOpenChange={setIsFulfillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fulfill Preorder</DialogTitle>
            <DialogDescription>
              Provide the digital content to fulfill this preorder and complete the order.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="fulfillContent" className="text-sm font-medium">
                Digital Content
              </label>
              <Textarea
                id="fulfillContent"
                placeholder="Enter email:password or product code"
                rows={3}
                value={fulfillmentContent}
                onChange={(e) => setFulfillmentContent(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This content will be sent to the customer via Telegram
              </p>
            </div>
            <div className="grid gap-2">
              <label htmlFor="fulfillNote" className="text-sm font-medium">
                Fulfillment Note (Optional)
              </label>
              <Textarea
                id="fulfillNote"
                placeholder="Add a note about this fulfillment"
                value={fulfillmentNote}
                onChange={(e) => setFulfillmentNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFulfillDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleFulfillPreorder} 
              disabled={!fulfillmentContent.trim()}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Fulfill and Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

