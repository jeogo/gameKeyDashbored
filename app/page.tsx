"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, ShoppingBag, CreditCard, ShoppingCart, ArrowUpRight, ArrowDownRight, TrendingUp, Loader2 } from "lucide-react"
import api, { logApiOperation } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { IOrder, IPaymentTransaction, IProduct, IUser } from "@/types/interfaces"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    activeCategories: 0,
    availableProducts: 0,
    totalCategories: 0,
  })
  const [recentOrders, setRecentOrders] = useState<IOrder[]>([])
  const [recentUsers, setRecentUsers] = useState<IUser[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all required data in parallel
      const [usersResponse, ordersResponse, productsResponse, paymentsResponse, categoriesResponse] = 
        await Promise.all([
          api.getUsers(),
          api.getOrders(),
          api.getProducts(),
          api.getPayments(),
          api.getCategories(),
        ])
      
      logApiOperation("Dashboard data fetch", { 
        users: usersResponse, 
        orders: ordersResponse,
        products: productsResponse,
        payments: paymentsResponse,
        categories: categoriesResponse
      })

      // Process users data
      let users: IUser[] = []
      if (Array.isArray(usersResponse)) {
        users = usersResponse
      } else if (usersResponse && Array.isArray(usersResponse.data)) {
        users = usersResponse.data
      }
      
      // Process orders data - Updated for backend API structure
      let orders: IOrder[] = []
      if (Array.isArray(ordersResponse)) {
        orders = ordersResponse
      } else if (ordersResponse && typeof ordersResponse === 'object' && 'data' in ordersResponse && Array.isArray((ordersResponse as { data: IOrder[] }).data)) {
        orders = (ordersResponse as { data: IOrder[] }).data
      }
      
      // Process products data
      let products: IProduct[] = []
      if (Array.isArray(productsResponse)) {
        products = productsResponse
      } else if (productsResponse && Array.isArray(productsResponse.data)) {
        products = productsResponse.data
      }
      
      // Process payments data - Backend returns { transactions: [], total: number }
      let payments: IPaymentTransaction[] = []
      if (Array.isArray(paymentsResponse)) {
        payments = paymentsResponse
      } else if (paymentsResponse && typeof paymentsResponse === 'object' && 'transactions' in paymentsResponse && Array.isArray((paymentsResponse as { transactions: IPaymentTransaction[] }).transactions)) {
        payments = (paymentsResponse as { transactions: IPaymentTransaction[] }).transactions
      }
      
      // Process categories data - Backend returns { success: boolean, data: [] }
      let categories = []
      if (Array.isArray(categoriesResponse)) {
        categories = categoriesResponse
      } else if (categoriesResponse && Array.isArray(categoriesResponse.data)) {
        categories = categoriesResponse.data
      }
      
      // Calculate metrics
      const availableProducts = products.filter(product => product.isAvailable).length
      const totalRevenue = payments.reduce((sum, payment) =>
        payment.status === "completed" ? sum + payment.amount : sum, 0)

      // Get recent data
      const recentOrders = [...orders].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 5)

      const recentUsers = [...users].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 5)

      // Update state
      setMetrics({
        totalUsers: users.length,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalRevenue,
        activeCategories: categories.length,
        availableProducts,
        totalCategories: categories.length,
      })
      
      setRecentOrders(recentOrders)
      setRecentUsers(recentUsers)
      
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Helper function to format dates
  const formatDate = (dateValue: Date | string) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }
  
  // Helper function for status badges - Updated for backend API statuses
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>
      case 'paid':
        return <Badge className="bg-blue-100 text-blue-800">Paid</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchDashboardData} 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Refresh"
            )}
          </Button>
          <Button>Export Data</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics.totalUsers}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <span>Registered users</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics.totalOrders}</div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  <span>{recentOrders.filter(o => o.status === "pending").length} pending orders</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics.totalProducts}</div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>{metrics.availableProducts} available</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">${metrics.totalRevenue.toFixed(2)}</div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>From {metrics.totalOrders} orders</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts and send messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Users</p>
                {loading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  <p className="text-xs text-muted-foreground">{metrics.totalUsers} registered users</p>
                )}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/users">Manage Users</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Category Management</CardTitle>
            <CardDescription>Organize your product categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active Categories</p>
                {loading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  <p className="text-xs text-muted-foreground">{metrics.activeCategories} categories</p>
                )}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/categories">Manage Categories</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Product Management</CardTitle>
            <CardDescription>Manage your digital products</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Available Products</p>
                {loading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {metrics.availableProducts} of {metrics.totalProducts} products
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/products">Manage Products</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest customer orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-40 mt-1" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))
              ) : recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No orders available</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order._id} className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Order #{order._id?.substring(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        Status: {order.status} • ${order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-40 mt-1" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))
              ) : recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No users available</p>
              ) : (
                recentUsers.map((user) => (
                  <div key={user._id} className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.username || `User${user.telegramId}`}</p>
                      <p className="text-xs text-muted-foreground">
                        Telegram ID: {user.telegramId} • Joined {formatDate(user.createdAt)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/users?id=${user._id}`}>View</Link>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

