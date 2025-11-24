// utils/api.ts
import axios, { AxiosError } from "axios";
// *** 1. XÓA DÒNG "import { router } from "expo-router";" Ở ĐÂY ***
import * as SecureStore from "expo-secure-store";

// URL Backend của bạn
const BACKEND_URL = "https://developerops.xyz";

// Tạo một 'instance' của axios (Giữ nguyên)
const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor (Giữ nguyên)
apiClient.interceptors.request.use(
  async (config) => {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Hàng đợi (Giữ nguyên)
let isRefreshing = false;
let failedQueue: {
  resolve: (value: string) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

// Response Interceptor (Đây là nơi sửa)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // (Phần này giữ nguyên)
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("AccessToken hết hạn. Đang lấy refreshToken...");
        const refreshToken = await SecureStore.getItemAsync("refreshToken");

        if (!refreshToken) {
          console.log("Không tìm thấy refreshToken, đang đăng xuất.");
          await SecureStore.deleteItemAsync("accessToken");
          await SecureStore.deleteItemAsync("refreshToken");

          const { router } = require("expo-router");
          router.replace("/login");

          return Promise.reject(error);
        }

        console.log("Đang gọi API /api/auth/refresh-token...");

        const refreshResponse = await axios.post(
          `${BACKEND_URL}/api/auth/refresh-token`,
          {
            refreshToken: refreshToken,
          }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          refreshResponse.data;

        console.log("Đã nhận được token mới. Đang lưu...");
        await SecureStore.setItemAsync("accessToken", newAccessToken);
        await SecureStore.setItemAsync("refreshToken", newRefreshToken);

        apiClient.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;

        console.log("Đã refresh token, thực hiện lại request gốc.");
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        console.error(
          "Lỗi nghiêm trọng khi refresh token:",
          refreshError.message
        );
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");

        const { router } = require("expo-router");
        router.replace("/login");

        isRefreshing = false;
        processQueue(refreshError, null);

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
