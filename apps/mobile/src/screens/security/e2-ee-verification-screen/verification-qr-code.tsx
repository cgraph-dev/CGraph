/**
 * QR code component for E2EE verification.
 * @module screens/security/e2-ee-verification-screen/verification-qr-code
 */
import React from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { styles } from './styles';

interface VerificationQRCodeProps {
  value: string;
  size: number;
}

export function VerificationQRCode({ value, size }: VerificationQRCodeProps) {
  return (
    <View
      style={[
        styles.qrCode,
        {
          width: size + 16,
          height: size + 16,
          padding: 8,
          backgroundColor: '#fff',
          borderRadius: 12,
        },
      ]}
    >
      <QRCode value={value} size={size} backgroundColor="#fff" color="#000" ecl="M" />
    </View>
  );
}
