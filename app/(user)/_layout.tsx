import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* headerShown: false sẽ tắt header cho tất cả màn hình con */}
      <Stack.Screen name="login" />
      <Stack.Screen name="security-login" />
    </Stack>
  );
}
