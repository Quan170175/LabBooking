import { Stack } from "expo-router";
import React from "react";

export default function ProfileStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="details" options={{ headerShown: false }} />

      {/* Bạn có thể thêm các màn hình con khác của mục profile ở đây, ví dụ:
        <Stack.Screen name="terms" options={{ title: "Điều khoản Dịch vụ" }} />
        <Stack.Screen name="privacy" options={{ title: "Chính sách Bảo mật" }} />
      */}
    </Stack>
  );
}
