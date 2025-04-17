/**
 * User model for MongoDB
 */
interface IUser {
  _id?: string;               // MongoDB document ID
  telegramId: number;         // Telegram user ID
  username?: string;          // Optional Telegram username
  isAccepted: boolean;        // Whether the user is accepted/approved in the system
  createdAt: Date;            // Account creation timestamp
  updatedAt: Date;            // Last update timestamp
}

/**
 * Digital Product model for MongoDB
 */
interface IProduct {
  _id?: string;              // MongoDB document ID
  name: string;              // Name of the product
  description?: string;      // Optional description of the product
  price: number;             // Price of the product
  digitalContent: string[];  // Array of "email:password" strings
  categoryId: string;        // Reference to the category ID
  allowPreorder: boolean;    // Whether this product can be pre-ordered
  preorderNote?: string;     // Optional note about pre-orders (e.g., "سيتم التوصيل خلال يومين")
  createdAt: Date;           // Timestamp when the product was created
  updatedAt: Date;           // Timestamp when the product was last updated
  isAvailable: boolean;      // Whether the product is currently available
}

/**
 * Category model for MongoDB
 */
interface ICategory {
  _id?: string;              // MongoDB document ID
  name: string;              // Name of the category (e.g., "Xbox Subscriptions")
  description?: string;      // Optional description of the category
  createdAt: Date;           // Timestamp when the category was created
  updatedAt: Date;           // Timestamp when the category was last updated
}

/**
 * Order model for MongoDB
 */
interface IOrder {
  _id?: string;                                    // MongoDB document ID
  userId: string;                                  // User ID reference
  productId: string;                               // Product ID reference
  quantity: number;                                // Quantity of products ordered
  unitPrice: number;                               // Unit price at time of purchase
  totalAmount: number;                             // Total amount (quantity * unitPrice)
  type: "purchase" | "preorder";                   // Type of order
  status: "pending" | "completed" | "cancelled";   // Order status
  customerNote?: string;                           // Optional note from customer
  createdAt: Date;                                 // Order creation timestamp
  updatedAt: Date;                                 // Last update timestamp
  completedAt?: Date;                              // When order was completed/fulfilled
  
  // Preorder specific fields (only used when type is "preorder")
  preorderConfirmationDate?: Date;                 // Date when preorder was confirmed

  // Status history tracking
  statusHistory: {
    status: "pending" | "completed" | "cancelled";
    timestamp: Date;
    note?: string;
  }[];
}

/**
 * Payment Transaction model for MongoDB
 */
interface IPaymentTransaction {
  _id?: string;                          // MongoDB document ID
  orderId: string;                       // Reference to store order
  userId: string;                        // User who made the payment
  paymentProvider: 'paypal' | 'crypto'  // Payment method
  
  // Payment details
  providerTransactionId?: string;        // Transaction ID from provider
  amount: number;                        // Transaction amount
  currency: string;                      // Currency code (USD, EUR, etc)
  
  // Status
  status: 'pending' | 'completed' | 'failed' | 'cancelled'; // Payment status
  
  // PayPal specific fields
  paypalOrderId?: string;                // PayPal order ID
  paypalCaptureId?: string;              // PayPal capture ID
  
  // Crypto specific fields
  cryptoType?: 'usdt' | 'btc' | 'eth';   // Type of cryptocurrency
  cryptoNetwork?: string;                // Network (e.g., TRC20, ERC20)
  cryptoAddress?: string;                // Wallet address for payment
  cryptoTxHash?: string;                 // Transaction hash on blockchain
  
  // Timestamps
  createdAt: Date;                       // When transaction was created
  updatedAt: Date;                       // Last update
  completedAt?: Date;                    // When payment completed
}

/**
 * Notification model for MongoDB
 */
interface INotification {
  _id?: string;               // MongoDB document ID
  title: string;              // Title of the notification
  message: string;            // Content of the notification
  audience: "all" | "specific_users"; // Target audience
  targetUserIds?: number[];   // Telegram IDs for specific users (if audience is "specific_users")
  createdAt: Date;            // Creation timestamp
}

// API Error class for better error handling
export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Authentication interfaces
export interface IAuthResponse {
  token: string;
  user: IUser;
  expiresAt?: string;
}

// Pagination and query parameters
export interface IQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  filter?: Record<string, any>;
  [key: string]: any;
}

export interface IPaginatedResponse<T> {
  data: T[];
  metadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type { IUser, IProduct, ICategory, IOrder, IPaymentTransaction, INotification };
