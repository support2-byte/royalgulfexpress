import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import * as SecureStore from "expo-secure-store";

export const TOKEN_KEY = "auth_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

type QueueCallback = (error?: AxiosError | null, token?: string) => void;
type AuthFailureCallback = () => void;

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshQueue: QueueCallback[] = [];
let onAuthFailure: AuthFailureCallback | null = null;

export const setOnAuthFailure = (cb: AuthFailureCallback): void => {
  onAuthFailure = cb;
};

const resolveQueue = (
  error: AxiosError | null = null,
  token?: string,
): void => {
  refreshQueue.forEach((callback) => {
    callback(error, token);
  });

  refreshQueue = [];
};

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const original = error.config as RetryableRequestConfig | undefined;

    if (!original) {
      return Promise.reject(error);
    }

    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.url === "/auth/refresh" ||
      original.url === "/auth/login" ||
      original.url === "/auth/signup" ||
      original.url === "/auth/sendOTP" ||
      original.url === "/auth/verifyOTP"
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((refreshError, token) => {
          if (refreshError) {
            reject(refreshError);
            return;
          }

          if (token) {
            original.headers.Authorization = `Bearer ${token}`;
          }

          resolve(api(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const storedRefreshToken =
        await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const response = await api.post("/auth/refresh", {
        refreshToken: storedRefreshToken,
      });

      const newToken = response.data?.data?.token ?? response.data?.token;

      if (!newToken) {
        throw new Error("Refresh token was not returned.");
      }

      await SecureStore.setItemAsync(TOKEN_KEY, newToken);

      resolveQueue(null, newToken);

      original.headers.Authorization = `Bearer ${newToken}`;

      return api(original);
    } catch (refreshError) {
      const typedRefreshError = refreshError as AxiosError;
      console.log("[Refresh] failed:", {
        message: typedRefreshError.message,
        status: typedRefreshError.response?.status,
        data: typedRefreshError.response?.data,
        code: typedRefreshError.code,
      });
      resolveQueue(typedRefreshError);

      await SecureStore.deleteItemAsync(TOKEN_KEY);

      onAuthFailure?.();

      return Promise.reject(typedRefreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
