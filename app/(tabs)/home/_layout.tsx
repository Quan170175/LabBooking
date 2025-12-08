// app/(tabs)/home/_layout.tsx

import { Stack } from "expo-router";
import React from "react";
import { useNotificationObservers } from "@/services/notificationService";
import AppHeader from "../../../components/common/AppHeader";

export default function HomeStackLayout() {
  useNotificationObservers();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ header: () => <AppHeader /> }} />
      <Stack.Screen name="history" options={{ header: () => <AppHeader /> }} />
      <Stack.Screen
        name="availability"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen name="support" options={{ header: () => <AppHeader /> }} />
      <Stack.Screen
        name="timetable"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="resources"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="doorrequest"
        options={{ header: () => <AppHeader /> }}
      />

      <Stack.Screen
        name="(manager)/approvals"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="(manager)/security-incidents"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="(manager)/create-equipment-maintenance"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="(manager)/create-room-maintenance"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="(manager)/maintenancehistory"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="(manager)/viewequipment"
        options={{ header: () => <AppHeader /> }}
      />

      <Stack.Screen
        name="(security)/door-requests"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="(security)/incident-history"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="(security)/create-incident"
        options={{ header: () => <AppHeader /> }}
      />
    </Stack>
  );
}
