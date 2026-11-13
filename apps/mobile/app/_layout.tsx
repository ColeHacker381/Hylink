import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@hylink/ui';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.parchment },
          headerStyle: { backgroundColor: colors.pine },
          headerTintColor: colors.parchmentLight,
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="quick-add"
          options={{ presentation: 'modal', title: 'Quick add' }}
        />
      </Stack>
    </>
  );
}

