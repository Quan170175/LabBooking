import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export interface ProfileHeaderProps {
  name: string;
  phoneNumber: string;
  onBackPress?: () => void;
}

export function ProfileHeader({ name, phoneNumber, onBackPress }: ProfileHeaderProps) {
  const iconColor = useThemeColor({}, 'text');
  const avatarBgColor = '#FFE5D9';

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={iconColor} />
      </TouchableOpacity>
      
      <ThemedText type="subtitle" style={styles.title}>
        Thông tin cá nhân
      </ThemedText>

      <View style={styles.userCard}>
        <View style={[styles.avatarContainer, { backgroundColor: avatarBgColor }]}>
          <Ionicons name="person" size={32} color="#E07B53" />
        </View>
        
        <View style={styles.userInfo}>
          <ThemedText type="defaultSemiBold" style={styles.userName}>
            {name}
          </ThemedText>
          <ThemedText style={styles.phoneNumber}>
            {phoneNumber}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 16,
    padding: 4,
  },
  title: {
    marginBottom: 24,
    fontSize: 20,
    fontWeight: '600',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#687076',
  },
});

