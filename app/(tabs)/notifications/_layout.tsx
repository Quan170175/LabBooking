// app/(tabs)/notifications/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
import AppHeader from "../../../components/common/AppHeader";

export default function NotificationsStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ header: () => <AppHeader /> }} />
    </Stack>
  );
}
