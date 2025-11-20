// app/(tabs)/home/_layout.tsx

import { Stack } from "expo-router";
import React from "react";
// Sửa đường dẫn import này cho đúng với vị trí AppHeader của bạn
import { useNotificationObservers } from "@/services/notificationService";
import AppHeader from "../../../components/common/AppHeader";

export default function HomeStackLayout() {
  useNotificationObservers();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          header: () => <AppHeader />,
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          header: () => <AppHeader />,
        }}
      />
      <Stack.Screen
        name="availability"
        options={{
          header: () => <AppHeader />,
        }}
      />
      <Stack.Screen
        name="support"
        options={{
          header: () => <AppHeader />,
        }}
      />
      <Stack.Screen
        name="timetable"
        options={{
          header: () => <AppHeader />,
        }}
      />
    </Stack>
  );
}
