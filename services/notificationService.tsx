import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

/**
 * Cấu hình cách thông báo hiển thị khi app đang ở trạng thái "foreground" (đang mở).
 * Đây là cài đặt bắt buộc phải có.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    /**
     * Hiển thị một pop-up/alert trên màn hình.
     * Bạn nên đặt là `true` để người dùng thấy thông báo ngay.
     */
    shouldShowAlert: true,
    /**
     * Phát âm thanh (nếu thông báo có âm thanh).
     */
    shouldPlaySound: true,
    /**
     * (iOS) Hiển thị số (badge) trên icon app.
     * Thường đặt là `false` và tự quản lý số badge ở logic riêng.
     */
    shouldSetBadge: false,
    /**
     * (Android) Hiển thị banner (thông báo "heads-up") từ cạnh trên màn hình.
     * Nên đặt là `true` để giống với iOS (shouldShowAlert).
     */
    shouldShowBanner: true,
    /**
     * (Android) Hiển thị thông báo trong khay thông báo.
     * Luôn nên đặt là `true`.
     */
    shouldShowList: true,
  }),
});

/**
 * Hàm đăng ký nhận thông báo đẩy.
 * Sẽ thực hiện các bước:
 * 1. Kiểm tra có phải thiết bị thật không.
 * 2. Hỏi quyền nhận thông báo từ người dùng.
 * 3. Lấy ExpoPushToken.
 * 4. Cấu hình Kênh (Channel) cho Android.
 *
 * @returns {Promise<string | null>} Trả về chuỗi ExpoPushToken nếu thành công,
 * hoặc `null` nếu thất bại (không phải thiết bị thật, người dùng từ chối, lỗi).
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  // 1. Chỉ hoạt động trên thiết bị thật, không hoạt động trên Simulator/Emulator
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device.");
    return null;
  }

  // 2. Hỏi quyền
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Nếu chưa cấp quyền, hỏi lại
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // Nếu người dùng từ chối, dừng lại
  if (finalStatus !== "granted") {
    alert("Bạn đã từ chối quyền nhận thông báo!");
    return null;
  }

  // 3. Lấy ExpoPushToken
  let token: string | undefined;
  try {
    // Cần có `projectId` từ file app.json (sau khi chạy 'npx eas project:init')
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      throw new Error(
        'Không tìm thấy Project ID. Hãy chạy "npx eas project:init"'
      );
    }

    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log("Lấy được Expo Push Token:", token);
  } catch (e) {
    console.error("Không thể lấy push token", e);
    return null;
  }

  // 4. (Bắt buộc cho Android) Cấu hình Notification Channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token ?? null;
}

/**
 * (Custom Hook) Tự động đăng ký và hủy đăng ký các "tai nghe" sự kiện thông báo.
 *
 * Nên được gọi 1 lần duy nhất ở file layout gốc của app (ví dụ: _layout.tsx)
 * để đảm bảo các listener luôn chạy.
 */
export const useNotificationObservers = () => {
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // --- Listener 1: Chạy khi APP ĐANG MỞ (foreground) và nhận được thông báo ---
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("ĐÃ NHẬN THÔNG BÁO KHI MỞ APP:", notification);
        // TODO: Có thể dùng để cập nhật badge, hoặc refresh lại danh sách thông báo
      });

    // --- Listener 2: Chạy khi NGƯỜI DÙNG NHẤN (TAP) vào thông báo ---
    // (Hoạt động cả khi app đang mở, chạy nền, hoặc đã tắt)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("NGƯỜI DÙNG NHẤN VÀO THÔNG BÁO:", response);

        // Lấy `data` được đính kèm từ backend
        const data = response.notification.request.content.data;

        // Ví dụ: Backend gửi data: { "bookingId": 123, "screen": "BookingDetail" }
        if (data && data.bookingId) {
          console.log(
            `Sẵn sàng điều hướng đến màn hình BookingDetail với ID: ${data.bookingId}`
          );
          // TODO: Thực hiện logic điều hướng (navigation) tại đây.
          // Ví dụ: router.push(`/booking/${data.bookingId}`);
        }
      });

    // Hàm dọn dẹp (cleanup): Hủy đăng ký listener khi component bị unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []); // Mảng rỗng [] đảm bảo useEffect này chỉ chạy 1 lần
};
