import { BrandColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing functionality will be implemented soon.');
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change functionality will be implemented soon.');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            // Handle logout logic here
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={BrandColors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={60} color={BrandColors.white} />
          </View>
          <Text style={styles.userName}>John Doe</Text>
          <Text style={styles.userEmail}>john.doe@example.com</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
            <Ionicons name="key-outline" size={24} color={BrandColors.textSecondary} />
            <Text style={styles.menuText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={BrandColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <Ionicons name="notifications-outline" size={24} color={BrandColors.textSecondary} />
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={BrandColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <Ionicons name="settings-outline" size={24} color={BrandColors.textSecondary} />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color={BrandColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <Ionicons name="help-circle-outline" size={24} color={BrandColors.textSecondary} />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={BrandColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => {}}>
            <Ionicons name="information-circle-outline" size={24} color={BrandColors.textSecondary} />
            <Text style={styles.menuText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color={BrandColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={BrandColors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.textSecondary,
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: BrandColors.textSecondary,
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: BrandColors.textMuted,
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.white,
  },
  menuSection: {
    paddingVertical: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: BrandColors.textSecondary,
    marginLeft: 16,
    fontWeight: '500',
  },
  logoutSection: {
    paddingVertical: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: BrandColors.error,
    borderRadius: 12,
    backgroundColor: BrandColors.white,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.error,
    marginLeft: 8,
  },
});
