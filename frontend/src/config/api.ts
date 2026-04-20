// API Configuration
// This file centralizes all API-related configuration

// Get the API base URL from environment variables
export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// WebSocket URL configuration
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || "/notifications";

// Helper function to create full API URLs
export const createApiUrl = (endpoint: string): string => {
  // Ensure endpoint starts with / for proper concatenation
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalizedEndpoint}`;
};

// Helper function to create WebSocket URLs
export const createWebSocketUrl = (): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  // For development with full URL
  if (import.meta.env.VITE_WS_URL?.includes('://')) {
    return import.meta.env.VITE_WS_URL;
  }
  
  // For production with relative path
  const wsPath = WS_BASE_URL;
  return `${protocol}//${window.location.host}${wsPath}`;
};

// Default headers for API requests
export const getApiHeaders = (options?: { json?: boolean }): HeadersInit => {
  const token = localStorage.getItem('token');
  const useJson = options?.json !== false;

  return {
    ...(useJson && { 'Content-Type': 'application/json' }),
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function for making authenticated API requests
export const apiRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const url = createApiUrl(endpoint);
  const headers = {
    ...getApiHeaders(),
    ...options.headers
  };
  
  return fetch(url, {
    ...options,
    headers
  });
};

export default {
  API_BASE_URL,
  createApiUrl,
  getApiHeaders,
  apiRequest
};