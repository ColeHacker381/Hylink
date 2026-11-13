import { Link, router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, GoldProgressBar, ParchmentCard, ParchmentScreen, QuestCard, radius, SectionTitle, spacing } from '@hylink/ui';

import { getHeroPreview } from '../../hero/application/getHeroPreview';
import { useQuestDashboard } from '../../quests/application/QuestContext';
import { formatQuestDate, questItemStatus } from '../../quests/ui/formatQuest';

export function HomeScreen() {
  const { dashboard, loading, error } = useQuestDashboard();
  const hero = getHeroPreview();
  const focusItems = [...(dashboard?.overdue ?? []), ...(dashboard?.today ?? [])].slice(0, 3);

  return (
    <ParchmentScreen title="Good day, adventurer" subtitle="Your offline quest board is ready.">
      <Link href="/quick-add" asChild>
        <Pressable accessibilityRole="button" style={styles.quickAdd}>
          <Text style={styles.quickAddText}>+ Capture a quest</Text>
        </Pressable>
      </Link>
      {loading ? <Text style={styles.muted}>Reading today’s quests…</Text> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <View style={styles.stats}>
        <ParchmentCard accessibilityLabel={`${dashboard?.today.length ?? 0} quests today`}>
          <Text style={styles.statValue}>{dashboard?.today.length ?? 0}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </ParchmentCard>
        <ParchmentCard accessibilityLabel={`${dashboard?.overdue.length ?? 0} overdue quests`}>
          <Text style={styles.statValue}>{dashboard?.overdue.length ?? 0}</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </ParchmentCard>
        <ParchmentCard accessibilityLabel={`${dashboard?.completedCount ?? 0} completed quests`}>
          <Text style={styles.statValue}>{dashboard?.completedCount ?? 0}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </ParchmentCard>
      </View>
      <View style={styles.section}>
        <SectionTitle eyebrow="Today and overdue">Quest board</SectionTitle>
        {focusItems.length === 0 && !loading ? <Text style={styles.muted}>No urgent quests. The path is clear.</Text> : null}
        {focusItems.map((item) => (
          <QuestCard
            key={item.occurrence?.id ?? item.quest.id}
            title={item.quest.title}
            detail={formatQuestDate(item)}
            status={questItemStatus(item)}
            onPress={() => router.push(`/quests/${item.quest.id}${item.occurrence ? `?occurrenceId=${item.occurrence.id}` : ''}` as Href)}
          />
        ))}
      </View>
      <ParchmentCard>
        <SectionTitle eyebrow="Coming next">Upcoming</SectionTitle>
        <Text style={styles.body}>{dashboard?.upcoming.length ?? 0} quests on the horizon.</Text>
      </ParchmentCard>
      <ParchmentCard>
        <SectionTitle eyebrow="Example progression">{hero.title}, level {hero.level}</SectionTitle>
        <Text style={styles.body}>Progression remains a preview until the durable XP ledger is implemented.</Text>
        <GoldProgressBar label="Example level progress" value={hero.levelProgressPercent} />
      </ParchmentCard>
    </ParchmentScreen>
  );
}

const styles = StyleSheet.create({
  quickAdd: { alignItems: 'center', backgroundColor: colors.pine, borderRadius: radius.md, justifyContent: 'center', minHeight: 52, paddingHorizontal: spacing.md },
  quickAddText: { color: colors.parchmentLight, fontSize: 17, fontWeight: '800' },
  stats: { flexDirection: 'row', gap: spacing.sm },
  statValue: { color: colors.pine, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  statLabel: { color: colors.mutedInk, fontSize: 12, textAlign: 'center' },
  section: { gap: spacing.sm },
  body: { color: colors.ink, fontSize: 16 },
  muted: { color: colors.mutedInk, fontSize: 16 },
  error: { color: colors.danger, fontSize: 16 },
});

