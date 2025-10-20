import { BrandColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  isAuthenticated?: boolean;
  userName?: string;
  userEmail?: string;
  onLoginPress?: () => void;
  onRegisterPress?: () => void;
  onLogoutPress?: () => void;
  onProfilePress?: () => void;
}

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.85;

export function Sidebar({
  visible,
  onClose,
  isAuthenticated = false,
  userName,
  userEmail,
  onLoginPress,
  onRegisterPress,
  onLogoutPress,
  onProfilePress,
}: SidebarProps) {
  const slideAnim = React.useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const panGestureRef = React.useRef<PanGestureHandler>(null);

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SIDEBAR_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: slideAnim } }],
    { useNativeDriver: true }
  );

  const onPanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      // If swiped right more than 50px or with high velocity, close the sidebar
      if (translationX > 50 || velocityX > 500) {
        handleClose();
      } else {
        // Otherwise, snap back to original position
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>
        <PanGestureHandler
          ref={panGestureRef}
          onGestureEvent={onPanGestureEvent}
          onHandlerStateChange={onPanHandlerStateChange}
          activeOffsetX={10}
          failOffsetY={[-5, 5]}
        >
          <Animated.View
            style={[
              styles.sidebar,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.sidebarContent}>
              {/* Close Button - Minimalist */}
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={BrandColors.textSecondary} />
              </TouchableOpacity>

              {/* User Section */}
              {isAuthenticated ? (
                <View style={styles.userSection}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.avatarText}>
                      {userName?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{userName || 'User'}</Text>
                    <Text style={styles.userEmail}>{userEmail || 'user@example.com'}</Text>
                  </View>
                  <TouchableOpacity style={styles.editButton} onPress={onProfilePress}>
                    <Ionicons name="create-outline" size={20} color={BrandColors.primary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.guestSection}>
                  <View style={styles.guestAvatar}>
                    <Ionicons name="person-outline" size={32} color={BrandColors.textMuted} />
                  </View>
                  <Text style={styles.guestTitle}>Chào mừng bạn</Text>
                  <Text style={styles.guestSubtitle}>Đăng nhập để sử dụng đầy đủ tính năng</Text>
                </View>
              )}

              {/* Menu Items */}
              <View style={styles.menuSection}>
                {isAuthenticated ? (
                  <>
                    <View style={styles.menuGroup}>
                      <Text style={styles.groupLabel}>QUẢN LÝ</Text>
                      
                      <MenuItem
                        icon="calendar"
                        label="Đặt lịch của tôi"
                        onPress={() => {}}
                      />
                      
                      <MenuItem
                        icon="time"
                        label="Lịch sử đặt phòng"
                        onPress={() => {}}
                      />
                      
                      <MenuItem
                        icon="notifications"
                        label="Thông báo"
                        badge="3"
                        onPress={() => {}}
                      />
                    </View>

                    <View style={styles.menuGroup}>
                      <Text style={styles.groupLabel}>KHÁC</Text>
                      
                      <MenuItem
                        icon="settings"
                        label="Cài đặt"
                        onPress={() => {}}
                      />
                      
                      <MenuItem
                        icon="help-circle"
                        label="Trợ giúp & Hỗ trợ"
                        onPress={() => {}}
                      />
                      
                      <MenuItem
                        icon="information-circle"
                        label="Về chúng tôi"
                        onPress={() => {}}
                      />
                    </View>

                    <View style={styles.menuGroup}>
                      <MenuItem
                        icon="log-out"
                        label="Đăng xuất"
                        onPress={onLogoutPress || (() => {})}
                        variant="danger"
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.authButtons}>
                      <TouchableOpacity style={styles.primaryButton} onPress={onLoginPress}>
                        <Text style={styles.primaryButtonText}>Đăng nhập</Text>
                      </TouchableOpacity>
                      
                      {/* <TouchableOpacity style={styles.secondaryButton} onPress={onRegisterPress}>
                        <Text style={styles.secondaryButtonText}>Đăng ký ngay</Text>
                      </TouchableOpacity> */}
                    </View>

                    <View style={styles.menuGroup}>
                      <MenuItem
                        icon="information-circle"
                        label="Giới thiệu"
                        onPress={() => {}}
                      />
                      
                      <MenuItem
                        icon="help-circle"
                        label="Trợ giúp"
                        onPress={() => {}}
                      />
                    </View>
                  </>
                )}
              </View>

            </View>
          </Animated.View>
        </PanGestureHandler>
      </View>
    </Modal>
  );
}

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  badge?: string;
  variant?: 'default' | 'danger';
}

function MenuItem({ icon, label, onPress, badge, variant = 'default' }: MenuItemProps) {
  const isDanger = variant === 'danger';
  
  return (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.menuIcon,
        isDanger && styles.menuIconDanger
      ]}>
        <Ionicons 
          name={`${icon}-outline` as any} 
          size={22} 
          color={isDanger ? BrandColors.error : BrandColors.textSecondary} 
        />
      </View>
      <Text style={[
        styles.menuLabel,
        isDanger && styles.menuLabelDanger
      ]}>
        {label}
      </Text>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons 
        name="chevron-forward" 
        size={18} 
        color={BrandColors.textMuted} 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 0,
    paddingBottom: 0,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: BrandColors.white,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: -4,
      height: 0,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  safeArea: {
    flex: 1,
  },
  sidebarContent: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BrandColors.secondary,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BrandColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: BrandColors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.textSecondary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: BrandColors.textMuted,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BrandColors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  guestAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BrandColors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: BrandColors.textSecondary,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: BrandColors.textMuted,
    textAlign: 'center',
  },
  menuSection: {
    flex: 1,
    paddingTop: 8,
  },
  menuGroup: {
    marginBottom: 24,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.textMuted,
    paddingHorizontal: 24,
    paddingBottom: 12,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginBottom: 4,
    borderRadius: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BrandColors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuIconDanger: {
    backgroundColor: BrandColors.error + '10',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: BrandColors.textSecondary,
    fontWeight: '500',
  },
  menuLabelDanger: {
    color: BrandColors.error,
  },
  badge: {
    backgroundColor: BrandColors.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.white,
  },
  authButtons: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: BrandColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: BrandColors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.white,
  },
  secondaryButton: {
    backgroundColor: BrandColors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.primary,
  },
  sidebarFooter: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: BrandColors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.textSecondary,
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    color: BrandColors.textMuted,
  },
});