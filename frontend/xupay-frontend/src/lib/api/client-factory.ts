import axios from "axios";
import { clearSession } from "@/lib/session";
import { toApiError } from "./errors";

/**
 * One factory shared by both backend services (user-service, payment-service):
 * same credentials, same 401 handling, same error normalization.
 *
 * Auth is the HttpOnly `xupay_token` cookie user-service sets on sign-in;
 * there is no token in JS to attach. `withCredentials` makes the browser
 * store that cookie from the sign-in response and send it to both services.
 * `X-Requested-With` is what the services require before honouring the
 * cookie on a state-changing request: a page on another origin can't add it
 * without a CORS preflight, which the services refuse.
 */
export function createApiClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    timeout: 30_000,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
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
