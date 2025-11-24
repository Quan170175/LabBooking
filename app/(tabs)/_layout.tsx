import { Tabs } from "expo-router";
import { Bell, Home, Menu, UserRound } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";

// KHÔNG import AppHeader ở đây
// KHÔNG dùng <View> bọc ngoài

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        // Ẩn header mặc định của Tabs
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#ea580c",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? 16 : 12,
          left: 16,
          right: 16,
          borderRadius: 28,
          height: 62,
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "#ffedd5",
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="home"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Thông báo",
          tabBarIcon: ({ color }) => <Bell size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ color }) => <UserRound size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
