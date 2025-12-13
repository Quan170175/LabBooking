declare module "react-native-qrcode-svg" {
  import React from "react";
  interface QRCodeProps {
    value?: string;
    size?: number;
    color?: string;
    backgroundColor?: string;
    logo?: any;
    logoSize?: number;
    logoBackgroundColor?: string;
    logoMargin?: number;
    logoBorderRadius?: number;
    quietZone?: number;
    enableLinearGradient?: boolean;
    linearGradient?: string[];
    ecl?: "L" | "M" | "Q" | "H";
    getRef?: (c: any) => void;
    onError?: Function;
  }
  const QRCode: React.FC<QRCodeProps>;
  export default QRCode;
}
