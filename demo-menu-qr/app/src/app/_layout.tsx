import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PersonalProvider } from '@/lib/personal';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [cargadas, error] = useFonts({ Fraunces_600SemiBold, Fraunces_700Bold, Inter_400Regular, Inter_600SemiBold, Inter_700Bold });
  const listo = cargadas || !!error; // si fallan las fuentes, seguimos con las del sistema

  useEffect(() => {
    if (listo) SplashScreen.hideAsync();
  }, [listo]);

  if (!listo) return null;

  return (
    <SafeAreaProvider>
      <PersonalProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </PersonalProvider>
    </SafeAreaProvider>
  );
}
