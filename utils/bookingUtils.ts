import { Slot } from "./bookingTypes";

// --- DỮ LIỆU TỪ FILE CỦA BẠN ---

export const SLOTS: Slot[] = [
  { id: "slot1", label: "Slot 1", time: "07:00 - 09:15" },
  { id: "slot2", label: "Slot 2", time: "09:30 - 11:45" },
  { id: "slot3", label: "Slot 3", time: "12:30 - 14:45" },
  { id: "slot4", label: "Slot 4", time: "15:00 - 17:15" },
];

export const DEVICE_MAP: Record<string, { name: string; desc?: string }> = {
  d1: { name: "Laptop", desc: "Laptop sinh viên (Windows)" },
  d2: { name: "Máy chiếu", desc: "Máy chiếu HD" },
  d3: { name: "Bộ kit IoT", desc: "Cảm biến và board phát triển" },
  d4: { name: "PC", desc: "Máy trạm cài đặt sẵn" },
  d5: { name: "Router", desc: "Thiết bị mạng" },
};

export function formatSlots(slots: any): string {
  if (!Array.isArray(slots) || slots.length === 0) return String(slots || "");
  // Logic này đã được điều chỉnh để xử lý nhiều ngày (nếu có)
  const groupedByDay: Record<string, string[]> = {};
  slots.forEach((s: any) => {
    const slot = SLOTS.find((x) => x.id === s.slotId);
    const label = slot ? slot.label : s.slotId;
    if (!groupedByDay[s.day]) {
      groupedByDay[s.day] = [];
    }
    groupedByDay[s.day].push(label);
  });

  return Object.entries(groupedByDay)
    .map(([day, slotLabels]) => `${day} (${slotLabels.join(", ")})`)
    .join("; ");
}

export function formatDevices(devices: any): string {
  if (!Array.isArray(devices) || devices.length === 0)
    return "Không có thiết bị";
  return devices
    .map((d: any) => {
      const deviceId = typeof d === "string" ? d : d.id;
      const qty = typeof d === "string" ? 1 : d.qty || 1;
      return `${DEVICE_MAP[deviceId]?.name || deviceId} - ${qty} cái`;
    })
    .join(", ");
}

// --- DỮ LIỆU THÊM VÀO TỪ REFACTOR ---

export const DEFAULT_ROOMS = [
  { id: "lab-a101", name: "Phòng Lab A101" },
  { id: "lab-b202", name: "Phòng Lab B202" },
  { id: "lab-c303", name: "Phòng Lab C303" },
];

export function isApproved(b: {
  approved?: boolean;
  status?: string;
}): boolean {
  if (typeof b.approved === "boolean") return b.approved;
  if (typeof b.status === "string")
    return ["approved", "đã duyệt", "Đã duyệt"].includes(b.status);
  return false;
}
