import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@hylink/ui';

import { QuestProvider } from '../src/features/quests/application/QuestContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <QuestProvider>
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
        <Stack.Screen name="quests/[id]" options={{ title: 'Quest details' }} />
        <Stack.Screen name="quests/[id]/edit" options={{ presentation: 'modal', title: 'Edit quest' }} />
      </Stack>
    </QuestProvider>
  );
}

