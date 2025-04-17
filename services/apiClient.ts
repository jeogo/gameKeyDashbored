import { 
  IUser, 
  IProduct, 
  ICategory, 
  IOrder, 
  IPaymentTransaction, 
  INotification,
  IPaginatedResponse,
  IQueryParams,
  ApiError
} from '../types/interfaces';

/**
 * API Client for backend interactions
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://gamekey.onrender.com') {
    this.baseUrl = baseUrl;
  }

  /**
   * Helper method for API requests
   */
  private async request<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    data?: any,
    queryParams?: IQueryParams
  ): Promise<T> {
    // Build URL with query parameters
    let url = `${this.baseUrl}${endpoint}`;
    if (queryParams && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      url = `${url}?${params.toString()}`;
    }

    // Set up headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      method,
      headers,
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      console.log(`Fetching from: ${url}`);
      const response = await fetch(url, config);
      
      // Improve error handling with more specific messages
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `API error: ${response.status}`;
        console.error(`API error: ${response.status} - ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return {} as T;
    } catch (error) {
      console.error("Request failed:", error);
      // Provide more details in the error message
      if (error instanceof Error) {
        throw new Error(`${error.message} (URL: ${url})`);
      }
      throw new Error(`Unknown error occurred while fetching ${url}`);
    }
  }

  // User endpoints
  async getUsers(params?: IQueryParams): Promise<IPaginatedResponse<IUser>> {
    return this.request<IPaginatedResponse<IUser>>('/api/users', 'GET', undefined, params);
  }

  async getUserById(id: string): Promise<IUser> {
    return this.request<IUser>(`/api/users/${id}`);
  }

  async createUser(userData: Omit<IUser, '_id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    return this.request<IUser>('/api/users', 'POST', userData);
  }

  async updateUser(id: string, userData: Partial<IUser>): Promise<IUser> {
    return this.request<IUser>(`/api/users/${id}`, 'PUT', userData);
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/api/users/${id}`, 'DELETE');
  }

  // Product endpoints
  async getProducts(params?: IQueryParams): Promise<IPaginatedResponse<IProduct>> {
    return this.request<IPaginatedResponse<IProduct>>('/api/products', 'GET', undefined, params);
  }

  async getProductById(id: string): Promise<IProduct> {
    return this.request<IProduct>(`/api/products/${id}`);
  }

  async createProduct(product: Omit<IProduct, '_id' | 'createdAt' | 'updatedAt'>): Promise<IProduct> {
    return this.request<IProduct>('/api/products', 'POST', product);
  }

  async updateProduct(id: string, productData: Partial<IProduct>): Promise<IProduct> {
    return this.request<IProduct>(`/api/products/${id}`, 'PUT', productData);
  }

  async deleteProduct(id: string): Promise<void> {
    return this.request<void>(`/api/products/${id}`, 'DELETE');
  }

  // Category endpoints
  async getCategories(): Promise<ICategory[]> {
    return this.request<ICategory[]>('/api/categories');
  }

  async getCategoryById(id: string): Promise<ICategory> {
    return this.request<ICategory>(`/api/categories/${id}`);
  }

  async createCategory(category: Omit<ICategory, '_id' | 'createdAt' | 'updatedAt'>): Promise<ICategory> {
    return this.request<ICategory>('/api/categories', 'POST', category);
  }

  async updateCategory(id: string, categoryData: Partial<ICategory>): Promise<ICategory> {
    return this.request<ICategory>(`/api/categories/${id}`, 'PUT', categoryData);
  }

  async deleteCategory(id: string): Promise<void> {
    return this.request<void>(`/api/categories/${id}`, 'DELETE');
  }

  // Order endpoints
  async getOrders(): Promise<{orders: IOrder[], total: number} | IOrder[]> {
    return this.request<{orders: IOrder[], total: number} | IOrder[]>('/api/orders');
  }

  async getOrderById(id: string): Promise<IOrder> {
    return this.request<IOrder>(`/api/orders/${id}`);
  }

  async updateOrderStatus(
    id: string, 
    status: 'pending' | 'completed' | 'cancelled',
    note?: string
  ): Promise<IOrder> {
    return this.request<IOrder>(`/api/orders/${id}/status`, 'PUT', { status, note });
  }

  async fulfillPreorder(
    orderId: string, 
    data: {
      digitalContent: string,
      note?: string
    }
  ): Promise<IOrder> {
    return this.request<IOrder>(`/api/orders/${orderId}/fulfill`, 'POST', data);
  }

  // Payment endpoints
  async getPayments(): Promise<{transactions: IPaymentTransaction[], total: number}> {
    return this.request<{transactions: IPaymentTransaction[], total: number}>('/api/payments');
  }

  async getPaymentById(id: string): Promise<IPaymentTransaction> {
    return this.request<IPaymentTransaction>(`/api/payments/${id}`);
  }

  async updatePaymentStatus(
    id: string, 
    status: 'pending' | 'completed' | 'failed' | 'cancelled'
  ): Promise<IPaymentTransaction> {
    return this.request<IPaymentTransaction>(`/api/payments/${id}/status`, 'PUT', { status });
  }

  // User messaging endpoints
  async sendMessageToUser(
    telegramId: string,
    data: { message: string }
  ): Promise<{ success: boolean; messageId?: string }> {
    return this.request<{ success: boolean; messageId?: string }>(
      `/api/users/${telegramId}/send-message`, 
      'POST', 
      data
    );
  }

  // Notification endpoints
  async getNotifications(params?: IQueryParams): Promise<IPaginatedResponse<INotification>> {
    return this.request<IPaginatedResponse<INotification>>('/api/notifications', 'GET', undefined, params);
  }

  async createNotification(notification: Omit<INotification, '_id' | 'createdAt'>): Promise<INotification> {
    return this.request<INotification>('/api/notifications', 'POST', notification);
  }

  async updateNotification(id: string, data: Partial<INotification>): Promise<INotification> {
    return this.request<INotification>(`/api/notifications/${id}`, 'PUT', data);
  }

  async deleteNotification(id: string): Promise<void> {
    return this.request<void>(`/api/notifications/${id}`, 'DELETE');
  }

  // Analytics endpoints
  async getAnalyticsSummary(dateRange?: { startDate: string, endDate: string }): Promise<any> {
    return this.request<any>('/api/analytics/summary', 'GET', undefined, dateRange);
  }

  async getRevenueData(dateRange?: { startDate: string, endDate: string }): Promise<any> {
    return this.request<any>('/api/analytics/revenue', 'GET', undefined, dateRange);
  }

  async getUserAnalytics(dateRange?: { startDate: string, endDate: string }): Promise<any> {
    return this.request<any>('/api/analytics/users', 'GET', undefined, dateRange);
  }
}

export default ApiClient;
