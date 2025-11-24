import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Components
import ManagerApprovalCard from "../../components/manager/ManagerApprovalCard"; // Card cho Booking mới
import ManagerChangeCard from "../../components/manager/ManagerChangeCard"; // Card cho Change Request

// API Config
const apiClient = axios.create({ baseURL: "https://localhost:7089/api" });

type ActiveTab = "standard" | "priority" | "change";

export default function ManagerApprovalsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("standard");
  
  // Lab ID của Manager (Thường lấy từ Context/Storage sau khi login)
  const managerLabId = "427b0284-4aa9-4f21-b2f3-cb8d851a72cb"; 

  // --- 1. LOAD DATA TỪ 2 API SONG SONG ---
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resBookings, resChanges] = await Promise.all([
          // API 1: Lấy đơn đặt mới (Booking)
          apiClient.get('/Bookings/pending', { params: { labId: managerLabId } }),
          // API 2: Lấy yêu cầu thay đổi (ChangeRequest)
          apiClient.get('/BookingChangeRequest/pending', { params: { labId: managerLabId } })
      ]);

      // Đánh dấu loại (Tagging) để dễ filter
      const listBookings = resBookings.data.map((b: any) => ({ ...b, uiType: 'BOOKING' }));
      const listChanges = resChanges.data.map((c: any) => ({ ...c, uiType: 'CHANGE_REQUEST' }));

      // Gộp và Sắp xếp (Mới nhất lên đầu)
      const combined = [...listBookings, ...listChanges].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setAllRequests(combined);
    } catch (e) {
      console.error("Load approvals error:", e);
      Alert.alert("Lỗi", "Không tải được danh sách yêu cầu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- 2. FILTER DATA THEO TABS ---
  const standardBookings = useMemo(() => 
    allRequests.filter(b => b.uiType === 'BOOKING' && b.type !== 'UniversityEvent'), 
  [allRequests]);

  const priorityBookings = useMemo(() => 
    allRequests.filter(b => b.uiType === 'BOOKING' && b.type === 'UniversityEvent'), 
  [allRequests]);

  const changeBookings = useMemo(() => 
    allRequests.filter(b => b.uiType === 'CHANGE_REQUEST'), 
  [allRequests]);

  // --- 3. XỬ LÝ DUYỆT/TỪ CHỐI ---
  const handleAction = async (item: any, isApprove: boolean) => {
      try {
          // Xác định Endpoint dựa vào loại UI
          let endpoint = "";
          
          if (item.uiType === 'CHANGE_REQUEST') {
              // Gọi API duyệt Change Request
              endpoint = `/BookingChangeRequests/${item.id}/${isApprove ? 'approve' : 'reject'}`;
          } else {
              // Gọi API duyệt Booking mới
              endpoint = `/Bookings/${item.id}/${isApprove ? 'approve' : 'reject'}`;
          }

          console.log(`🚀 Calling: ${endpoint}`);
          // Gọi API (Giả sử dùng PUT)
          await apiClient.put(endpoint);
          
          Alert.alert("Thành công", `Đã ${isApprove ? "duyệt" : "từ chối"} yêu cầu.`);
          loadData(); // Reload lại danh sách

      } catch (error: any) {
          console.error(error);
          const msg = error.response?.data?.message || "Lỗi hệ thống khi xử lý.";
          Alert.alert("Thất bại", msg);
      }
  };

  // --- 4. RENDER LIST ---
  const renderList = () => {
    if (isLoading) return <ActivityIndicator style={styles.centered} size="large" color="#EA580C" />;

    let data = [];
    let EmptyComp = null;
    let renderItem: any = null;

    switch (activeTab) {
        case "standard":
            data = standardBookings;
            EmptyComp = <Text style={styles.emptyText}>Không có đơn đặt mới.</Text>;
            renderItem = ({ item }: any) => (
                <ManagerApprovalCard
                    booking={item}
                    onApprove={() => handleAction(item, true)}
                    onReject={() => handleAction(item, false)}
                />
            );
            break;

        // case "priority":
        //     data = priorityBookings;
        //     EmptyComp = <Text style={styles.emptyText}>Không có sự kiện ưu tiên.</Text>;
        //     renderItem = ({ item }: any) => (
        //         <ManagerPriorityCard
        //             booking={item}
        //             onApprove={() => handleAction(item, true)}
        //             onReject={() => handleAction(item, false)}
        //         />
        //     );
        //     break;

        case "change":
            data = changeBookings;
            EmptyComp = <Text style={styles.emptyText}>Không có yêu cầu thay đổi.</Text>;
            renderItem = ({ item }: any) => (
                // Sử dụng Card mới chúng ta vừa viết
                <ManagerChangeCard
                    request={item} 
                    onApprove={() => handleAction(item, true)}
                    onReject={() => handleAction(item, false)}
                />
            );
            break;
    }

    return (
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={EmptyComp}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Duyệt yêu cầu</Text></View>
      
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TabButton title="Lịch mới" count={standardBookings.length} isActive={activeTab === "standard"} onPress={() => setActiveTab("standard")} />
        {/* <TabButton title="Ưu tiên" count={priorityBookings.length} isActive={activeTab === "priority"} onPress={() => setActiveTab("priority")} isPriority /> */}
        <TabButton title="Thay đổi" count={changeBookings.length} isActive={activeTab === "change"} onPress={() => setActiveTab("change")} />
      </View>

      <View style={styles.listContainer}>{renderList()}</View>
    </View>
  );
}

// Tab Component (Giữ nguyên)
const TabButton = ({ title, count, isActive, onPress, isPriority = false }: any) => (
  <TouchableOpacity style={[styles.tab, isActive && styles.tabActive]} onPress={onPress}>
    <Text style={[styles.tabText, isActive && styles.tabTextActive, isPriority && !isActive && styles.tabTextPriority]}>{title}</Text>
    {count > 0 && <View style={[styles.badge, isPriority ? styles.badgePriority : styles.badgeDefault]}><Text style={styles.badgeText}>{count}</Text></View>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
  tabContainer: { flexDirection: "row", gap: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent", gap: 8 },
  tabActive: { borderBottomColor: "#EA580C" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#EA580C" },
  tabTextPriority: { color: "#D97706" },
  badge: { borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2, minWidth: 20, alignItems: "center" },
  badgeDefault: { backgroundColor: "#E0F2FE" },
  badgePriority: { backgroundColor: "#FEF9C3" },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#0369A1" },
  listContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  emptyText: { textAlign: "center", color: "#64748B", fontSize: 15, marginTop: 40 },
});