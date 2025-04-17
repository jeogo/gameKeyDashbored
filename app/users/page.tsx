"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Check, MoreVertical, Search, X, UserCircle, MessageSquare, Download, RefreshCw } from "lucide-react"
import { IUser } from "@/types/interfaces"
import api from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

export default function UsersPage() {
  const [users, setUsers] = useState<IUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const { toast } = useToast()

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      console.log("Fetching users...");
      
      try {
        const response = await api.getUsers();
        console.log("API response:", response);
        
        if (Array.isArray(response)) {
          setUsers(response);
        } else if (response && Array.isArray(response.data)) {
          setUsers(response.data);
        } else {
          setUsers([]);
          console.warn("Unexpected API response format:", response);
        }
      } catch (error) {
        console.error("API call failed:", error);
        setUsers([]);
        
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Filter users based on search term and status filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.telegramId?.toString().includes(searchTerm.toLowerCase()) ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus =
      statusFilter === null ||
      (statusFilter === "accepted" && user.isAccepted) ||
      (statusFilter === "pending" && !user.isAccepted)

    return matchesSearch && matchesStatus
  })

  const handleApprove = async (userId: string) => {
    try {
      await api.updateUser(userId, { isAccepted: true });
      
      // Update local state to reflect the change
      setUsers(users.map((user) => 
        user._id === userId 
          ? { ...user, isAccepted: true, updatedAt: new Date() } 
          : user
      ));
      
      toast({
        title: "Success",
        description: "User has been approved successfully.",
      });
      
      // If we're updating the currently selected user, update that too
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({ ...selectedUser, isAccepted: true, updatedAt: new Date() });
      }
    } catch (error) {
      console.error("Failed to approve user:", error);
      toast({
        title: "Error",
        description: "Failed to approve user. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleDecline = async (userId: string) => {
    try {
      await api.updateUser(userId, { isAccepted: false });
      
      // Update local state to reflect the change
      setUsers(users.map((user) => 
        user._id === userId 
          ? { ...user, isAccepted: false, updatedAt: new Date() } 
          : user
      ));
      
      toast({
        title: "Success",
        description: "User access has been revoked.",
      });
      
      // If we're updating the currently selected user, update that too
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({ ...selectedUser, isAccepted: false, updatedAt: new Date() });
      }
    } catch (error) {
      console.error("Failed to revoke user access:", error);
      toast({
        title: "Error",
        description: "Failed to revoke user access. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleViewDetails = (user: IUser) => {
    setSelectedUser(user)
    setIsDialogOpen(true)
  }

  const handleOpenMessageDialog = (user: IUser) => {
    setSelectedUser(user);
    setMessageText("");
    setIsMessageDialogOpen(true);
  }

  const handleSendMessage = async () => {
    if (!selectedUser || !messageText.trim()) return;
    
    setIsSendingMessage(true);
    
    try {
      // Assume we have an API endpoint to send a message to a user
      await api.sendMessageToUser(selectedUser.telegramId.toString(), {
        message: messageText
      });
      
      toast({
        title: "Message Sent",
        description: `Message was successfully sent to ${selectedUser.username || "the user"}.`,
      });
      
      setIsMessageDialogOpen(false);
      setMessageText("");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
    }
  }

  const formatDate = (dateValue: string | Date) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Users
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by username or ID..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-5 rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                      <div className="pt-4 mt-2 border-t flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="border rounded-md p-8 text-center text-muted-foreground">
              <p>No users found</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter(null);
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <Card key={user._id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <UserCircle className="h-5 w-5 mr-2 text-muted-foreground" />
                          <h3 className="font-medium truncate" title={user.username || user.telegramId.toString()}>
                            {user.username || "Anonymous"}
                          </h3>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenMessageDialog(user)}>
                              Send Message
                            </DropdownMenuItem>
                            {!user.isAccepted ? (
                              <DropdownMenuItem onClick={() => user._id && handleApprove(user._id)}>
                                Approve User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => user._id && handleDecline(user._id)}>
                                Revoke Access
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Telegram ID</span>
                          <span>{user.telegramId}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Joined</span>
                          <span>{formatDate(user.createdAt).split(',')[0]}</span>
                        </div>
                      </div>
                      
                      <div>
                        {user.isAccepted ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                            Accepted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 bg-muted/40 p-3 border-t flex justify-between items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenMessageDialog(user)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      
                      {!user.isAccepted ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => user._id && handleApprove(user._id)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => user._id && handleDecline(user._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Revoke
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>Detailed information about the user.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Telegram ID</p>
                  <p>{selectedUser.telegramId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Username</p>
                  <p>{selectedUser.username || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created At</p>
                  <p>{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p>{formatDate(selectedUser.updatedAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p>{selectedUser.isAccepted ? "Accepted" : "Pending"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">MongoDB ID</p>
                  <p className="text-xs truncate">{selectedUser._id}</p>
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false);
                  handleOpenMessageDialog(selectedUser);
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              
              {!selectedUser.isAccepted ? (
                <Button onClick={() => selectedUser._id && handleApprove(selectedUser._id)}>
                  <Check className="h-4 w-4 mr-2" />
                  Approve User
                </Button>
              ) : (
                <Button variant="destructive" onClick={() => selectedUser._id && handleDecline(selectedUser._id)}>
                  <X className="h-4 w-4 mr-2" />
                  Revoke Access
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Send Message Dialog */}
      {selectedUser && (
        <Dialog open={isMessageDialogOpen} onOpenChange={(open) => {
          if (!isSendingMessage) setIsMessageDialogOpen(open);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
              <DialogDescription>
                Send a message to {selectedUser.username || `Telegram ID: ${selectedUser.telegramId}`}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Enter your message here..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                This message will be sent via Telegram Bot to the user.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)} disabled={isSendingMessage}>
                Cancel
              </Button>
              <Button onClick={handleSendMessage} disabled={isSendingMessage || !messageText.trim()}>
                {isSendingMessage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

