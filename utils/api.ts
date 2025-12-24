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
    if (response.data && response.data.statusCode && "data" in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // --- 🟢 MỚI: NẾU LÀ API LOGIN THÌ KHÔNG XỬ LÝ 401/403 TỰ ĐỘNG ---
    // Điều này để Component Login tự bắt lỗi và hiện "Sai mật khẩu"
    if (originalRequest.url?.includes("/api/auth/login")) {
      return Promise.reject(error);
    }
    // -----------------------------------------------------------

    // 1. XỬ LÝ LỖI 403
    if (error.response?.status === 403) {
      console.log("⛔ Lỗi 403: Đang đăng xuất...");
      try {
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        const { router } = require("expo-router");
        router.replace("/login");
      } catch (logoutError) {
        console.error("Lỗi khi đăng xuất tự động:", logoutError);
      }
      return Promise.reject(error);
    }

    // 2. XỬ LÝ LỖI 401 (Token hết hạn)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu đang trong quá trình refresh rồi thì cho các request sau vào hàng đợi
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
        const refreshToken = await SecureStore.getItemAsync("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        // Gọi API refresh (Dùng axios instance mới hoặc axios gốc để tránh interceptor này)
        const refreshResponse = await axios.post(
          `${BACKEND_URL}/api/auth/refresh-token`,
          { refreshToken }
        );

        const responseData = refreshResponse.data.data || refreshResponse.data;
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          responseData;

        await SecureStore.setItemAsync("accessToken", newAccessToken);
        await SecureStore.setItemAsync("refreshToken", newRefreshToken);

        apiClient.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false; // Giải phóng trạng thái

        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        // Nếu refresh token cũng hỏng, xoá hết và bắt login lại
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");

        isRefreshing = false; // QUAN TRỌNG: Phải reset cái này nếu thất bại
        processQueue(refreshError, null);

        const { router } = require("expo-router");
        router.replace("/login");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
