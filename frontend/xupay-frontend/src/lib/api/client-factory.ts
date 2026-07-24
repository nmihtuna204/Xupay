import axios, { type InternalAxiosRequestConfig } from "axios";
import { getToken, clearSession } from "@/lib/session";
import { toApiError } from "./errors";

/**
 * One factory shared by both backend services (user-service, payment-service):
 * same auth-header attach, same 401 handling, same error normalization.
 */
export function createApiClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    timeout: 30_000,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const apiError = toApiError(error);
      if (apiError.isAuthError) {
        clearSession();
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
      }
      return Promise.reject(apiError);
    }
  );

  return client;
}

export const userServiceClient = createApiClient(
  process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:8081"
);

export const paymentServiceClient = createApiClient(
  process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || "http://localhost:8082"
);
