import { Tabs } from "expo-router";
import { Bell, Home, Menu, UserRound } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import AppHeader from "../../components/AppHeader";

export default function Layout() {
  return (
    <View style={styles.container}>
      <AppHeader />

      <Tabs
        screenOptions={{
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
        <Tabs.Screen
          name="index"
          options={{
            title: "Trang chủ",
            tabBarIcon: ({ color }) => <Home size={20} color={color} />,
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
        <Tabs.Screen
          name="functions"
          options={{
            title: "Chức năng",
            tabBarIcon: ({ color }) => <Menu size={20} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff7ed", // tương đương bg-orange-50
  },
});
