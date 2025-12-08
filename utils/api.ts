import axios, { AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";

// URL Backend của bạn
const BACKEND_URL = "https://developerops.xyz";

// Tạo một 'instance' của axios
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

// Hàng đợi cho Refresh Token (Giữ nguyên)
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

// Response Interceptor (ĐÃ CẬP NHẬT XỬ LÝ 403)
apiClient.interceptors.response.use(
  (response) => {
    // --- LOGIC BÓC VỎ DATA ---
    // Nếu response có dạng { statusCode, message, data }
    if (response.data && response.data.statusCode && "data" in response.data) {
      // Gán phần ruột 'data' đè lên response.data để FE cũ hiểu
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // 🟢 1. XỬ LÝ LỖI 403 (Forbidden / Sai quyền / Sai cơ sở)
    // Đây là đoạn code giúp bạn xóa Token khi bị lỗi như ảnh
    if (error.response?.status === 403) {
      console.log(
        "⛔ Lỗi 403: Tài khoản không có quyền truy cập. Đang đăng xuất..."
      );

      try {
        // Xóa token trong SecureStore
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");

        // Điều hướng về trang Login
        // Sử dụng require để tránh lỗi vòng lặp import (circular dependency)
        const { router } = require("expo-router");

        // Dùng replace để người dùng không bấm Back quay lại được trang lỗi
        router.replace("/login");
      } catch (logoutError) {
        console.error("Lỗi khi đăng xuất tự động:", logoutError);
      }

      return Promise.reject(error);
    }

    // 🟢 2. XỬ LÝ LỖI 401 (Token hết hạn - Auto Refresh)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
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

        // Gọi API refresh token (dùng axios gốc để tránh lặp interceptor)
        const refreshResponse = await axios.post(
          `${BACKEND_URL}/api/auth/refresh-token`,
          {
            refreshToken: refreshToken,
          }
        );

        // Kiểm tra cấu trúc data trả về (có bọc vỏ hay không)
        const responseData = refreshResponse.data.data || refreshResponse.data;

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          responseData;

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

    // Các lỗi khác trả về bình thường để component tự xử lý
    return Promise.reject(error);
  }
);

export default apiClient;
