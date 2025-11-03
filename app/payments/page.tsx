"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Eye, CheckCircle, Clock, XCircle, AlertTriangle, DollarSign, CreditCard, RefreshCw, Calendar } from "lucide-react"
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
  const [selectedPayment, setSelectedPayment] = useState<IPaymentTransaction | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPayments()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.getPayments()
      logApiOperation("getPayments response", response)

      if (response && typeof response === 'object' && 'transactions' in response && Array.isArray(response.transactions)) {
        setPayments(response.transactions)
      } else if (Array.isArray(response)) {
        setPayments(response)
      } else {
        console.warn("Unexpected API response format:", response)
        setError("API returned unexpected data format")
        setPayments([])
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error)
      setError(error instanceof Error ? error : "Failed to fetch payments")
      setPayments([])
    } finally {
      setLoading(false)
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
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'pending': return <Clock className="h-5 w-5 text-yellow-600" />
      case 'failed': return <XCircle className="h-5 w-5 text-red-600" />
      case 'cancelled': return <AlertTriangle className="h-5 w-5 text-gray-600" />
      default: return <Clock className="h-5 w-5 text-blue-600" />
    }
  }

  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      paypal: 'bg-blue-50 text-blue-600 border-blue-200',
      nowpayments: 'bg-purple-50 text-purple-600 border-purple-200',
      stripe: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    }
    return colors[provider] || 'bg-gray-50 text-gray-600 border-gray-200'
  }

  // Calculate stats
  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === 'completed').length,
    pending: payments.filter(p => p.status === 'pending').length,
    failed: payments.filter(p => p.status === 'failed').length,
    totalRevenue: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Transactions</h1>
          <p className="text-muted-foreground">Track and manage all payment transactions</p>
        </div>
        <Button onClick={fetchPayments} disabled={loading} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && <ApiErrorFallback error={error} resetFn={fetchPayments} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
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
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
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
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
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
                placeholder="Search by ID, order, or transaction..."
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
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("completed")}
              >
                <CheckCircle className="mr-1 h-4 w-4" />
                Completed
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
                variant={statusFilter === "failed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("failed")}
              >
                <XCircle className="mr-1 h-4 w-4" />
                Failed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredPayments.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No payments found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter ? "Try adjusting your filters" : "No payment transactions yet"}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredPayments.map((payment) => (
            <Card key={payment._id} className="hover:shadow-lg transition-all duration-200 border-2">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(payment.status)}
                    <div>
                      <CardTitle className="text-lg">
                        ${payment.amount} {payment.currency.toUpperCase()}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {payment._id?.substring(0, 12)}...
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(payment.status)} border`}>
                    {payment.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Provider</span>
                  <Badge variant="outline" className={getProviderBadge(payment.paymentProvider)}>
                    {payment.paymentProvider}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono text-xs">{payment.orderId.substring(0, 12)}...</span>
                </div>

                {payment.cryptoType && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Crypto</span>
                    <Badge variant="outline" className="bg-orange-50 text-orange-600">
                      {payment.cryptoType.toUpperCase()}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(payment.createdAt)}</span>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setSelectedPayment(payment)
                    setIsDetailsDialogOpen(true)
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Payment Details Dialog */}
      {selectedPayment && (
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getStatusIcon(selectedPayment.status)}
                Payment Details
              </DialogTitle>
              <DialogDescription>
                Transaction #{selectedPayment._id}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Amount</p>
                <p className="text-2xl font-bold">
                  ${selectedPayment.amount} {selectedPayment.currency.toUpperCase()}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={`${getStatusColor(selectedPayment.status)} border text-base px-3 py-1`}>
                  {selectedPayment.status}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Payment Provider</p>
                <Badge variant="outline" className={`${getProviderBadge(selectedPayment.paymentProvider)} text-base px-3 py-1`}>
                  {selectedPayment.paymentProvider}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm">{formatDate(selectedPayment.createdAt)}</p>
              </div>

              <div className="col-span-2 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                <p className="text-sm font-mono bg-muted p-2 rounded">{selectedPayment.orderId}</p>
              </div>

              <div className="col-span-2 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">User ID</p>
                <p className="text-sm font-mono bg-muted p-2 rounded">{selectedPayment.userId}</p>
              </div>

              {selectedPayment.providerTransactionId && (
                <div className="col-span-2 space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Provider Transaction ID</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded">{selectedPayment.providerTransactionId}</p>
                </div>
              )}

              {selectedPayment.cryptoType && (
                <>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Crypto Type</p>
                    <Badge variant="outline" className="bg-orange-50 text-orange-600">
                      {selectedPayment.cryptoType.toUpperCase()}
                    </Badge>
                  </div>

                  {selectedPayment.cryptoAddress && (
                    <div className="col-span-2 space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Wallet Address</p>
                      <p className="text-xs font-mono bg-muted p-2 rounded break-all">{selectedPayment.cryptoAddress}</p>
                    </div>
                  )}
                </>
              )}

              {selectedPayment.paymentUrl && (
                <div className="col-span-2 space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Payment URL</p>
                  <a href={selectedPayment.paymentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                    {selectedPayment.paymentUrl}
                  </a>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
