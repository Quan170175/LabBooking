const API_BASE_URL = "http://192.168.1.3:7089";

export const registerPushTokenOnServer = async (
  pushToken: string,
  authToken: string
): Promise<void> => {
  console.log("Đang gửi token lên server...");
  try {
    const response = await fetch(`${API_BASE_URL}/api/userdevices/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        pushToken: pushToken, // DTO: RegisterPushTokenRequest
      }),
    });

    if (response.ok) {
      console.log("Đã đăng ký Push Token lên server thành công!");
    } else {
      const errorData = await response.json();
      console.error("Lỗi khi đăng ký Push Token:", errorData);
    }
  } catch (error) {
    console.error("Exception khi gọi API đăng ký token:", error);
  }
};

export const triggerTestNotification = async (
  authToken: string
): Promise<void> => {
  console.log("Đang yêu cầu server gửi thông báo test...");
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/send-to-me`, {
      // URL test
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const message = await response.text();
      console.log("Server phản hồi (đã gửi):", message);
    } else {
      const errorData = await response.json();
      console.error("Lỗi khi gọi API test:", errorData);
    }
  } catch (error) {
    console.error("Exception khi gọi API test:", error);
  }
};
