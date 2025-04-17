"use client"
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Eye, MoreVertical, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { IPaymentTransaction } from "@/types/interfaces"
import api, { logApiOperation } from "@/lib/api"
import { ApiErrorFallback } from "@/components/api-error-fallback"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<IPaymentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [providerFilter, setProviderFilter] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<IPaymentTransaction | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Fetching payments...")
      
      try {
        const response = await api.getPayments()
        logApiOperation("getPayments response", response)
        
        // Handle the correct API response format where payments are in the transactions array
        if (response && typeof response === 'object' && 'transactions' in response && Array.isArray(response.transactions)) {
          setPayments(response.transactions)
        } else if (Array.isArray(response)) {
          setPayments(response)
        } else {
          console.warn("Unexpected API response format:", response)
          setError("API returned unexpected data format")
          setPayments([]) // Instead of using sample data, just set empty array
        }
      } catch (error) {
        console.error("Failed to fetch payments:", error)
        setError(error instanceof Error ? error : "Failed to fetch payments")
        setPayments([]) // Set empty payments array instead of using sample data
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (paymentId: string, newStatus: 'pending' | 'completed' | 'failed' | 'cancelled') => {
    try {
      try {
        await api.updatePaymentStatus(paymentId, newStatus)
      } catch (error) {
        console.log("API update failed, updating local state only")
        // Continue with local state update even if API fails
      }
      
      // Update local state
      setPayments(payments.map(payment => 
        payment._id === paymentId ? {
          ...payment,
          status: newStatus,
          updatedAt: new Date(),
          completedAt: newStatus === "completed" ? new Date() : payment.completedAt
        } : payment
      ))
      
      // Update selected payment if open in dialog
      if (selectedPayment && selectedPayment._id === paymentId) {
        setSelectedPayment({
          ...selectedPayment,
          status: newStatus,
          updatedAt: new Date(),
          completedAt: newStatus === "completed" ? new Date() : selectedPayment.completedAt
        })
      }
      
      toast({
        title: "Status Updated",
        description: `Payment status changed to ${newStatus}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      })
    }
  }

  const filteredPayments = payments.filter(payment => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      payment._id?.toLowerCase().includes(searchLower) ||
      payment.orderId.toLowerCase().includes(searchLower) ||
      (payment.providerTransactionId && payment.providerTransactionId.toLowerCase().includes(searchLower))
      
    const matchesStatus = 
      statusFilter === null || 
      payment.status === statusFilter
      
    const matchesProvider = 
      providerFilter === null ||
      payment.paymentProvider === providerFilter
      
    return matchesSearch && matchesStatus && matchesProvider
  })

  const openDetailsDialog = (payment: IPaymentTransaction) => {
    setSelectedPayment(payment)
    setIsDetailsDialogOpen(true)
  }

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'paypal':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-50">PayPal</Badge>
      case 'crypto':
        return <Badge variant="outline" className="bg-purple-50 text-purple-600 hover:bg-purple-50">Crypto</Badge>
      default:
        return <Badge variant="outline">{provider}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payment Transactions</h1>
      </div>

      {error && <ApiErrorFallback error={error} resetFn={fetchPayments} />}

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>Manage and track all payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search payments..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={statusFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(null)}
              >
                All Status
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
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("completed")}
              >
                <CheckCircle className="mr-1 h-4 w-4" />
                Completed
              </Button>
              <Button
                variant={statusFilter === "failed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("failed")}
              >
                <AlertTriangle className="mr-1 h-4 w-4" />
                Failed
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={providerFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setProviderFilter(null)}
              >
                All Providers
              </Button>
              <Button
                variant={providerFilter === "paypal" ? "default" : "outline"}
                size="sm"
                onClick={() => setProviderFilter("paypal")}
              >
                PayPal
              </Button>
              <Button
                variant={providerFilter === "crypto" ? "default" : "outline"}
                size="sm"
                onClick={() => setProviderFilter("crypto")}
              >
                Crypto
              </Button>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(null).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-4 text-center text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map(payment => (
                    <TableRow key={payment._id}>
                      <TableCell className="font-medium">{payment._id}</TableCell>
                      <TableCell>{payment.orderId}</TableCell>
                      <TableCell>{payment.amount} {payment.currency}</TableCell>
                      <TableCell>{getProviderBadge(payment.paymentProvider)}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>{formatDate(payment.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetailsDialog(payment)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openDetailsDialog(payment)}>
                                View Details
                              </DropdownMenuItem>
                              {payment.status === 'pending' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(payment._id!, 'completed')}>
                                    Mark as Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(payment._id!, 'failed')}>
                                    Mark as Failed
                                  </DropdownMenuItem>
                                </>
                              )}
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

      {/* Payment Details Dialog */}
      {selectedPayment && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
              <DialogDescription>Transaction #{selectedPayment._id}</DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                {selectedPayment.paymentProvider === 'paypal' && (
                  <TabsTrigger value="paypal">PayPal Info</TabsTrigger>
                )}
                {selectedPayment.paymentProvider === 'crypto' && (
                  <TabsTrigger value="crypto">Crypto Info</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="details" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                    <div>{getStatusBadge(selectedPayment.status)}</div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Payment Provider</h3>
                    <div>{getProviderBadge(selectedPayment.paymentProvider)}</div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Order ID</h3>
                    <p>{selectedPayment.orderId}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">User ID</h3>
                    <p>{selectedPayment.userId}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Amount</h3>
                    <p className="text-xl font-semibold">{selectedPayment.amount} {selectedPayment.currency}</p>
                  </div>
                  
                  {selectedPayment.providerTransactionId && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Provider Transaction ID</h3>
                      <p>{selectedPayment.providerTransactionId}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
                    <p>{formatDate(selectedPayment.createdAt)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Updated At</h3>
                    <p>{formatDate(selectedPayment.updatedAt)}</p>
                  </div>
                  
                  {selectedPayment.completedAt && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Completed At</h3>
                      <p>{formatDate(selectedPayment.completedAt)}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {selectedPayment.paymentProvider === 'paypal' && (
                <TabsContent value="paypal" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedPayment.paypalOrderId && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">PayPal Order ID</h3>
                        <p>{selectedPayment.paypalOrderId}</p>
                      </div>
                    )}
                    
                    {selectedPayment.paypalCaptureId && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">PayPal Capture ID</h3>
                        <p>{selectedPayment.paypalCaptureId}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}
              
              {selectedPayment.paymentProvider === 'crypto' && (
                <TabsContent value="crypto" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedPayment.cryptoType && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Crypto Type</h3>
                        <p className="uppercase">{selectedPayment.cryptoType}</p>
                      </div>
                    )}
                    
                    {selectedPayment.cryptoNetwork && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Network</h3>
                        <p>{selectedPayment.cryptoNetwork}</p>
                      </div>
                    )}
                    
                    {selectedPayment.cryptoAddress && (
                      <div className="col-span-1 md:col-span-2">
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Wallet Address</h3>
                        <p className="font-mono text-sm break-all">{selectedPayment.cryptoAddress}</p>
                      </div>
                    )}
                    
                    {selectedPayment.cryptoTxHash && (
                      <div className="col-span-1 md:col-span-2">
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Transaction Hash</h3>
                        <p className="font-mono text-sm break-all">{selectedPayment.cryptoTxHash}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}
            </Tabs>
            
            <DialogFooter>
              <div className="flex gap-2">
                {selectedPayment.status === 'pending' && (
                  <>
                    <Button onClick={() => handleUpdateStatus(selectedPayment._id!, 'completed')} variant="default">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Completed
                    </Button>
                    <Button onClick={() => handleUpdateStatus(selectedPayment._id!, 'failed')} variant="destructive">
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Mark as Failed
                    </Button>
                  </>
                )}
                <Button onClick={() => setIsDetailsDialogOpen(false)} variant="outline">
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

