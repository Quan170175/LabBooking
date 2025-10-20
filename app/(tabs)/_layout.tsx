import { Href, Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { BottomNav } from '@/components/common';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    const currentRoute = segments[segments.length - 1] || '';
    setActiveTab(currentRoute);
  }, [segments]);

  const handleTabPress = (route: string) => {
    setActiveTab(route);
    if (route === '') {
      router.push('/(tabs)/' as Href);
    } else {
      router.push(`/(tabs)/${route}` as Href);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: { display: 'none' }, // Hide default tab bar
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Trang chủ',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Thông báo',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="bell.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Cá nhân',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Chức năng',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
          }}
        />
      </Tabs>
      <BottomNav 
        activeTab={activeTab} 
        onTabPress={handleTabPress} 
      />
    </View>
  );
}
