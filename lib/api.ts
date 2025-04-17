import ApiClient from "@/services/apiClient";

// Create a singleton instance of ApiClient
// Use consistent URL format with environment variable fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const api = new ApiClient(API_URL);

// Add global debug function
export const logApiOperation = (operation: string, result: any) => {
  console.log(`API ${operation}:`, result);
}

export default api;
