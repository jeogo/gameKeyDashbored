// User Interface
export interface IUser {
  _id?: string;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Product Interface
export interface IProduct {
  _id?: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  isAvailable: boolean;
  digitalContent: string[];
  allowPreorder: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Order Interface
export interface IOrder {
  _id?: string;
  userId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: "pending" | "paid" | "delivered" | "cancelled";
  deliveredContent?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Payment Transaction Interface
export interface IPaymentTransaction {
  _id?: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  cryptoType?: string;
  status: "pending" | "completed" | "failed" | "cancelled" | "refunded";
  paymentProvider: string;
  providerTransactionId?: string;
  paymentUrl?: string;
  cryptoAddress?: string;
  createdAt: Date;
}

// Category Interface
export interface ICategory {
  _id?: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Notification Interface
export interface INotification {
  _id?: string;
  userId?: string;
  type: "order" | "payment" | "system" | "promo";
  title: string;
  message: string;
  isRead: boolean;
  data?: any;
  createdAt: Date;
}

// API Response Interfaces
export interface PaginatedResponse<T> {
  data: T[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  total?: number;
  success?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// API Request Interfaces
export interface CreateUserRequest {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface CreateProductRequest {
  name: string;
  categoryId: string;
  price: number;
  description?: string;
  isAvailable?: boolean;
  digitalContent: string[]; // REQUIRED - must be non-empty array
  allowPreorder?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  price?: number;
  description?: string;
  isAvailable?: boolean;
  digitalContent?: string[];
  allowPreorder?: boolean;
}

export interface CreateOrderRequest {
  userId: string;
  productId: string;
  quantity: number;
}

export interface UpdateOrderStatusRequest {
  status: "pending" | "paid" | "delivered" | "cancelled";
}

export interface FulfillOrderRequest {
  content: string[];
  note?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateBulkNotificationRequest {
  title: string;
  message: string;
  audience: "all_users" | "active_users" | "specific_users";
  targetUserIds?: number[];
}

export interface SendMessageRequest {
  message: string;
}

// Query Parameters Interfaces
export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface GetPaymentsParams {
  page?: number;
  limit?: number;
  status?: string;
  provider?: string;
  userId?: string;
}

export interface GetNotificationsParams {
  userId?: string;
  type?: string;
}
