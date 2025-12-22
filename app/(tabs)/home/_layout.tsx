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
        name="resources"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="door-request"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="send-email"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="change-request-history"
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
        name="(manager)/view-equipment"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="(manager)/my-lab"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="(manager)/appovals-history"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="(manager)/manage-door-requests"
        options={{ header: () => <AppHeader /> }}
      />

      {/* <Stack.Screen
        name="(security)/door-requests"
        options={{ header: () => <AppHeader /> }}
      /> */}
      <Stack.Screen
        name="(security)/incident-history"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="(security)/create-incident"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="(security)/scanner"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="(security)/today-schedule"
        options={{ header: () => <AppHeader /> }}
      />
      <Stack.Screen
        name="(security)/today-schedule-history"
        options={{ header: () => <AppHeader /> }}
      />

      {/* 👇 ĐÃ THÊM: Cấu hình Chat dạng Modal */}
      <Stack.Screen
        name="chat"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
