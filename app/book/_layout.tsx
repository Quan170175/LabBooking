import { Stack } from "expo-router";
import React from "react";

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={
        {
          headerStyle: {
            backgroundColor: "#fff7ed",
          },
          headerTintColor: "#0f172a",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerShadowVisible: false,
          headerBackTitle: "Quay lại",
        } as any
      }
    >
      <Stack.Screen
        name="choose-type"
        options={{
          presentation: "transparentModal",
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="rooms"
        options={{
          title: "Chọn phòng Lab",
        }}
      />
      <Stack.Screen
        name="slots"
        options={{
          title: "Chọn giờ học",
        }}
      />
      <Stack.Screen
        name="devices"
        options={{
          title: "Chọn thiết bị",
        }}
      />
    </Stack>
  );
}
