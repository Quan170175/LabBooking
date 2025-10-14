// app/_layout.tsx
import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  return (
    <Stack>
      {/* Màn hình đầu tiên là Login, không có header */}
      <Stack.Screen name="login" options={{ headerShown: false }} />

      {/* Màn hình thứ hai là cả cụm Tabs, cũng không có header 
          vì nó đã có AppHeader riêng bên trong */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
