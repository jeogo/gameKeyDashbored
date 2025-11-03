"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, ShoppingCart, Package, CheckCircle, Clock, XCircle, Eye, RefreshCw, DollarSign, Calendar, User } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { IOrder } from "@/types/interfaces"
import api from "@/lib/api"

export default function OrdersPage() {
  const [orders, setOrders] = useState<IOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isFulfillDialogOpen, setIsFulfillDialogOpen] = useState(false)
  const [fulfillmentContent, setFulfillmentContent] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchOrders()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await api.getOrders()

      let orderData: IOrder[] = []
      if (Array.isArray(response)) {
        orderData = response
      } else if (response && typeof response === 'object' && 'data' in response) {
        orderData = response.data as IOrder[]
      } else if (response && typeof response === 'object' && 'orders' in response) {
        orderData = (response as any).orders as IOrder[]
      }

      setOrders(orderData)
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, { status: newStatus })

      setOrders(orders.map(order =>
        order._id === orderId ? { ...order, status: newStatus as any } : order
      ))

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

  const handleFulfillOrder = async () => {
    if (!selectedOrder || !fulfillmentContent.trim()) return

    try {
      await api.fulfillOrder(selectedOrder._id!, {
        content: fulfillmentContent.split('\n').filter(line => line.trim())
      })

      setOrders(orders.map(order =>
        order._id === selectedOrder._id ? {
          ...order,
          status: 'delivered' as any,
          deliveredContent: fulfillmentContent.split('\n').filter(line => line.trim())
        } : order
      ))

      toast({
        title: "Order Fulfilled",
        description: "The order has been fulfilled and completed successfully.",
      })

      setIsFulfillDialogOpen(false)
      setFulfillmentContent("")
      setSelectedOrder(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fulfill order",
        variant: "destructive",
      })
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm ||
      order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userId.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = !statusFilter || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatDate = (dateValue: Date | string) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200'
      case 'paid': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'paid': return <Package className="h-5 w-5 text-blue-600" />
      case 'pending': return <Clock className="h-5 w-5 text-yellow-600" />
      case 'cancelled': return <XCircle className="h-5 w-5 text-red-600" />
      default: return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.totalAmount, 0)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground">Track and manage all customer orders</p>
        </div>
        <Button onClick={fetchOrders} disabled={loading} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-blue-600">{stats.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-purple-600">${stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={statusFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(null)}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
              >
                <Clock className="mr-1 h-4 w-4" />
                Pending
              </Button>
              <Button
                variant={statusFilter === "paid" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("paid")}
              >
                <Package className="mr-1 h-4 w-4" />
                Paid
              </Button>
              <Button
                variant={statusFilter === "delivered" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("delivered")}
              >
                <CheckCircle className="mr-1 h-4 w-4" />
                Delivered
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredOrders.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No orders found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter ? "Try adjusting your filters" : "No orders yet"}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order._id} className="hover:shadow-lg transition-all duration-200 border-2">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <div>
                      <CardTitle className="text-lg">
                        ${order.totalAmount.toFixed(2)}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        #{order._id?.substring(0, 12)}...
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} border`}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <User className="h-4 w-4" />
                    User ID
                  </span>
                  <span className="font-mono text-xs">{order.userId.substring(0, 12)}...</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quantity</span>
                  <Badge variant="outline">{order.quantity}x</Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Unit Price</span>
                  <span className="font-semibold">${order.unitPrice.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(order.createdAt)}</span>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedOrder(order)
                    setIsDetailsDialogOpen(true)
                  }}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  Details
                </Button>
                {(order.status === 'pending' || order.status === 'paid') && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedOrder(order)
                      setIsFulfillDialogOpen(true)
                    }}
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Fulfill
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getStatusIcon(selectedOrder.status)}
                Order Details
              </DialogTitle>
              <DialogDescription>
                Order #{selectedOrder._id}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">${selectedOrder.totalAmount.toFixed(2)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={`${getStatusColor(selectedOrder.status)} border text-base px-3 py-1`}>
                  {selectedOrder.status}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                <p className="text-lg font-semibold">{selectedOrder.quantity}x</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Unit Price</p>
                <p className="text-lg font-semibold">${selectedOrder.unitPrice.toFixed(2)}</p>
              </div>

              <div className="col-span-2 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">User ID</p>
                <p className="text-sm font-mono bg-muted p-2 rounded">{selectedOrder.userId}</p>
              </div>

              <div className="col-span-2 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Product ID</p>
                <p className="text-sm font-mono bg-muted p-2 rounded">{selectedOrder.productId}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(selectedOrder.createdAt)}</p>
              </div>

              {selectedOrder.updatedAt && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Updated</p>
                  <p className="text-sm">{formatDate(selectedOrder.updatedAt)}</p>
                </div>
              )}

              {selectedOrder.deliveredContent && selectedOrder.deliveredContent.length > 0 && (
                <div className="col-span-2 space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Delivered Content</p>
                  <div className="bg-muted p-3 rounded font-mono text-xs space-y-1">
                    {selectedOrder.deliveredContent.map((content, i) => (
                      <div key={i}>{content}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <div className="flex gap-2 w-full">
                {selectedOrder.status !== 'cancelled' && (
                  <Select onValueChange={(value) => handleUpdateStatus(selectedOrder._id!, value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)} className="ml-auto">
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Fulfill Order Dialog */}
      <Dialog open={isFulfillDialogOpen} onOpenChange={setIsFulfillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fulfill Order</DialogTitle>
            <DialogDescription>
              Provide the digital content to fulfill this order and mark it as delivered.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="fulfillContent" className="text-sm font-medium">
                Digital Content
              </label>
              <Textarea
                id="fulfillContent"
                placeholder="Enter email:password or product code (one per line)"
                rows={4}
                value={fulfillmentContent}
                onChange={(e) => setFulfillmentContent(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This content will be sent to the customer via Telegram
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFulfillDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFulfillOrder}
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
