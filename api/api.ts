// utils/api.ts
import axios, { AxiosError } from "axios";
import { router } from "expo-router"; // Dùng để điều hướng khi hết hạn refresh
import * as SecureStore from "expo-secure-store";

// URL Backend của bạn
const BACKEND_URL = "https://developerops.xyz";

// 1. Tạo một 'instance' của axios
const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Cấu hình Request Interceptor (Gửi AccessToken tự động)
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

// Biến cờ và hàng đợi để xử lý nhiều request cùng lúc khi token hết hạn
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

// 3. Cấu hình Response Interceptor (Xử lý lỗi 401 và Refresh Token)
apiClient.interceptors.response.use(
  (response) => {
    // Nếu request thành công, trả về response
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any; // Thêm 'any' để truy cập _retry

    // Chỉ xử lý lỗi 401 (Unauthorized) và request đó CHƯA được thử lại
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang refresh, đẩy request vào hàng đợi
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

      originalRequest._retry = true; // Đánh dấu là đã thử lại
      isRefreshing = true;

      try {
        console.log("AccessToken hết hạn. Đang lấy refreshToken...");
        const refreshToken = await SecureStore.getItemAsync("refreshToken");

        if (!refreshToken) {
          console.log("Không tìm thấy refreshToken, đang đăng xuất.");
          // Xóa mọi token cũ
          await SecureStore.deleteItemAsync("accessToken");
          await SecureStore.deleteItemAsync("refreshToken");
          // Điều hướng về màn hình Login (dựa theo cấu trúc file của bạn)
          router.replace("/login");
          return Promise.reject(error);
        }

        console.log("Đang gọi API /api/GoogleLoign/refresh-token...");

        // 4. Tự động gọi API refresh token
        const refreshResponse = await axios.post(
          `${BACKEND_URL}/api/GoogleLoign/refresh-token`,
          {
            refreshToken: refreshToken,
          }
        );

        // *** ĐÃ BỎ refreshTokenExpiry ***
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          refreshResponse.data;

        // 5. Lưu token MỚI vào SecureStore
        console.log("Đã nhận được token mới. Đang lưu...");
        await SecureStore.setItemAsync("accessToken", newAccessToken);
        await SecureStore.setItemAsync("refreshToken", newRefreshToken);
        // *** ĐÃ BỎ refreshTokenExpiry ***

        // 6. Cập nhật header default của apiClient
        apiClient.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;

        // 7. Xử lý hàng đợi và thực hiện lại request gốc
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
        // Xóa mọi token cũ
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        // *** ĐÃ BỎ refreshTokenExpiry ***

        // Đưa người dùng về màn hình login
        router.replace("/login"); // Cập nhật đường dẫn login của bạn

        isRefreshing = false;
        processQueue(refreshError, null);

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
