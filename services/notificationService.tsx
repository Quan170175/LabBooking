import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  let token: string | undefined; // Định nghĩa kiểu cho biến token

  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("Bạn đã từ chối quyền nhận thông báo!");
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      throw new Error(
        'Project ID not found in app.json/app.config.js. Please run "npx eas project:init"'
      );
    }

    // getExpoPushTokenAsync trả về một object, chúng ta lấy thuộc tính data
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log("Your Expo Push Token:", token);
  } catch (e) {
    console.error("Failed to get push token", e);
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  // Nếu token không lấy được, trả về null. Ngược lại, trả về token.
  return token ?? null;
}

export const useNotificationObservers = () => {
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // 1. Listener này chạy KHI APP ĐANG MỞ và nhận được thông báo
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("ĐÃ NHẬN THÔNG BÁO KHI MỞ APP:", notification);
        // Có thể dùng để cập nhật badge, hoặc refresh danh sách
      });

    // 2. Listener này chạy KHI NGƯỜI DÙNG NHẤN (TAP) vào thông báo
    // (Hoạt động cả khi app đang mở, chạy nền, hoặc đã tắt)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("NGƯỜI DÙNG NHẤN VÀO THÔNG BÁO:", response);

        const data = response.notification.request.content.data;
        if (data && data.bookingId) {
          console.log(
            `Sẵn sàng điều hướng đến màn hình BookingDetail với ID: ${data.bookingId}`
          );
          // Ví dụ:
          // if (navigation) {
          //   navigation.navigate('BookingDetail', { id: data.bookingId });
          // }
        }
      });

    // Hủy đăng ký listener khi component unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []); // Chạy 1 lần duy nhất
};
