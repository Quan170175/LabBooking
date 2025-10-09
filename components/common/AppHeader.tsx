import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export interface AppHeaderProps {
  showMenu?: boolean;
  onMenuPress?: () => void;
}

export function AppHeader({ showMenu = true, onMenuPress }: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {showMenu && (
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={onMenuPress}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
      
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

      <View style={styles.rightSection} />
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
    alignItems: 'flex-start',
  },
  menuButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    width: 60,
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

