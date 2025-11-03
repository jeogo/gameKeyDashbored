import ApiClient from "@/services/apiClient";

// Create a singleton instance of ApiClient
// Backend API runs on port 3001 (confirmed from backend configuration)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const api = new ApiClient(API_URL);

// Add global debug function
export const logApiOperation = (operation: string, result: any) => {
  console.log(`API ${operation}:`, result);
}

export default api;
