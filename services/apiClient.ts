import {
  IUser,
  IProduct,
  IOrder,
  IPaymentTransaction,
  ICategory,
  INotification,
  PaginatedResponse,
  ApiResponse,
  CreateUserRequest,
  UpdateUserRequest,
  CreateProductRequest,
  UpdateProductRequest,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  FulfillOrderRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateBulkNotificationRequest,
  SendMessageRequest,
  GetUsersParams,
  GetProductsParams,
  GetOrdersParams,
  GetPaymentsParams,
  GetNotificationsParams,
} from "@/types/interfaces";

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * Build query string from params object
   */
  private buildQueryString(params: Record<string, any>): string {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : "";
  }

  // ==================== USERS ====================

  async getUsers(
    params?: GetUsersParams
  ): Promise<PaginatedResponse<IUser> | ApiResponse<IUser[]>> {
    const queryString = params ? this.buildQueryString(params) : "";
    return this.request<PaginatedResponse<IUser> | ApiResponse<IUser[]>>(
      `/users${queryString}`
    );
  }

  async createUser(data: CreateUserRequest): Promise<ApiResponse<IUser>> {
    return this.request<ApiResponse<IUser>>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getUser(id: string): Promise<ApiResponse<IUser>> {
    return this.request<ApiResponse<IUser>>(`/users/${id}`);
  }

  async getUserByTelegramId(telegramId: number): Promise<ApiResponse<IUser>> {
    return this.request<ApiResponse<IUser>>(`/users/telegram/${telegramId}`);
  }

  async updateUser(
    id: string,
    data: UpdateUserRequest
  ): Promise<ApiResponse<IUser>> {
    return this.request<ApiResponse<IUser>>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async sendMessageToUser(
    userId: string,
    data: SendMessageRequest
  ): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/users/${userId}/send-message`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ==================== PRODUCTS ====================

  async getProducts(
    params?: GetProductsParams
  ): Promise<PaginatedResponse<IProduct> | ApiResponse<IProduct[]>> {
    const queryString = params ? this.buildQueryString(params) : "";
    return this.request<PaginatedResponse<IProduct> | ApiResponse<IProduct[]>>(
      `/products${queryString}`
    );
  }

  async createProduct(
    data: CreateProductRequest
  ): Promise<ApiResponse<IProduct>> {
    return this.request<ApiResponse<IProduct>>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getProduct(id: string): Promise<ApiResponse<IProduct>> {
    return this.request<ApiResponse<IProduct>>(`/products/${id}`);
  }

  async updateProduct(
    id: string,
    data: UpdateProductRequest
  ): Promise<ApiResponse<IProduct>> {
    return this.request<ApiResponse<IProduct>>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/products/${id}`, {
      method: "DELETE",
    });
  }

  // ==================== ORDERS ====================

  async getOrders(
    params?: GetOrdersParams
  ): Promise<{ orders: IOrder[]; total: number } | ApiResponse<IOrder[]> | PaginatedResponse<IOrder>> {
    const queryString = params ? this.buildQueryString(params) : "";
    return this.request<{ orders: IOrder[]; total: number } | ApiResponse<IOrder[]> | PaginatedResponse<IOrder>>(
      `/orders${queryString}`
    );
  }

  async createOrder(data: CreateOrderRequest): Promise<ApiResponse<IOrder>> {
    return this.request<ApiResponse<IOrder>>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getOrder(id: string): Promise<ApiResponse<IOrder>> {
    return this.request<ApiResponse<IOrder>>(`/orders/${id}`);
  }

  async getOrdersByUser(
    userId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<IOrder>> {
    const queryString = params ? this.buildQueryString(params) : "";
    return this.request<PaginatedResponse<IOrder>>(
      `/orders/user/${userId}${queryString}`
    );
  }

  async updateOrderStatus(
    id: string,
    data: UpdateOrderStatusRequest
  ): Promise<ApiResponse<IOrder>> {
    return this.request<ApiResponse<IOrder>>(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async fulfillOrder(
    id: string,
    data: FulfillOrderRequest
  ): Promise<ApiResponse<IOrder>> {
    return this.request<ApiResponse<IOrder>>(`/orders/${id}/fulfill`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async syncOrderStatuses(): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>("/orders/sync-statuses", {
      method: "POST",
    });
  }

  async getSalesStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<any>> {
    const queryString = params ? this.buildQueryString(params) : "";
    return this.request<ApiResponse<any>>(`/orders/stats/sales${queryString}`);
  }

  // ==================== PAYMENTS ====================

  async getPayments(
    params?: GetPaymentsParams
  ): Promise<{ transactions: IPaymentTransaction[]; total: number }> {
    const queryString = params ? this.buildQueryString(params) : "";
    return this.request<{
      transactions: IPaymentTransaction[];
      total: number;
    }>(`/payments${queryString}`);
  }

  // ==================== CATEGORIES ====================

  async getCategories(): Promise<ApiResponse<ICategory[]>> {
    return this.request<ApiResponse<ICategory[]>>("/categories");
  }

  async createCategory(
    data: CreateCategoryRequest
  ): Promise<ApiResponse<ICategory>> {
    return this.request<ApiResponse<ICategory>>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getCategory(id: string): Promise<ApiResponse<ICategory>> {
    return this.request<ApiResponse<ICategory>>(`/categories/${id}`);
  }

  async updateCategory(
    id: string,
    data: UpdateCategoryRequest
  ): Promise<ApiResponse<ICategory>> {
    return this.request<ApiResponse<ICategory>>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/categories/${id}`, {
      method: "DELETE",
    });
  }

  // ==================== NOTIFICATIONS ====================

  async getNotifications(
    params?: GetNotificationsParams
  ): Promise<ApiResponse<INotification[]>> {
    const queryString = params ? this.buildQueryString(params) : "";
    return this.request<ApiResponse<INotification[]>>(
      `/notifications${queryString}`
    );
  }

  async createBulkNotification(
    data: CreateBulkNotificationRequest
  ): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>("/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getNotification(id: string): Promise<ApiResponse<INotification>> {
    return this.request<ApiResponse<INotification>>(`/notifications/${id}`);
  }

  async deleteNotification(id: string): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/notifications/${id}`, {
      method: "DELETE",
    });
  }
}

export default ApiClient;
