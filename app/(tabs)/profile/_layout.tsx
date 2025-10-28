// app/(tabs)/profile/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
import AppHeader from "../../../components/common/AppHeader";

export default function ProfileStackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index" // Trỏ đến app/(tabs)/profile/index.tsx
        options={{ header: () => <AppHeader /> }}
      />
      {/* Thêm các màn hình con của profile (nếu có) vào đây */}
    </Stack>
  );
}
