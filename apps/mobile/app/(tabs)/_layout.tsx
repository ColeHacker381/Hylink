import { Link, Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type ColorValue } from 'react-native';

import { colors, spacing } from '@hylink/ui';

const tabIcons = {
  index: '⌂',
  journal: '≡',
  world: '◎',
  treasury: '◇',
  hero: '♙',
} as const;

function TabIcon({ name, color }: { name: keyof typeof tabIcons; color: ColorValue }) {
  return <Text style={[styles.tabIcon, { color }]}>{tabIcons[name]}</Text>;
}

export default function TabLayout() {
  return (
    <View style={styles.shell}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.pine },
          headerTintColor: colors.parchmentLight,
          headerTitleStyle: { fontWeight: '700' },
          tabBarActiveTintColor: colors.pine,
          tabBarInactiveTintColor: colors.mutedInk,
          tabBarStyle: styles.tabBar,
          sceneStyle: { backgroundColor: colors.parchment },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon name="index" color={color} /> }}
        />
        <Tabs.Screen
          name="journal"
          options={{ title: 'Journal', tabBarIcon: ({ color }) => <TabIcon name="journal" color={color} /> }}
        />
        <Tabs.Screen
          name="world"
          options={{ title: 'World', tabBarIcon: ({ color }) => <TabIcon name="world" color={color} /> }}
        />
        <Tabs.Screen
          name="treasury"
          options={{ title: 'Treasury', tabBarIcon: ({ color }) => <TabIcon name="treasury" color={color} /> }}
        />
        <Tabs.Screen
          name="hero"
          options={{ title: 'Hero', tabBarIcon: ({ color }) => <TabIcon name="hero" color={color} /> }}
        />
      </Tabs>
      <Link href="/quick-add" asChild>
        <Pressable
          accessibilityLabel="Quick add a quest"
          accessibilityHint="Opens the quest capture sheet"
          accessibilityRole="button"
          style={styles.quickAdd}
        >
          <Text style={styles.quickAddText}>+</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  tabBar: {
    backgroundColor: colors.parchmentLight,
    borderTopColor: colors.bronze,
    minHeight: 64,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
  },
  tabIcon: { fontSize: 24, fontWeight: '700' },
  quickAdd: {
    alignItems: 'center',
    backgroundColor: colors.pine,
    borderColor: colors.gold,
    borderRadius: 28,
    borderWidth: 3,
    bottom: 76,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.lg,
    width: 56,
  },
  quickAddText: { color: colors.parchmentLight, fontSize: 34, lineHeight: 38 },
});

