/**
 * LƯU Ý QUAN TRỌNG:
 * URL này là IP nội bộ (local). Nó CHỈ hoạt động khi:
 * 1. Điện thoại của bạn đang kết nối CÙNG MẠNG WIFI với máy tính chạy backend.
 * 2. Backend của bạn đang chạy và "listen" trên địa chỉ 0.0.0.0 hoặc 192.168.1.3.
 *
 * Khi deploy app (lên store), bạn PHẢI thay thế URL này bằng địa chỉ public API
 * của backend (ví dụ: https://api.tenmienban.com).
 *
 * Cách chuẩn nhất là sử dụng Biến môi trường (Environment Variables)
 * Ví dụ: process.env.EXPO_PUBLIC_API_URL
 */
const API_BASE_URL = "http://192.168.1.3:7089";

/**
 * Gửi Expo Push Token của thiết bị lên server để đăng ký.
 * Server sẽ lưu token này vào CSDL, liên kết với user đã xác thực.
 *
 * @param pushToken - Chuỗi ExpoPushToken (ví dụ: "ExponentPushToken[...]")
 * @param authToken - Chuỗi JWT token để xác thực người dùng (Bearer token).
 */
export const registerPushTokenOnServer = async (
  pushToken: string,
  authToken: string
): Promise<void> => {
  console.log("Đang gửi token lên server...");
  try {
    // DTO (Data Transfer Object) cho body
    const body = JSON.stringify({
      pushToken: pushToken,
    });

    const response = await fetch(`${API_BASE_URL}/api/userdevices/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Xác thực bằng Bearer token
        Authorization: `Bearer ${authToken}`,
      },
      body: body,
    });

    if (response.ok) {
      console.log("Đã đăng ký Push Token lên server thành công!");
    } else {
      // Nếu server trả về lỗi (4xx, 5xx), log chi tiết
      const errorData = await response.json();
      console.error(
        `Lỗi khi đăng ký Push Token. Status: ${response.status}`,
        errorData
      );
    }
  } catch (error) {
    // Lỗi này xảy ra khi không thể kết nối (lỗi mạng, server sập,...)
    console.error("Exception khi gọi API đăng ký token:", error);
  }
};

/**
 * Gọi API test trên backend, yêu cầu backend gửi một thông báo
 * về chính thiết bị này (thông qua user đã xác thực).
 *
 * @param authToken - Chuỗi JWT token để xác thực người dùng (Bearer token).
 */
export const triggerTestNotification = async (
  authToken: string
): Promise<void> => {
  console.log("Đang yêu cầu server gửi thông báo test...");
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/notifications/send-to-me`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (response.ok) {
      const message = await response.text();
      console.log("Server phản hồi (đã gửi):", message);
    } else {
      const errorData = await response.json();
      console.error(
        `Lỗi khi gọi API test. Status: ${response.status}`,
        errorData
      );
    }
  } catch (error) {
    console.error("Exception khi gọi API test:", error);
  }
};
