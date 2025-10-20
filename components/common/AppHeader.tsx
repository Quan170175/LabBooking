import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Sidebar } from './SideBar';

export interface AppHeaderProps {
  showMenu?: boolean;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
  isAuthenticated?: boolean;
  userName?: string;
  userEmail?: string;
  onLoginPress?: () => void;
  onRegisterPress?: () => void;
  onLogoutPress?: () => void;
  onProfilePress?: () => void;
}

export function AppHeader({
  showMenu = true,
  onMenuPress,
  onNotificationPress,
  isAuthenticated = false,
  userName,
  userEmail,
  onLoginPress,
  onRegisterPress,
  onLogoutPress,
  onProfilePress,
}: AppHeaderProps) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const router = useRouter();

  const handleMenuPress = () => {
    setSidebarVisible(true);
    onMenuPress?.();
  };

  const handleCloseSidebar = () => {
    setSidebarVisible(false);
  };

  const handleLoginPress = () => {
    setSidebarVisible(false);
    router.replace('/(auth)/login' as any);
    onLoginPress?.();
  };

  const handleRegisterPress = () => {
    setSidebarVisible(false);
    router.replace('/(auth)/register' as any);
    onRegisterPress?.();
  };

  const handleProfilePress = () => {
    setSidebarVisible(false);
    router.push('/profile');
    onProfilePress?.();
  };

  const handleLogoutPress = () => {
    setSidebarVisible(false);
    // Here you would typically handle logout logic
    onLogoutPress?.();
  };
  return (
    <View style={styles.header}>
      <View style={styles.leftSection} />

      <View style={styles.headerContent}>
        <ThemedText
          style={styles.headerTitle}
          lightColor="#FFFFFF"
          darkColor="#FFFFFF"
        >
          FPT EDUCATION
        </ThemedText>
        <ThemedText
          style={styles.headerLabel}
          lightColor="#FFFFFF"
          darkColor="#FFFFFF"
        >
          Lab Booking
        </ThemedText>
      </View>

      <View style={styles.rightSection}>
        {showMenu && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleMenuPress}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {isAuthenticated && (
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={onProfilePress}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      <Sidebar
        visible={sidebarVisible}
        onClose={handleCloseSidebar}
        isAuthenticated={isAuthenticated}
        userName={userName}
        userEmail={userEmail}
        onLoginPress={handleLoginPress}
        onRegisterPress={handleRegisterPress}
        onLogoutPress={handleLogoutPress}
        onProfilePress={handleProfilePress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#E07B53',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    width: 60,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  menuButton: {
    padding: 8,
  },
  avatarButton: {
    padding: 4,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 4,
  },
});

