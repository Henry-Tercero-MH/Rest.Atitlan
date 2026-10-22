import { Stack, useLocalSearchParams } from 'expo-router';

import { CarritoProvider } from '@/lib/carrito';
import { PreferenciasProvider } from '@/lib/preferencias';

export default function ClienteLayout() {
  const { token } = useLocalSearchParams<{ token: string }>();
  return (
    <PreferenciasProvider>
      <CarritoProvider token={token}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="platillo/[id]" options={{ presentation: 'modal' }} />
        </Stack>
      </CarritoProvider>
    </PreferenciasProvider>
  );
}
