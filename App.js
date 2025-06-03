import React, { useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { StripeTerminalProvider } from '@stripe/stripe-terminal-react-native';
import TapToPayScreen from './TapToPayScreen';
import axios from 'axios';
import { requestNeededAndroidPermissions } from '@stripe/stripe-terminal-react-native';

const fetchConnectionToken = async () => {
  try {
    const res = await axios.get(
      "https://app.saturnoretail.com/api/v1/operators/payments/stripe/token?etoken=d06c022ad51f031cbc98dfdac902f4ea016f843b"
    );
    const token = res?.data?.connection_token?.secret || res?.data?.connection_token;
    if (!token) throw new Error("Token non valido");
    console.log("🔐 Token ricevuto:", token);
    return token;
  } catch (error) {
    console.error("❌ Errore token:", error);
    throw new Error("Connection token fetch failed");
  }
};

const requestPermissions = async () => {
  if (Platform.OS !== 'android') return;

  const permissions = [];

  if (PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
    permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

  if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN)
    permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);

  if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT)
    permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);

  if (PermissionsAndroid.PERMISSIONS.NFC)
    permissions.push(PermissionsAndroid.PERMISSIONS.NFC);

  try {
    const granted = await requestNeededAndroidPermissions({
      accessFineLocation: {
        title: 'Location Permission',
        message: 'Stripe Terminal needs access to your location',
        buttonPositive: 'Accept',
      },
    });
    if (granted) {
      Alert.alert(
        'Permessi richiesti',
        'I permessi necessari sono stati concessi.'
      );
    } else {
      console.error(
        'Location and BT services are required in order to connect to a reader.'
      );
    }
  } catch (err) {
    console.error("❌ Errore nella richiesta permessi:", err);
    Alert.alert("Errore permessi", "Errore nella richiesta dei permessi richiesti.");
  }
};

export default function App() {
  useEffect(() => {
    requestPermissions();
    
  }, []);

  return (
    <StripeTerminalProvider tokenProvider={fetchConnectionToken} logLevel="verbose">
      <TapToPayScreen />
    </StripeTerminalProvider>
  );
}
