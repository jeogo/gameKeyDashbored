"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Bell, Send, Search, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { IUser, INotification } from "@/types/interfaces"
import api, { logApiOperation } from "@/lib/api"
import { ApiErrorFallback } from "@/components/api-error-fallback"

export default function NotificationsPage() {
  // State for users
  const [users, setUsers] = useState<IUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [errorUsers, setErrorUsers] = useState<Error | string | null>(null)

  // State for notifications
  const [notifications, setNotifications] = useState<INotification[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(true)
  const [errorNotifications, setErrorNotifications] = useState<Error | string | null>(null)
  
  // UI state
  const [searchTerm, setSearchTerm] = useState("")
  const [audienceFilter, setAudienceFilter] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [title, setTitle] = useState("")
  const [audience, setAudience] = useState<"all" | "specific_users">("all")
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [selectAccepted, setSelectAccepted] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [isSendingNotification, setIsSendingNotification] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<INotification | null>(null)
  
  const { toast } = useToast()

  const acceptedUsers = users.filter((user) => user.isAccepted)

  useEffect(() => {
    fetchUsers()
    fetchNotifications()
  }, [])

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      setErrorUsers(null)
      
      const response = await api.getUsers()
      logApiOperation("getUsers response", response)
      
      if (Array.isArray(response)) {
        setUsers(response)
      } else if (response && Array.isArray(response.data)) {
        setUsers(response.data)
      } else {
        console.warn("Unexpected API response format for users:", response)
        setErrorUsers("API returned unexpected data format for users")
        setUsers([])
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      setErrorUsers(error instanceof Error ? error : "Failed to fetch users")
      setUsers([])
      
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true)
      setErrorNotifications(null)
      
      const response = await api.getNotifications()
      logApiOperation("getNotifications response", response)
      
      if (Array.isArray(response)) {
        setNotifications(response)
      } else if (response && Array.isArray(response.data)) {
        setNotifications(response.data)
      } else {
        console.warn("Unexpected API response format for notifications:", response)
        setErrorNotifications("API returned unexpected data format for notifications")
        setNotifications([])
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      setErrorNotifications(error instanceof Error ? error : "Failed to fetch notifications")
      setNotifications([])
      
      toast({
        title: "Error",
        description: "Failed to load notifications. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingNotifications(false)
    }
  }

  // Filter notifications based on search term and audience
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAudience =
      audienceFilter === null || audienceFilter === "all" || notification.audience === audienceFilter

    return matchesSearch && matchesAudience
  })

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    setSelectAccepted(false)
    if (checked) {
      setSelectedUserIds(users.map((user) => user.telegramId))
    } else {
      setSelectedUserIds([])
    }
  }

  const handleSelectAccepted = (checked: boolean) => {
    setSelectAccepted(checked)
    setSelectAll(false)
    if (checked) {
      setSelectedUserIds(acceptedUsers.map((user) => user.telegramId))
    } else {
      setSelectedUserIds([])
    }
  }

  const handleSelectUser = (telegramId: number, checked: boolean) => {
    if (checked) {
      setSelectedUserIds([...selectedUserIds, telegramId])
    } else {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== telegramId))
    }
  }

  const handleAudienceChange = (value: "all" | "specific_users") => {
    setAudience(value)
    if (value === "all") {
      setSelectedUserIds([])
      setSelectAll(false)
      setSelectAccepted(false)
    }
  }

  const handlePreviewNotification = () => {
    if (title.trim() && message.trim() && (audience === "all" || selectedUserIds.length > 0)) {
      setIsPreviewDialogOpen(true)
    }
  }

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim() || (audience === "specific_users" && selectedUserIds.length === 0)) {
      return
    }
    
    setIsSendingNotification(true)

    try {
      // Create notification payload
      const notificationData = {
        title: title.trim(),
        message: message.trim(),
        audience,
        ...(audience === "specific_users" ? { targetUserIds: selectedUserIds } : {})
      }
      
      // Send to API
      const result = await api.createNotification(notificationData)
      logApiOperation("createNotification response", result)
      
      // Update local state
      setNotifications([result, ...notifications])
      
      setIsPreviewDialogOpen(false)
      setIsSuccessDialogOpen(true)

      // Reset form after successful send
      setTimeout(() => {
        setIsSuccessDialogOpen(false)
        setTitle("")
        setMessage("")
        setAudience("all")
        setSelectedUserIds([])
        setSelectAll(false)
        setSelectAccepted(false)
      }, 2000)
      
    } catch (error) {
      console.error("Failed to send notification:", error)
      toast({
        title: "Error",
        description: "Failed to send notification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSendingNotification(false)
    }
  }

  const handleViewDetails = (notification: INotification) => {
    setSelectedNotification(notification)
    setIsViewDetailsDialogOpen(true)
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTargetedUsernames = (telegramIds: number[]) => {
    return users
      .filter((user) => telegramIds.includes(user.telegramId))
      .map((user) => user.username || `User${user.telegramId}`)
      .join(", ")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notifications</h1>
      </div>

      {/* Display errors if any */}
      {errorUsers && <ApiErrorFallback error={errorUsers} resetFn={fetchUsers} />}
      {errorNotifications && <ApiErrorFallback error={errorNotifications} resetFn={fetchNotifications} />}

      <Tabs defaultValue="send">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send">Send Notifications</TabsTrigger>
          <TabsTrigger value="history">Notification History</TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Bulk Notifications</CardTitle>
              <CardDescription>Send notifications to multiple users at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Notification Title</Label>
                <Input
                  id="title"
                  placeholder="Enter notification title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your notification message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Select
                  value={audience}
                  onValueChange={(value: "all" | "specific_users") => handleAudienceChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="specific_users">Specific Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {audience === "specific_users" && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={selectAll}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      />
                      <Label htmlFor="select-all">Select all users ({users.length})</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-accepted"
                        checked={selectAccepted}
                        onCheckedChange={(checked) => handleSelectAccepted(checked as boolean)}
                      />
                      <Label htmlFor="select-accepted">Select all accepted users ({acceptedUsers.length})</Label>
                    </div>
                  </div>

                  <div className="border rounded-md">
                    <div className="p-4 border-b">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Search users..."
                          className="pl-8"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Select</TableHead>
                            <TableHead>Telegram ID</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingUsers ? (
                            Array(5).fill(null).map((_, i) => (
                              <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                              </TableRow>
                            ))
                          ) : users.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                No users found
                              </TableCell>
                            </TableRow>
                          ) : (
                            users.map((user) => (
                              <TableRow key={user._id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedUserIds.includes(user.telegramId)}
                                    onCheckedChange={(checked) => handleSelectUser(user.telegramId, checked as boolean)}
                                  />
                                </TableCell>
                                <TableCell>{user.telegramId}</TableCell>
                                <TableCell>{user.username || "N/A"}</TableCell>
                                <TableCell>
                                  {user.isAccepted ? (
                                    <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                                      Accepted
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                      Pending
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handlePreviewNotification}
                  disabled={
                    !title.trim() || !message.trim() || (audience === "specific_users" && selectedUserIds.length === 0)
                  }
                >
                  <Send className="h-4 w-4 mr-2" />
                  Preview & Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>View previously sent notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search notifications..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={audienceFilter || "all"} onValueChange={setAudienceFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Audiences" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Audiences</SelectItem>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="specific_users">Specific Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingNotifications ? (
                      Array(5).fill(null).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredNotifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No notifications found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredNotifications.map((notification) => (
                        <TableRow key={notification._id}>
                          <TableCell className="font-medium">{notification.title}</TableCell>
                          <TableCell className="max-w-xs truncate">{notification.message}</TableCell>
                          <TableCell>
                            {notification.audience === "all" ? (
                              <Badge variant="outline">All Users</Badge>
                            ) : (
                              <Badge variant="outline">{notification.targetUserIds?.length || 0} Users</Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(notification.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(notification)}>
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview Notification</DialogTitle>
            <DialogDescription>Review your notification before sending</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Bell className="h-8 w-8" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-sm">{message}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Recipients:</p>
              <p className="text-sm">{audience === "all" ? "All users" : `${selectedUserIds.length} selected users`}</p>
              {audience === "specific_users" && selectedUserIds.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">{getTargetedUsernames(selectedUserIds)}</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendNotification} disabled={isSendingNotification}>
              {isSendingNotification ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Notification"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification Sent</DialogTitle>
            <DialogDescription>Your notification has been sent successfully</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Bell className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDetailsDialogOpen} onOpenChange={setIsViewDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
            <DialogDescription>Detailed information about the notification</DialogDescription>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Title</p>
                <p className="font-medium">{selectedNotification.title}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Message</p>
                <p>{selectedNotification.message}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Audience</p>
                <p>
                  {selectedNotification.audience === "all"
                    ? "All users"
                    : `Specific users (${selectedNotification.targetUserIds?.length || 0})`}
                </p>
                {selectedNotification.audience === "specific_users" && selectedNotification.targetUserIds && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {getTargetedUsernames(selectedNotification.targetUserIds)}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Sent At</p>
                <p>{formatDate(selectedNotification.createdAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

