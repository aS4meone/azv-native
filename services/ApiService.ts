import axios, { AxiosResponse } from "axios";
import { AppConstants } from "../constants/AppConstants";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiService {
  private static instance: ApiService;
  private axiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: AppConstants.apiBaseUrl,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    // Add request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(
          `🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        console.error("🔴 API Request Error:", error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(
          `✅ API Response: ${response.status} ${response.config.url}`
        );
        return response;
      },
      (error) => {
        console.error(
          "🔴 API Response Error:",
          error.response?.status,
          error.response?.data
        );
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Save FCM token to backend with access token
   */
  public async saveTokenToBackend(
    fcmToken: string,
    accessToken: string
  ): Promise<boolean> {
    try {
      console.log("Sending FCM token to backend:", fcmToken);
      console.log("Using access token:", accessToken.substring(0, 10) + "...");

      const response: AxiosResponse = await this.axiosInstance.post(
        AppConstants.saveTokenEndpoint,
        { fcm_token: fcmToken },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        console.log("FCM token successfully sent to backend");
        return true;
      } else {
        console.log("Failed to send FCM token. Status:", response.status);
        console.log("Response body:", response.data);
        return false;
      }
    } catch (error: any) {
      console.error("Error sending FCM token to backend:", error);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      return false;
    }
  }

  /**
   * Generic method for making authenticated API requests
   */
  public async makeAuthenticatedRequest<T = any>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    accessToken: string,
    body?: any
  ): Promise<ApiResponse<T>> {
    try {
      const config = {
        method: method.toLowerCase(),
        url: endpoint,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: body,
      };

      const response: AxiosResponse<T> = await this.axiosInstance(config);

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error(
        `Error making authenticated request to ${endpoint}:`,
        error
      );
      return {
        success: false,
        error:
          error.response?.data?.message || error.message || "Unknown error",
      };
    }
  }

  /**
   * Get request with authentication
   */
  public async get<T = any>(
    endpoint: string,
    accessToken: string
  ): Promise<ApiResponse<T>> {
    return this.makeAuthenticatedRequest<T>(endpoint, "GET", accessToken);
  }

  /**
   * Post request with authentication
   */
  public async post<T = any>(
    endpoint: string,
    accessToken: string,
    body?: any
  ): Promise<ApiResponse<T>> {
    return this.makeAuthenticatedRequest<T>(
      endpoint,
      "POST",
      accessToken,
      body
    );
  }

  /**
   * Put request with authentication
   */
  public async put<T = any>(
    endpoint: string,
    accessToken: string,
    body?: any
  ): Promise<ApiResponse<T>> {
    return this.makeAuthenticatedRequest<T>(endpoint, "PUT", accessToken, body);
  }

  /**
   * Delete request with authentication
   */
  public async delete<T = any>(
    endpoint: string,
    accessToken: string
  ): Promise<ApiResponse<T>> {
    return this.makeAuthenticatedRequest<T>(endpoint, "DELETE", accessToken);
  }
}
