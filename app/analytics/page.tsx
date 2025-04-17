"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { format, subDays, isAfter, isBefore } from "date-fns"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { Download, Search, CalendarIcon, BarChart2, PieChartIcon, LineChartIcon, RefreshCw } from "lucide-react"

// Interfaces
interface IProduct {
  _id?: string
  name: string
  description?: string
  price: number
  digitalContent: string[]
  categoryId: string
  allowPreorder: boolean
  preorderNote?: string
  createdAt: Date
  updatedAt: Date
  isAvailable: boolean
}

interface IOrder {
  _id?: string
  userId: string
  productId: string
  quantity: number
  unitPrice: number
  totalAmount: number
  type: "purchase" | "preorder"
  status: "pending" | "completed" | "cancelled"
  customerNote?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  preorderConfirmationDate?: Date
  statusHistory: {
    status: "pending" | "completed" | "cancelled"
    timestamp: Date
    note?: string
  }[]
}

interface INotification {
  _id?: string
  title: string
  message: string
  audience: "all" | "specific"
  userIds?: string[]
  createdAt: Date
  sentAt?: Date
  status: "draft" | "sent" | "scheduled"
  scheduledFor?: Date
}

// Mock data
const mockCategories = [
  { _id: "1", name: "Xbox Subscriptions", description: "Xbox Game Pass and Xbox Live subscriptions" },
  { _id: "2", name: "PlayStation Plus", description: "PlayStation Plus subscriptions of all tiers" },
  { _id: "3", name: "Netflix", description: "Netflix subscription plans" },
  { _id: "4", name: "Spotify", description: "Spotify Premium subscriptions" },
  { _id: "5", name: "Disney+", description: "Disney+ streaming service subscriptions" },
  { _id: "6", name: "Amazon Prime", description: "Amazon Prime memberships" },
  { _id: "7", name: "Apple Services", description: "Apple Music, iCloud, and other Apple services" },
  { _id: "8", name: "Gaming Gift Cards", description: "Gift cards for various gaming platforms" },
]

// Mock products data
const mockProducts = [
  {
    _id: "1",
    name: "Xbox Game Pass Ultimate (1 Month)",
    description: "Access to over 100 high-quality games on console, PC, and cloud",
    price: 14.99,
    digitalContent: ["email1@example.com:password123", "email2@example.com:password456"],
    categoryId: "1",
    allowPreorder: false,
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2023-01-15"),
    isAvailable: true,
  },
  {
    _id: "2",
    name: "PlayStation Plus Essential (3 Months)",
    description: "Online multiplayer access, monthly games, and exclusive discounts",
    price: 24.99,
    digitalContent: ["psn_account1@example.com:pspass123", "psn_account2@example.com:pspass456"],
    categoryId: "2",
    allowPreorder: true,
    preorderNote: "Will be delivered within 24 hours",
    createdAt: new Date("2023-02-10"),
    updatedAt: new Date("2023-02-10"),
    isAvailable: true,
  },
  {
    _id: "3",
    name: "Netflix Premium (1 Month)",
    description: "Ultra HD streaming on 4 devices simultaneously",
    price: 19.99,
    digitalContent: ["netflix_premium1@example.com:netpass123"],
    categoryId: "3",
    allowPreorder: false,
    createdAt: new Date("2023-02-20"),
    updatedAt: new Date("2023-02-20"),
    isAvailable: true,
  },
  {
    _id: "4",
    name: "Spotify Premium (6 Months)",
    description: "Ad-free music streaming with offline listening",
    price: 59.99,
    digitalContent: ["spotify_premium1@example.com:spotpass123"],
    categoryId: "4",
    allowPreorder: false,
    createdAt: new Date("2023-03-05"),
    updatedAt: new Date("2023-03-05"),
    isAvailable: false,
  },
  {
    _id: "5",
    name: "Disney+ Annual Subscription",
    description: "One year of Disney, Pixar, Marvel, Star Wars, and National Geographic",
    price: 79.99,
    digitalContent: ["disney_plus1@example.com:disneypass123"],
    categoryId: "5",
    allowPreorder: true,
    preorderNote: "Will be delivered within 48 hours",
    createdAt: new Date("2023-03-15"),
    updatedAt: new Date("2023-03-15"),
    isAvailable: true,
  },
  {
    _id: "6",
    name: "Amazon Prime (3 Months)",
    description: "Fast shipping, Prime Video, Prime Music, and more",
    price: 38.97,
    digitalContent: ["amazon_prime1@example.com:amazonpass123"],
    categoryId: "6",
    allowPreorder: false,
    createdAt: new Date("2023-04-01"),
    updatedAt: new Date("2023-04-01"),
    isAvailable: true,
  },
  {
    _id: "7",
    name: "Apple Music Individual (6 Months)",
    description: "Access to over 90 million songs, ad-free",
    price: 54.99,
    digitalContent: ["apple_music1@example.com:applepass123"],
    categoryId: "7",
    allowPreorder: false,
    createdAt: new Date("2023-04-10"),
    updatedAt: new Date("2023-04-10"),
    isAvailable: false,
  },
  {
    _id: "8",
    name: "Steam Gift Card ($50)",
    description: "$50 credit for Steam store purchases",
    price: 50.0,
    digitalContent: ["STEAM-GIFT-CODE-12345", "STEAM-GIFT-CODE-67890"],
    categoryId: "8",
    allowPreorder: true,
    preorderNote: "Digital code will be sent immediately after payment",
    createdAt: new Date("2023-04-15"),
    updatedAt: new Date("2023-04-15"),
    isAvailable: true,
  },
  {
    _id: "9",
    name: "Xbox Live Gold (12 Months)",
    description: "Online multiplayer access for Xbox consoles",
    price: 59.99,
    digitalContent: ["xbox_live1@example.com:xboxpass123", "xbox_live2@example.com:xboxpass456"],
    categoryId: "1",
    allowPreorder: false,
    createdAt: new Date("2023-04-20"),
    updatedAt: new Date("2023-04-20"),
    isAvailable: true,
  },
  {
    _id: "10",
    name: "PlayStation Plus Premium (12 Months)",
    description: "Cloud streaming, game trials, and classic games catalog",
    price: 119.99,
    digitalContent: ["psn_premium1@example.com:pspremium123"],
    categoryId: "2",
    allowPreorder: true,
    preorderNote: "Will be delivered within 24 hours",
    createdAt: new Date("2023-04-25"),
    updatedAt: new Date("2023-04-25"),
    isAvailable: true,
  },
  {
    _id: "11",
    name: "Netflix Standard (3 Months)",
    description: "HD streaming on 2 devices simultaneously",
    price: 41.97,
    digitalContent: ["netflix_standard1@example.com:netstandard123"],
    categoryId: "3",
    allowPreorder: false,
    createdAt: new Date("2023-05-01"),
    updatedAt: new Date("2023-05-01"),
    isAvailable: true,
  },
  {
    _id: "12",
    name: "Spotify Family (1 Year)",
    description: "Premium for up to 6 family members living under one roof",
    price: 179.88,
    digitalContent: ["spotify_family1@example.com:spotfamily123"],
    categoryId: "4",
    allowPreorder: true,
    preorderNote: "Account details will be sent within 12 hours",
    createdAt: new Date("2023-05-05"),
    updatedAt: new Date("2023-05-05"),
    isAvailable: true,
  },
]

// Mock orders data
const mockOrders = [
  {
    _id: "1",
    userId: "1",
    productId: "1",
    quantity: 1,
    unitPrice: 14.99,
    totalAmount: 14.99,
    type: "purchase",
    status: "completed",
    createdAt: new Date("2023-01-20T10:30:00"),
    updatedAt: new Date("2023-01-20T10:35:00"),
    completedAt: new Date("2023-01-20T10:35:00"),
    statusHistory: [
      { status: "pending", timestamp: new Date("2023-01-20T10:30:00") },
      { status: "completed", timestamp: new Date("2023-01-20T10:35:00"), note: "Payment confirmed" },
    ],
  },
  {
    _id: "2",
    userId: "2",
    productId: "2",
    quantity: 1,
    unitPrice: 24.99,
    totalAmount: 24.99,
    type: "preorder",
    status: "pending",
    customerNote: "Please send as soon as possible",
    createdAt: new Date("2023-02-15T14:15:00"),
    updatedAt: new Date("2023-02-15T14:15:00"),
    preorderConfirmationDate: new Date("2023-02-16T14:15:00"),
    statusHistory: [{ status: "pending", timestamp: new Date("2023-02-15T14:15:00") }],
  },
  {
    _id: "3",
    userId: "3",
    productId: "3",
    quantity: 2,
    unitPrice: 19.99,
    totalAmount: 39.98,
    type: "purchase",
    status: "completed",
    createdAt: new Date("2023-02-25T09:45:00"),
    updatedAt: new Date("2023-02-25T10:00:00"),
    completedAt: new Date("2023-02-25T10:00:00"),
    statusHistory: [
      { status: "pending", timestamp: new Date("2023-02-25T09:45:00") },
      { status: "completed", timestamp: new Date("2023-02-25T10:00:00") },
    ],
  },
  {
    _id: "4",
    userId: "4",
    productId: "5",
    quantity: 1,
    unitPrice: 79.99,
    totalAmount: 79.99,
    type: "preorder",
    status: "cancelled",
    createdAt: new Date("2023-03-10T16:20:00"),
    updatedAt: new Date("2023-03-11T11:30:00"),
    statusHistory: [
      { status: "pending", timestamp: new Date("2023-03-10T16:20:00") },
      { status: "cancelled", timestamp: new Date("2023-03-11T11:30:00"), note: "Customer requested cancellation" },
    ],
  },
  {
    _id: "5",
    userId: "5",
    productId: "6",
    quantity: 1,
    unitPrice: 38.97,
    totalAmount: 38.97,
    type: "purchase",
    status: "pending",
    createdAt: new Date("2023-03-20T13:10:00"),
    updatedAt: new Date("2023-03-20T13:10:00"),
    statusHistory: [{ status: "pending", timestamp: new Date("2023-03-20T13:10:00") }],
  },
  {
    _id: "6",
    userId: "6",
    productId: "8",
    quantity: 2,
    unitPrice: 50.0,
    totalAmount: 100.0,
    type: "purchase",
    status: "completed",
    createdAt: new Date("2023-04-05T09:15:00"),
    updatedAt: new Date("2023-04-05T09:20:00"),
    completedAt: new Date("2023-04-05T09:20:00"),
    statusHistory: [
      { status: "pending", timestamp: new Date("2023-04-05T09:15:00") },
      { status: "completed", timestamp: new Date("2023-04-05T09:20:00") },
    ],
  },
  {
    _id: "7",
    userId: "7",
    productId: "4",
    quantity: 1,
    unitPrice: 59.99,
    totalAmount: 59.99,
    type: "preorder",
    status: "pending",
    customerNote: "Gift for my brother",
    createdAt: new Date("2023-04-12T17:45:00"),
    updatedAt: new Date("2023-04-12T17:45:00"),
    preorderConfirmationDate: new Date("2023-04-14T17:45:00"),
    statusHistory: [{ status: "pending", timestamp: new Date("2023-04-12T17:45:00") }],
  },
  {
    _id: "8",
    userId: "8",
    productId: "7",
    quantity: 1,
    unitPrice: 54.99,
    totalAmount: 54.99,
    type: "purchase",
    status: "completed",
    createdAt: new Date("2023-04-18T11:30:00"),
    updatedAt: new Date("2023-04-18T11:35:00"),
    completedAt: new Date("2023-04-18T11:35:00"),
    statusHistory: [
      { status: "pending", timestamp: new Date("2023-04-18T11:30:00") },
      { status: "completed", timestamp: new Date("2023-04-18T11:35:00") },
    ],
  },
  {
    _id: "9",
    userId: "1",
    productId: "9",
    quantity: 1,
    unitPrice: 59.99,
    totalAmount: 59.99,
    type: "purchase",
    status: "pending",
    createdAt: new Date("2023-04-25T14:20:00"),
    updatedAt: new Date("2023-04-25T14:20:00"),
    statusHistory: [{ status: "pending", timestamp: new Date("2023-04-25T14:20:00") }],
  },
  {
    _id: "10",
    userId: "2",
    productId: "10",
    quantity: 1,
    unitPrice: 119.99,
    totalAmount: 119.99,
    type: "preorder",
    status: "pending",
    customerNote: "Please send activation instructions",
    createdAt: new Date("2023-05-01T09:30:00"),
    updatedAt: new Date("2023-05-01T09:30:00"),
    preorderConfirmationDate: new Date("2023-05-03T09:30:00"),
    statusHistory: [{ status: "pending", timestamp: new Date("2023-05-01T09:30:00") }],
  },
  {
    _id: "11",
    userId: "3",
    productId: "11",
    quantity: 1,
    unitPrice: 41.97,
    totalAmount: 41.97,
    type: "purchase",
    status: "completed",
    createdAt: new Date("2023-05-05T16:45:00"),
    updatedAt: new Date("2023-05-05T16:50:00"),
    completedAt: new Date("2023-05-05T16:50:00"),
    statusHistory: [
      { status: "pending", timestamp: new Date("2023-05-05T16:45:00") },
      { status: "completed", timestamp: new Date("2023-05-05T16:50:00") },
    ],
  },
  {
    _id: "12",
    userId: "4",
    productId: "12",
    quantity: 1,
    unitPrice: 179.88,
    totalAmount: 179.88,
    type: "preorder",
    status: "cancelled",
    createdAt: new Date("2023-05-08T11:15:00"),
    updatedAt: new Date("2023-05-09T09:20:00"),
    statusHistory: [
      { status: "pending", timestamp: new Date("2023-05-08T11:15:00") },
      { status: "cancelled", timestamp: new Date("2023-05-09T09:20:00"), note: "Customer changed their mind" },
    ],
  },
  {
    _id: "13",
    userId: "5",
    productId: "1",
    quantity: 2,
    unitPrice: 14.99,
    totalAmount: 29.98,
    type: "purchase",
    status: "completed",
    createdAt: new Date("2023-05-10T13:25:00"),
    updatedAt: new Date("2023-05-10T13:30:00"),
    completedAt: new Date("2023-05-10T13:30:00"),
    statusHistory: [
      { status: "pending", timestamp: new Date("2023-05-10T13:25:00") },
      { status: "completed", timestamp: new Date("2023-05-10T13:30:00") },
    ],
  },
  {
    _id: "14",
    userId: "6",
    productId: "3",
    quantity: 1,
    unitPrice: 19.99,
    totalAmount: 19.99,
    type: "purchase",
    status: "completed",
    createdAt: new Date("2023-05-12T10:15:00"),
    updatedAt: new Date("2023-05-12T10:20:00"),
    completedAt: new Date("2023-05-12T10:20:00"),
    statusHistory: [
      { status: "pending", timestamp: new Date("2023-05-12T10:15:00") },
      { status: "completed", timestamp: new Date("2023-05-12T10:20:00") },
    ],
  },
  {
    _id: "15",
    userId: "7",
    productId: "5",
    quantity: 1,
    unitPrice: 79.99,
    totalAmount: 79.99,
    type: "preorder",
    status: "pending",
    createdAt: new Date("2023-05-15T15:40:00"),
    updatedAt: new Date("2023-05-15T15:40:00"),
    preorderConfirmationDate: new Date("2023-05-17T15:40:00"),
    statusHistory: [{ status: "pending", timestamp: new Date("2023-05-15T15:40:00") }],
  },
]

// Mock notifications data
const mockNotifications = [
  {
    _id: "1",
    title: "Welcome to our platform",
    message: "Thank you for joining our digital marketplace. Explore our products and enjoy shopping!",
    audience: "all",
    createdAt: new Date("2023-01-10T09:00:00"),
    sentAt: new Date("2023-01-10T09:00:00"),
    status: "sent",
  },
  {
    _id: "2",
    title: "New Xbox Game Pass Products",
    message: "Check out our new Xbox Game Pass products with special discounts!",
    audience: "specific",
    userIds: ["1", "3", "5", "7"],
    createdAt: new Date("2023-02-05T10:30:00"),
    sentAt: new Date("2023-02-05T10:30:00"),
    status: "sent",
  },
  {
    _id: "3",
    title: "PlayStation Plus Membership Sale",
    message: "Limited time offer: 20% off on all PlayStation Plus memberships!",
    audience: "all",
    createdAt: new Date("2023-03-01T14:15:00"),
    sentAt: new Date("2023-03-01T14:15:00"),
    status: "sent",
  },
  {
    _id: "4",
    title: "Upcoming Maintenance",
    message: "Our platform will be undergoing maintenance on May 20, 2023, from 2 AM to 4 AM UTC.",
    audience: "all",
    createdAt: new Date("2023-05-15T11:00:00"),
    sentAt: new Date("2023-05-15T11:00:00"),
    status: "sent",
  },
  {
    _id: "5",
    title: "Special Offer for Loyal Customers",
    message: "As a token of appreciation, we're offering a 15% discount on your next purchase. Use code LOYAL15.",
    audience: "specific",
    userIds: ["2", "6", "8"],
    createdAt: new Date("2023-04-10T13:45:00"),
    sentAt: new Date("2023-04-10T13:45:00"),
    status: "sent",
  },
  {
    _id: "6",
    title: "New Streaming Services Available",
    message: "We've added new streaming service subscriptions to our catalog. Check them out now!",
    audience: "all",
    createdAt: new Date("2023-04-20T09:30:00"),
    sentAt: new Date("2023-04-20T09:30:00"),
    status: "sent",
  },
  {
    _id: "7",
    title: "Your Feedback Matters",
    message: "We value your opinion. Please take a moment to complete our customer satisfaction survey.",
    audience: "specific",
    userIds: ["1", "2", "3", "4", "5"],
    createdAt: new Date("2023-05-01T15:20:00"),
    sentAt: new Date("2023-05-01T15:20:00"),
    status: "sent",
  },
  {
    _id: "8",
    title: "Holiday Season Promotions",
    message: "Get ready for our upcoming holiday season promotions with exclusive deals and discounts!",
    audience: "all",
    createdAt: new Date("2023-05-10T10:00:00"),
    status: "draft",
  },
  {
    _id: "9",
    title: "Account Security Reminder",
    message:
      "Remember to keep your account secure by regularly updating your password and enabling two-factor authentication.",
    audience: "all",
    createdAt: new Date("2023-05-12T11:30:00"),
    status: "scheduled",
    scheduledFor: new Date("2023-05-20T09:00:00"),
  },
  {
    _id: "10",
    title: "Exclusive Gaming Gift Cards",
    message: "Introducing our new collection of gaming gift cards. Perfect for gifting to friends and family!",
    audience: "specific",
    userIds: ["1", "4", "7", "8"],
    createdAt: new Date("2023-05-15T14:00:00"),
    status: "scheduled",
    scheduledFor: new Date("2023-05-22T10:00:00"),
  },
] as INotification[]

// Mock user data
const mockUsers = {
  "1": { telegramId: 123456789, username: "john_doe" },
  "2": { telegramId: 987654321, username: "jane_smith" },
  "3": { telegramId: 456789123, username: "bob_johnson" },
  "4": { telegramId: 789123456, username: "alice_brown" },
  "5": { telegramId: 321654987, username: "charlie_davis" },
  "6": { telegramId: 654987321, username: "emma_wilson" },
  "7": { telegramId: 147258369, username: "frank_miller" },
  "8": { telegramId: 258369147, username: "grace_taylor" },
}

// Chart colors
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#8dd1e1"]

export default function AnalyticsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("products")
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: subDays(new Date(), 90),
    to: new Date(),
  })

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [productFilters, setProductFilters] = useState({
    categoryId: "all",
    availability: "all",
    priceRange: [0, 200] as [number, number],
  })
  const [orderFilters, setOrderFilters] = useState({
    status: "all",
    type: "all",
  })
  const [notificationFilters, setNotificationFilters] = useState({
    audience: "all",
    status: "all",
  })

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Chart type state
  const [chartType, setChartType] = useState<"bar" | "line" | "pie" | "area">("line")

  // Loading state
  const [isLoading, setIsLoading] = useState(false)

  // Filter data based on date range
  const filterByDateRange = <T extends { createdAt: Date }>(data: T[]): T[] => {
    return data.filter((item) => {
      const itemDate = new Date(item.createdAt)
      return (
        (!dateRange.from || isAfter(itemDate, dateRange.from)) && (!dateRange.to || isBefore(itemDate, dateRange.to))
      )
    })
  }

  // Filtered data
  const filteredProducts = useMemo(() => {
    let filtered = filterByDateRange(mockProducts)

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          (product.description && product.description.toLowerCase().includes(term)),
      )
    }

    // Apply category filter
    if (productFilters.categoryId !== "all") {
      filtered = filtered.filter((product) => product.categoryId === productFilters.categoryId)
    }

    // Apply availability filter
    if (productFilters.availability !== "all") {
      const isAvailable = productFilters.availability === "available"
      filtered = filtered.filter((product) => product.isAvailable === isAvailable)
    }

    // Apply price range filter
    filtered = filtered.filter(
      (product) => product.price >= productFilters.priceRange[0] && product.price <= productFilters.priceRange[1],
    )

    return filtered
  }, [mockProducts, dateRange, searchTerm, productFilters])

  const filteredOrders = useMemo(() => {
    let filtered = filterByDateRange(mockOrders)

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order._id?.includes(term) ||
          mockUsers[order.userId as keyof typeof mockUsers]?.username.toLowerCase().includes(term) ||
          mockProducts[order.productId as keyof typeof mockProducts]?.name.toLowerCase().includes(term),
      )
    }

    // Apply status filter
    if (orderFilters.status !== "all") {
      filtered = filtered.filter((order) => order.status === orderFilters.status)
    }

    // Apply type filter
    if (orderFilters.type !== "all") {
      filtered = filtered.filter((order) => order.type === orderFilters.type)
    }

    return filtered
  }, [mockOrders, dateRange, searchTerm, orderFilters])

  const filteredNotifications = useMemo(() => {
    let filtered = filterByDateRange(mockNotifications)

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (notification) =>
          notification.title.toLowerCase().includes(term) || notification.message.toLowerCase().includes(term),
      )
    }

    // Apply audience filter
    if (notificationFilters.audience !== "all") {
      filtered = filtered.filter((notification) => notification.audience === notificationFilters.audience)
    }

    // Apply status filter
    if (notificationFilters.status !== "all") {
      filtered = filtered.filter((notification) => notification.status === notificationFilters.status)
    }

    return filtered
  }, [mockNotifications, dateRange, searchTerm, notificationFilters])

  // Pagination logic
  const getPaginatedData = <T,>(data: T[]) => {
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    return {
      currentItems: data.slice(indexOfFirstItem, indexOfLastItem),
      totalPages: Math.ceil(data.length / itemsPerPage),
    }
  }

  const { currentItems: paginatedProducts, totalPages: productTotalPages } = getPaginatedData(filteredProducts)
  const { currentItems: paginatedOrders, totalPages: orderTotalPages } = getPaginatedData(filteredOrders)
  const { currentItems: paginatedNotifications, totalPages: notificationTotalPages } =
    getPaginatedData(filteredNotifications)

  // Chart data preparation
  const prepareProductChartData = () => {
    // Group products by category
    const categoryData = filteredProducts.reduce(
      (acc, product) => {
        const category = mockCategories.find((c) => c._id === product.categoryId)?.name || "Unknown"
        if (!acc[category]) {
          acc[category] = {
            count: 0,
            totalValue: 0,
          }
        }
        acc[category].count += 1
        acc[category].totalValue += product.price
        return acc
      },
      {} as Record<string, { count: number; totalValue: number }>,
    )

    // Convert to array format for charts
    return Object.entries(categoryData).map(([name, data]) => ({
      name,
      count: data.count,
      value: data.totalValue,
    }))
  }

  const prepareOrderChartData = () => {
    // Group orders by month and status
    const monthlyData: Record<string, Record<string, number>> = {}

    filteredOrders.forEach((order) => {
      const month = format(new Date(order.createdAt), "MMM yyyy")
      if (!monthlyData[month]) {
        monthlyData[month] = {
          pending: 0,
          completed: 0,
          cancelled: 0,
          total: 0,
        }
      }
      monthlyData[month][order.status] += order.totalAmount
      monthlyData[month].total += order.totalAmount
    })

    // Convert to array format for charts
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        pending: data.pending,
        completed: data.completed,
        cancelled: data.cancelled,
        total: data.total,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateA.getTime() - dateB.getTime()
      })
  }

  const prepareNotificationChartData = () => {
    // Group notifications by status and audience
    const statusData = filteredNotifications.reduce(
      (acc, notification) => {
        if (!acc[notification.status]) {
          acc[notification.status] = 0
        }
        acc[notification.status] += 1
        return acc
      },
      {} as Record<string, number>,
    )

    const audienceData = filteredNotifications.reduce(
      (acc, notification) => {
        if (!acc[notification.audience]) {
          acc[notification.audience] = 0
        }
        acc[notification.audience] += 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      statusData: Object.entries(statusData).map(([name, value]) => ({ name, value })),
      audienceData: Object.entries(audienceData).map(([name, value]) => ({ name, value })),
    }
  }

  // Export data to CSV
  const exportToCSV = (data: any[], filename: string) => {
    setIsLoading(true)

    try {
      // Convert data to CSV format
      let csvContent = ""

      // Get headers
      const headers = Object.keys(data[0]).filter((key) => key !== "_id")
      csvContent += headers.join(",") + "\n"

      // Add rows
      data.forEach((item) => {
        const row = headers
          .map((header) => {
            const value = item[header]

            // Format dates
            if (value instanceof Date) {
              return `"${format(value, "yyyy-MM-dd HH:mm:ss")}"`
            }

            // Handle arrays and objects
            if (typeof value === "object" && value !== null) {
              return `"${JSON.stringify(value).replace(/"/g, '""')}"`
            }

            // Handle strings with commas
            if (typeof value === "string" && value.includes(",")) {
              return `"${value}"`
            }

            return value
          })
          .join(",")

        csvContent += row + "\n"
      })

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export successful",
        description: `Data has been exported to ${filename}.csv`,
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "An error occurred while exporting data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh data
  const refreshData = () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Data refreshed",
        description: "The latest data has been loaded.",
      })
    }, 1000)
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return format(new Date(date), "MMM d, yyyy")
  }

  // Get category name
  const getCategoryName = (categoryId: string) => {
    const category = mockCategories.find((c) => c._id === categoryId)
    return category ? category.name : "Unknown"
  }

  // Pagination handler
  const paginate = (pageNumber: number, totalPages: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("")
    setProductFilters({
      categoryId: "all",
      availability: "all",
      priceRange: [0, 200],
    })
    setOrderFilters({
      status: "all",
      type: "all",
    })
    setNotificationFilters({
      audience: "all",
      status: "all",
    })
    setDateRange({
      from: subDays(new Date(), 90),
      to: new Date(),
    })
    setCurrentPage(1)
  }

  // Render pagination
  const renderPagination = (totalPages: number) => {
    if (totalPages <= 1) return null

    return (
      <div className="mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => paginate(currentPage - 1, totalPages)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current page
              if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink isActive={page === currentPage} onClick={() => paginate(page, totalPages)}>
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              }

              // Show ellipsis for gaps
              if (page === 2 && currentPage > 3) {
                return (
                  <PaginationItem key={page}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }

              if (page === totalPages - 1 && currentPage < totalPages - 2) {
                return (
                  <PaginationItem key={page}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }

              return null
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => paginate(currentPage + 1, totalPages)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Historical Data Analytics</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
          <Button
            onClick={() => {
              switch (activeTab) {
                case "products":
                  exportToCSV(filteredProducts, "products-export")
                  break
                case "orders":
                  exportToCSV(filteredOrders, "orders-export")
                  break
                case "notifications":
                  exportToCSV(filteredNotifications, "notifications-export")
                  break
              }
            }}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Date Range and Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[300px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                    </>
                  ) : (
                    formatDate(dateRange.from)
                  )
                ) : (
                  "Select date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range || { from: undefined, to: undefined })
                  setCurrentPage(1)
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button variant="ghost" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category-filter">Category</Label>
                  <Select
                    value={productFilters.categoryId}
                    onValueChange={(value) => {
                      setProductFilters({ ...productFilters, categoryId: value })
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger id="category-filter">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {mockCategories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availability-filter">Availability</Label>
                  <Select
                    value={productFilters.availability}
                    onValueChange={(value) => {
                      setProductFilters({ ...productFilters, availability: value })
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger id="availability-filter">
                      <SelectValue placeholder="All Products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="price-range">Price Range</Label>
                    <span className="text-sm text-muted-foreground">
                      ${productFilters.priceRange[0]} - ${productFilters.priceRange[1]}
                    </span>
                  </div>
                  <Slider
                    id="price-range"
                    min={0}
                    max={200}
                    step={5}
                    value={productFilters.priceRange}
                    onValueChange={(value) => {
                      setProductFilters({ ...productFilters, priceRange: value as [number, number] })
                      setCurrentPage(1)
                    }}
                    className="mt-6"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredProducts.length}</div>
                <p className="text-xs text-muted-foreground">
                  {dateRange.from && dateRange.to
                    ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
                    : "All time"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Available Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredProducts.filter((p) => p.isAvailable).length}</div>
                <p className="text-xs text-muted-foreground">
                  {((filteredProducts.filter((p) => p.isAvailable).length / filteredProducts.length) * 100).toFixed(1)}%
                  of total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {filteredProducts.length > 0
                    ? (filteredProducts.reduce((sum, p) => sum + p.price, 0) / filteredProducts.length).toFixed(2)
                    : "0.00"}
                </div>
                <p className="text-xs text-muted-foreground">Per product</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pre-order Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredProducts.filter((p) => p.allowPreorder).length}</div>
                <p className="text-xs text-muted-foreground">
                  {((filteredProducts.filter((p) => p.allowPreorder).length / filteredProducts.length) * 100).toFixed(
                    1,
                  )}
                  % of total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <CardTitle>Product Analytics</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={chartType === "bar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("bar")}
                  >
                    <BarChart2 className="h-4 w-4 mr-1" />
                    Bar
                  </Button>
                  <Button
                    variant={chartType === "line" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("line")}
                  >
                    <LineChartIcon className="h-4 w-4 mr-1" />
                    Line
                  </Button>
                  <Button
                    variant={chartType === "pie" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("pie")}
                  >
                    <PieChartIcon className="h-4 w-4 mr-1" />
                    Pie
                  </Button>
                  <Button
                    variant={chartType === "area" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("area")}
                  >
                    <BarChart2 className="h-4 w-4 mr-1" />
                    Area
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                {chartType === "bar" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareProductChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <RechartsTooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" name="Number of Products" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="value" name="Total Value ($)" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {chartType === "line" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={prepareProductChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <RechartsTooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="count"
                        name="Number of Products"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line yAxisId="right" type="monotone" dataKey="value" name="Total Value ($)" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {chartType === "pie" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareProductChartData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {prepareProductChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {chartType === "area" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prepareProductChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Area type="monotone" dataKey="count" name="Number of Products" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="value" name="Total Value ($)" stroke="#82ca9d" fill="#82ca9d" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Product Data</CardTitle>
              <CardDescription>
                Showing {paginatedProducts.length} of {filteredProducts.length} products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pre-order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedProducts.map((product) => (
                        <TableRow key={product._id}>
                          <TableCell className="font-medium">
                            <div className="max-w-[300px]">
                              {product.name}
                              {product.description && (
                                <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getCategoryName(product.categoryId)}</Badge>
                          </TableCell>
                          <TableCell>${product.price.toFixed(2)}</TableCell>
                          <TableCell>{formatDate(product.createdAt)}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                product.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }
                            >
                              {product.isAvailable ? "Available" : "Unavailable"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={product.allowPreorder ? "default" : "outline"}
                              className={product.allowPreorder ? "bg-blue-100 text-blue-800" : ""}
                            >
                              {product.allowPreorder ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {renderPagination(productTotalPages)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select
                    value={orderFilters.status}
                    onValueChange={(value) => {
                      setOrderFilters({ ...orderFilters, status: value })
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type-filter">Type</Label>
                  <Select
                    value={orderFilters.type}
                    onValueChange={(value) => {
                      setOrderFilters({ ...orderFilters, type: value })
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger id="type-filter">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="preorder">Pre-order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredOrders.length}</div>
                <p className="text-xs text-muted-foreground">
                  {dateRange.from && dateRange.to
                    ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
                    : "All time"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {filteredOrders.filter((o) => o.status === "completed").length} completed orders
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {filteredOrders.length > 0
                    ? (
                        filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0) / filteredOrders.length
                      ).toFixed(2)
                    : "0.00"}
                </div>
                <p className="text-xs text-muted-foreground">Per order</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredOrders.filter((o) => o.status === "pending").length}</div>
                <p className="text-xs text-muted-foreground">
                  {(
                    (filteredOrders.filter((o) => o.status === "pending").length / filteredOrders.length) *
                    100
                  ).toFixed(1)}
                  % of total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <CardTitle>Order Analytics</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={chartType === "bar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("bar")}
                  >
                    <BarChart2 className="h-4 w-4 mr-1" />
                    Bar
                  </Button>
                  <Button
                    variant={chartType === "line" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("line")}
                  >
                    <LineChartIcon className="h-4 w-4 mr-1" />
                    Line
                  </Button>
                  <Button
                    variant={chartType === "pie" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("pie")}
                  >
                    <PieChartIcon className="h-4 w-4 mr-1" />
                    Pie
                  </Button>
                  <Button
                    variant={chartType === "area" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("area")}
                  >
                    <BarChart2 className="h-4 w-4 mr-1" />
                    Area
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                {chartType === "bar" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareOrderChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="pending" name="Pending" fill="#FFBB28" />
                      <Bar dataKey="completed" name="Completed" fill="#00C49F" />
                      <Bar dataKey="cancelled" name="Cancelled" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {chartType === "line" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={prepareOrderChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Total Revenue"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line type="monotone" dataKey="completed" name="Completed Orders" stroke="#00C49F" />
                      <Line type="monotone" dataKey="pending" name="Pending Orders" stroke="#FFBB28" />
                      <Line type="monotone" dataKey="cancelled" name="Cancelled Orders" stroke="#FF8042" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {chartType === "pie" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Pending", value: filteredOrders.filter((o) => o.status === "pending").length },
                          { name: "Completed", value: filteredOrders.filter((o) => o.status === "completed").length },
                          { name: "Cancelled", value: filteredOrders.filter((o) => o.status === "cancelled").length },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill="#FFBB28" /> {/* Pending */}
                        <Cell fill="#00C49F" /> {/* Completed */}
                        <Cell fill="#FF8042" /> {/* Cancelled */}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {chartType === "area" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prepareOrderChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Area type="monotone" dataKey="total" name="Total Revenue" stroke="#8884d8" fill="#8884d8" />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        name="Completed Orders"
                        stroke="#00C49F"
                        fill="#00C49F"
                      />
                      <Area type="monotone" dataKey="pending" name="Pending Orders" stroke="#FFBB28" fill="#FFBB28" />
                      <Area
                        type="monotone"
                        dataKey="cancelled"
                        name="Cancelled Orders"
                        stroke="#FF8042"
                        fill="#FF8042"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Order Data</CardTitle>
              <CardDescription>
                Showing {paginatedOrders.length} of {filteredOrders.length} orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                          No orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedOrders.map((order) => (
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">#{order._id}</TableCell>
                          <TableCell>
                            {mockUsers[order.userId as keyof typeof mockUsers]?.username || "Unknown"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {mockProducts.find((p) => p._id === order.productId)?.name || "Unknown"}
                          </TableCell>
                          <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={order.type === "preorder" ? "default" : "outline"}
                              className={order.type === "preorder" ? "bg-blue-100 text-blue-800" : ""}
                            >
                              {order.type === "preorder" ? "Pre-order" : "Purchase"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                order.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : order.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {renderPagination(orderTotalPages)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="audience-filter">Audience</Label>
                  <Select
                    value={notificationFilters.audience}
                    onValueChange={(value) => {
                      setNotificationFilters({ ...notificationFilters, audience: value })
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger id="audience-filter">
                      <SelectValue placeholder="All Audiences" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Audiences</SelectItem>
                      <SelectItem value="specific">Specific Users</SelectItem>
                      <SelectItem value="all">All Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification-status-filter">Status</Label>
                  <Select
                    value={notificationFilters.status}
                    onValueChange={(value) => {
                      setNotificationFilters({ ...notificationFilters, status: value })
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger id="notification-status-filter">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredNotifications.length}</div>
                <p className="text-xs text-muted-foreground">
                  {dateRange.from && dateRange.to
                    ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
                    : "All time"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredNotifications.filter((n) => n.status === "sent").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(
                    (filteredNotifications.filter((n) => n.status === "sent").length / filteredNotifications.length) *
                    100
                  ).toFixed(1)}
                  % of total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Scheduled Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredNotifications.filter((n) => n.status === "scheduled").length}
                </div>
                <p className="text-xs text-muted-foreground">Pending delivery</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Draft Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredNotifications.filter((n) => n.status === "draft").length}
                </div>
                <p className="text-xs text-muted-foreground">Not yet scheduled</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <CardTitle>Notification Analytics</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={chartType === "bar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("bar")}
                  >
                    <BarChart2 className="h-4 w-4 mr-1" />
                    Bar
                  </Button>
                  <Button
                    variant={chartType === "pie" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setChartType("pie")}
                  >
                    <PieChartIcon className="h-4 w-4 mr-1" />
                    Pie
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                {chartType === "bar" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareNotificationChartData().statusData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="value" name="Count" fill="#8884d8">
                        {prepareNotificationChartData().statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {chartType === "pie" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                    <div>
                      <h3 className="text-center font-medium mb-2">By Status</h3>
                      <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                          <Pie
                            data={prepareNotificationChartData().statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {prepareNotificationChartData().statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <h3 className="text-center font-medium mb-2">By Audience</h3>
                      <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                          <Pie
                            data={prepareNotificationChartData().audienceData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {prepareNotificationChartData().audienceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Data</CardTitle>
              <CardDescription>
                Showing {paginatedNotifications.length} of {filteredNotifications.length} notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Sent/Scheduled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedNotifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No notifications found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedNotifications.map((notification) => (
                        <TableRow key={notification._id}>
                          <TableCell className="font-medium">
                            <div className="max-w-[300px]">
                              {notification.title}
                              <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={notification.audience === "specific" ? "outline" : "default"}>
                              {notification.audience === "specific" ? "Specific Users" : "All Users"}
                            </Badge>
                            {notification.audience === "specific" && notification.userIds && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.userIds.length} recipients
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                notification.status === "sent"
                                  ? "bg-green-100 text-green-800"
                                  : notification.status === "scheduled"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(notification.createdAt)}</TableCell>
                          <TableCell>
                            {notification.sentAt ? (
                              formatDate(notification.sentAt)
                            ) : notification.scheduledFor ? (
                              <span className="text-blue-600">{formatDate(notification.scheduledFor)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {renderPagination(notificationTotalPages)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

