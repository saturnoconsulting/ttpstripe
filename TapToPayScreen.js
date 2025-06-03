import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import axios from 'axios';

const TapToPayScreen = () => {
  const {
    initialize,
    discoverReaders,
    connectReader,
    connectLocalMobileReader,
    collectPaymentMethod,
    processPayment
  } = useStripeTerminal({
    onUpdateDiscoveredReaders: (readersList) => {
      console.log('Discovered Readers aggiornati:', readersList);
      setReaders(readersList);
    }
  });

  const [readers, setReaders] = useState([]);
  const [reader, setReader] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initStripeTerminal = async () => {
      try {
        await initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Errore inizializzazione Stripe Terminal:', error);
        Alert.alert('Errore', 'Impossibile inizializzare Stripe Terminal.');
      }
    };
    initStripeTerminal();
  }, []);

  const handleDiscoverReaders = async () => {
    if (!isInitialized) {
      Alert.alert('Attendi', 'Stripe Terminal non è ancora inizializzato.');
      return;
    }

    if (isLoading) {
      Alert.alert('Attendi', 'Una scoperta è già in corso.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await discoverReaders({
        discoveryMethod: 'tapToPay', 
        simulated: false // o false se usi dispositivi reali
      });

      if (error) {
        console.warn('Errore discoverReaders:', error);
        Alert.alert('Errore', error.message);
      } else {
        console.log('Scoperta avviata...');
      }
    } catch (err) {
      console.error('Errore durante discoverReaders:', err);
      Alert.alert('Errore', 'Impossibile eseguire discoverReaders.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectReader = async () => {
    if (readers.length === 0) {
      Alert.alert('Errore', 'Nessun lettore disponibile.');
      return;
    }

    try {
      setIsLoading(true);
      const { reader: connectedReader, error } = await connectReader({
        reader: readers[0],
        locationId: readers[0].locationId || 'tml_simulated'
      }, 'tapToPay'); // Usa 'tapToPay' per lettori NFC

      if (error) {
        console.error('Errore connessione:', error);
        Alert.alert('Errore', error.message || 'Impossibile connettere il lettore.');
        return;
      }

      setReader(connectedReader);
      Alert.alert('Lettore connesso', `Modello: ${connectedReader.deviceType}`);
    } catch (error) {
      console.error('Errore nella connessione al lettore:', error);
      Alert.alert('Errore', 'Errore nella connessione al lettore.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollectPayment = async () => {
    if (!reader) {
      Alert.alert('Errore', 'Connetti un lettore prima di accettare pagamenti.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('https://your-backend.com/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1000, currency: 'eur' })
      });

      const { paymentIntent } = await response.json();

      if (!paymentIntent?.client_secret) {
        throw new Error('Payment Intent non valido');
      }

      await collectPaymentMethod(paymentIntent.client_secret);
      const result = await processPayment(paymentIntent.client_secret);

      Alert.alert('Pagamento completato', `Stato: ${result.status || 'sconosciuto'}`);
    } catch (error) {
      console.error('Errore durante il pagamento:', error);
      Alert.alert('Errore', 'Impossibile completare il pagamento.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 22, marginBottom: 30 }}>💳 Tap to Pay con Stripe</Text>

      <Button
        title="🔍 Scopri lettori NFC"
        onPress={handleDiscoverReaders}
        disabled={isLoading}
      />

      <View style={{ marginVertical: 10 }} />

      <Button
        title="🔌 Connetti Lettore"
        onPress={handleConnectReader}
        disabled={isLoading || readers.length === 0}
      />

      <View style={{ marginVertical: 10 }} />

      <Button
        title="✅ Accetta pagamento"
        onPress={handleCollectPayment}
        disabled={isLoading || !reader}
      />
    </View>
  );
};

export default TapToPayScreen;