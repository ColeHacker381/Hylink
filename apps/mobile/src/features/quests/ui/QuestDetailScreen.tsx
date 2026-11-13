import { router, type Href } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import type { QuestListItem } from '@hylink/domain';
import { colors, EmptyState, ParchmentCard, ParchmentScreen, QuestCard, radius, SectionTitle, spacing } from '@hylink/ui';

import { useQuest, useQuestContext, useQuestItems } from '../application/QuestContext';
import { formatQuestDate, questItemStatus } from './formatQuest';

const rewardByDifficulty = {
  easy: { xp: 10, rupees: 2 },
  normal: { xp: 20, rupees: 4 },
  hard: { xp: 40, rupees: 8 },
  epic: { xp: 80, rupees: 16 },
} as const;

function DetailRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function ActionButton({ label, danger = false, onPress }: { readonly label: string; readonly danger?: boolean; readonly onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.action, danger && styles.dangerAction]}>
      <Text style={[styles.actionText, danger && styles.dangerText]}>{label}</Text>
    </Pressable>
  );
}

export function QuestDetailScreen({ id, occurrenceId }: { readonly id: string; readonly occurrenceId?: string }) {
  const { quest, loading, error } = useQuest(id);
  const { items } = useQuestItems({ view: 'all', sort: 'dueAt' });
  const { archiveQuest, completeQuest, deleteQuest, reopenQuest } = useQuestContext();
  const questItems = items.filter((item) => item.quest.id === id);
  const selectedItem = questItems.find((item) => item.occurrence?.id === occurrenceId)
    ?? questItems.find((item) => item.occurrence === null)
    ?? questItems[0];

  if (loading) return <ParchmentScreen title="Quest details"><Text>Opening quest…</Text></ParchmentScreen>;
  if (error || !quest) return <ParchmentScreen title="Quest details"><EmptyState title="Quest unavailable" message={error ?? 'This quest no longer exists.'} /></ParchmentScreen>;

  const selectedStatus = selectedItem ? questItemStatus(selectedItem) : quest.status;
  const preview = rewardByDifficulty[quest.difficulty];
  const scheduleItem: QuestListItem = selectedItem ?? { quest, occurrence: null };

  const confirmDelete = () => {
    Alert.alert(
      'Delete quest?',
      'This hides the quest but keeps its history for integrity.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteQuest(id).then(() => router.replace('/journal'));
          },
        },
      ],
    );
  };

  return (
    <ParchmentScreen title={quest.title} subtitle={quest.description ?? 'No description added.'}>
      <ParchmentCard>
        <SectionTitle eyebrow="Quest record">Details</SectionTitle>
        <DetailRow label="Status" value={selectedStatus} />
        <DetailRow label="Type" value={quest.type} />
        <DetailRow label="Difficulty" value={quest.difficulty} />
        <DetailRow label="Priority" value={quest.priority ?? 'Not set'} />
        <DetailRow label="Schedule" value={formatQuestDate(scheduleItem)} />
        <DetailRow label="Timezone" value={quest.dueTimezone ?? quest.recurrence?.timezone ?? 'Not set'} />
      </ParchmentCard>
      <ParchmentCard>
        <SectionTitle eyebrow="Preview only">Potential rewards</SectionTitle>
        <Text style={styles.body}>{quest.xpReward?.amount ?? preview.xp} XP · {quest.rupeeReward?.amount ?? preview.rupees} rupees</Text>
        <Text style={styles.muted}>Rewards are not awarded until the durable progression ledger is implemented.</Text>
      </ParchmentCard>
      <ParchmentCard>
        <SectionTitle eyebrow="Notes">Quest notes</SectionTitle>
        <Text style={styles.body}>{quest.notes ?? 'No notes added.'}</Text>
      </ParchmentCard>
      <View style={styles.actions}>
        <ActionButton label="Edit" onPress={() => router.push(`/quests/${id}/edit` as Href)} />
        {quest.status !== 'archived' ? (
          <ActionButton
            label={selectedStatus === 'completed' ? 'Reopen' : 'Complete'}
            onPress={() => {
              const action = selectedStatus === 'completed' ? reopenQuest : completeQuest;
              void action(id, selectedItem?.occurrence?.id);
            }}
          />
        ) : null}
        {quest.status !== 'archived' ? <ActionButton label="Archive" onPress={() => void archiveQuest(id)} /> : null}
        <ActionButton danger label="Delete" onPress={confirmDelete} />
      </View>
      {quest.recurrence ? (
        <View style={styles.occurrences}>
          <SectionTitle eyebrow="Bounded schedule">Occurrences</SectionTitle>
          {questItems.slice(0, 10).map((item) => (
            <QuestCard
              key={item.occurrence?.id ?? item.quest.id}
              title={formatQuestDate(item)}
              detail={item.occurrence?.occurrenceKey ?? 'Quest'}
              status={questItemStatus(item)}
              onToggleComplete={() => {
                const action = questItemStatus(item) === 'completed' ? reopenQuest : completeQuest;
                void action(id, item.occurrence?.id);
              }}
            />
          ))}
        </View>
      ) : null}
    </ParchmentScreen>
  );
}

const styles = StyleSheet.create({
  detailRow: { borderBottomColor: colors.parchment, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', paddingVertical: spacing.xs },
  detailLabel: { color: colors.mutedInk, fontWeight: '700' },
  detailValue: { color: colors.ink, flex: 1, textAlign: 'right', textTransform: 'capitalize' },
  body: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  muted: { color: colors.mutedInk, lineHeight: 20 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: { alignItems: 'center', borderColor: colors.pine, borderRadius: radius.sm, borderWidth: 1.5, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.md },
  actionText: { color: colors.pine, fontWeight: '800' },
  dangerAction: { borderColor: colors.danger },
  dangerText: { color: colors.danger },
  occurrences: { gap: spacing.sm },
});

