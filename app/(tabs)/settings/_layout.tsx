// app/(tabs)/settings/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
import AppHeader from "../../../components/common/AppHeader";

export default function SettingsStackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index" // Trỏ đến app/(tabs)/settings/index.tsx
        options={{ header: () => <AppHeader /> }}
      />
    </Stack>
  );
}
