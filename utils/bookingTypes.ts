// Định nghĩa cấu trúc cho một Slot
export type Slot = {
  id: string;
  label: string;
  time: string;
};

// Định nghĩa cấu trúc cho một Device (dựa trên formatDevices mới)
export type Device = string | { id: string; qty: number };

// Định nghĩa cấu trúc chính của một Booking
export type Booking = {
  id: number;
  roomId: string;
  roomName?: string;

  slots: { day: string; slotId: string }[];
  // Đã cập nhật để khớp với hàm formatDevices mới
  devices: Device[];
  type: string;
  invited?: string[];
  approved?: boolean;
  status?: string;
  [key: string]: any;
};

// Định nghĩa cấu trúc của một Room
export type Room = {
  id: string;
  name?: string;
  bookings: Booking[];
};
