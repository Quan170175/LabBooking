// app/(tabs)/home/_layout.tsx

import { Stack } from "expo-router";
import React from "react";
// Sửa đường dẫn import này cho đúng với vị trí AppHeader của bạn
import AppHeader from "../../../components/common/AppHeader";

export default function HomeStackLayout() {
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
    </Stack>
  );
}
