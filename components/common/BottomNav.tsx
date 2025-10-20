import { IconSymbol } from '@/components/ui/icon-symbol';
import { BrandColors } from '@/constants/theme';
import React from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface NavItem {
  id: string;
  title: string;
  icon: string;
  route: string;
}

interface CustomBottomNavProps {
  activeTab: string;
  onTabPress: (route: string) => void;
}

const { width } = Dimensions.get('window');

const navItems: NavItem[] = [
  {
    id: 'home',
    title: 'Trang chủ',
    icon: 'house.fill',
    route: '',
  },
  {
    id: 'notifications',
    title: 'Thông báo',
    icon: 'bell.fill',
    route: 'notifications',
  },
  {
    id: 'profile',
    title: 'Cá nhân',
    icon: 'person.fill',
    route: 'profile',
  },
  {
    id: 'settings',
    title: 'Chức năng',
    icon: 'gearshape.fill',
    route: 'settings',
  },
];

export default function CustomBottomNav({ activeTab, onTabPress }: CustomBottomNavProps) {
  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        {navItems.map((item) => {
          const isActive = activeTab === item.route;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.navItem}
              onPress={() => onTabPress(item.route)}
              activeOpacity={0.7}
            >
              <IconSymbol
                name={item.icon}
                size={24}
                color={isActive ? BrandColors.primary : '#9BA1A6'}
              />
              <Text style={[styles.navText, isActive && styles.activeText]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#F5F5F5', // Light beige background
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: BrandColors.white,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 12,
    color: '#9BA1A6',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeText: {
    color: BrandColors.primary,
    fontWeight: '600',
  },
});
