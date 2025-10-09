import { AppHeader } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function NotificationsScreen() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const notifications = [
    {
      id: '1',
      title: 'Thông báo lịch bảo trì phòng Lab A501',
      message: 'Chiều thứ 5 (02/10) phòng A501 sẽ tạm ngưng phục vụ để bảo trì hệ thống máy in 3D.',
      time: '02/10/2025 16:39',
      read: false,
      icon: 'notifications' as const,
    },
    {
      id: '2',
      title: 'Cập nhật lịch hoạt động Lab IoT',
      message: 'Môn Internet of Things học phần 2 chuyển sang phòng B203 trong tuần này.',
      time: '23/09/2025 13:58',
      read: false,
      icon: 'notifications' as const,
    },
    {
      id: '3',
      title: 'Kết quả kiểm tra thiết bị tuần 37',
      message: 'Thiết bị cảm biến trong Lab AI đã đạt chuẩn, có thể đặt vào các buổi tối.',
      time: '18/09/2025 15:19',
      read: true,
      icon: 'checkmark-circle' as const,
    },
    {
      id: '4',
      title: 'Tạm ngưng đăng ký Lab Robotics',
      message: 'Lab Robotics sẽ đóng cửa ngày 17/09 để nâng cấp cánh tay robot công nghiệp.',
      time: '17/09/2025 09:31',
      read: true,
      icon: 'checkmark-circle' as const,
    },
  ];

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  return (
    <ThemedView style={styles.container}>
      <AppHeader />
      
      <View style={styles.content}>
        {/* Page Title */}
        <ThemedText type="title" style={styles.pageTitle}>
          Thông báo
        </ThemedText>
        <ThemedText style={styles.pageSubtitle}>
          Theo dõi mọi cập nhật về lịch và trạng thái phòng lab
        </ThemedText>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <ThemedText
              style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}
            >
              Tất cả
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'unread' && styles.tabActive]}
            onPress={() => setActiveTab('unread')}
          >
            <ThemedText
              style={[styles.tabText, activeTab === 'unread' && styles.tabTextActive]}
            >
              Chưa đọc
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.unreadCard,
              ]}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconContainer,
                notification.read && styles.iconContainerRead,
              ]}>
                <Ionicons
                  name={notification.icon}
                  size={24}
                  color={notification.read ? '#10B981' : '#E07B53'}
                />
              </View>
              
              <View style={styles.notificationContent}>
                <ThemedText type="defaultSemiBold" style={styles.notificationTitle}>
                  {notification.title}
                </ThemedText>
                <ThemedText style={styles.notificationMessage}>
                  {notification.message}
                </ThemedText>
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={14} color="#9E9E9E" />
                  <ThemedText style={styles.notificationTime}>
                    {notification.time}
                  </ThemedText>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          ))}

          {filteredNotifications.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
              </View>
              <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>
                Không có thông báo
              </ThemedText>
              <ThemedText style={styles.emptyText}>
                {activeTab === 'unread' 
                  ? 'Bạn đã đọc hết tất cả thông báo'
                  : 'Chưa có thông báo nào được gửi đến'}
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#FDF6F0',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 24,
    marginBottom: 8,
    color: '#2D2D2D',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#687076',
    paddingHorizontal: 20,
    marginBottom: 20,
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  tabActive: {
    backgroundColor: '#E07B53',
    borderColor: '#E07B53',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  unreadCard: {
    backgroundColor: '#FFFBF5',
    borderTopWidth: 2,
    borderTopColor: '#E07B53',
    borderColor: '#FFE5D9',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE5D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerRead: {
    backgroundColor: '#D1FAE5',
  },
  notificationContent: {
    flex: 1,
    paddingRight: 8,
  },
  notificationTitle: {
    fontSize: 15,
    marginBottom: 6,
    color: '#1F2937',
    lineHeight: 20,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
    lineHeight: 18,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    marginBottom: 8,
    color: '#374151',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
