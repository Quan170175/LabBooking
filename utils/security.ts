// 1. DÒNG NÀY BẮT BUỘC Ở ĐẦU TIÊN (Để tránh lỗi Crash)
import "react-native-get-random-values";

// 2. Sau đó mới import crypto
import CryptoJS from "crypto-js";

// MẬT KHẨU BÍ MẬT (Phải giống nhau giữa các máy)
const SECRET_KEY = "LAB_IOT_KEY_2025_SECURE";

export const encryptData = (data: any): string => {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
  } catch (e) {
    console.error("Lỗi mã hóa:", e);
    return "";
  }
};

export const decryptData = (cipherText: string): any => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText ? JSON.parse(originalText) : null;
  } catch (error) {
    return null;
  }
};
