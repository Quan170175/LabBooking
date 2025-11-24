// app/(tabs)/profile/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
import AppHeader from "../../../components/common/AppHeader";

export default function ProfileStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ header: () => <AppHeader /> }} />
      <Stack.Screen name="details" options={{ header: () => <AppHeader /> }} />
    </Stack>
  );
}
