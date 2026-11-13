import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  questDifficulties,
  questPriorities,
  questStatuses,
  questTypes,
  type QuestDifficulty,
  type QuestFilters,
  type QuestPriority,
  type QuestSort,
  type QuestStatus,
  type QuestType,
  type QuestView,
} from '@hylink/domain';
import { colors, EmptyState, ParchmentScreen, QuestCard, radius, spacing } from '@hylink/ui';

import { useQuestContext, useQuestItems } from '../application/QuestContext';
import { formatQuestDate, questItemStatus } from './formatQuest';

const views: readonly { readonly value: QuestView; readonly label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'all', label: 'All quests' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

function FilterRow<T extends string>({
  label,
  values,
  selected,
  onSelect,
}: {
  readonly label: string;
  readonly values: readonly T[];
  readonly selected: T | null;
  readonly onSelect: (value: T | null) => void;
}) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.chips}>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: selected === null }} onPress={() => onSelect(null)} style={[styles.chip, selected === null && styles.chipSelected]}>
          <Text style={[styles.chipText, selected === null && styles.chipTextSelected]}>Any</Text>
        </Pressable>
        {values.map((value) => (
          <Pressable accessibilityRole="button" accessibilityState={{ selected: selected === value }} key={value} onPress={() => onSelect(value)} style={[styles.chip, selected === value && styles.chipSelected]}>
            <Text style={[styles.chipText, selected === value && styles.chipTextSelected]}>{value}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function JournalScreen() {
  const [view, setView] = useState<QuestView>('today');
  const [type, setType] = useState<QuestType | null>(null);
  const [difficulty, setDifficulty] = useState<QuestDifficulty | null>(null);
  const [priority, setPriority] = useState<QuestPriority | null>(null);
  const [status, setStatus] = useState<QuestStatus | null>(null);
  const [sort, setSort] = useState<QuestSort>('dueAt');
  const [showFilters, setShowFilters] = useState(false);
  const [pendingOccurrence, setPendingOccurrence] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const filters = useMemo<QuestFilters>(() => ({
    view,
    sort,
    direction: sort === 'priority' ? 'desc' : 'asc',
    ...(type ? { type } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(priority ? { priority } : {}),
    ...(status ? { status } : {}),
  }), [difficulty, priority, sort, status, type, view]);
  const { items, loading, error } = useQuestItems(filters);
  const { completeQuest, reopenQuest } = useQuestContext();

  return (
    <ParchmentScreen title="Quest journal" subtitle="Your quests stay on this device and remain available offline.">
      <View style={styles.chips}>
        {views.map((item) => (
          <Pressable accessibilityRole="button" accessibilityState={{ selected: view === item.value }} key={item.value} onPress={() => setView(item.value)} style={[styles.viewChip, view === item.value && styles.chipSelected]}>
            <Text style={[styles.chipText, view === item.value && styles.chipTextSelected]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.toolbar}>
        <Pressable accessibilityRole="button" onPress={() => setShowFilters((value) => !value)} style={styles.toolbarButton}>
          <Text style={styles.toolbarText}>{showFilters ? 'Hide filters' : 'Filters'}</Text>
        </Pressable>
        <Text style={styles.count}>{items.length} shown</Text>
      </View>
      {showFilters ? (
        <View style={styles.filters}>
          <FilterRow label="Type" values={questTypes} selected={type} onSelect={setType} />
          <FilterRow label="Difficulty" values={questDifficulties} selected={difficulty} onSelect={setDifficulty} />
          <FilterRow label="Priority" values={questPriorities} selected={priority} onSelect={setPriority} />
          <FilterRow label="Status" values={questStatuses} selected={status} onSelect={setStatus} />
          <FilterRow label="Sort" values={['dueAt', 'createdAt', 'priority'] as const} selected={sort} onSelect={(value) => value && setSort(value)} />
        </View>
      ) : null}
      {loading ? <Text style={styles.notice}>Reading your journal…</Text> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {mutationError ? <Text accessibilityRole="alert" style={styles.error}>{mutationError}</Text> : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState title={`No ${views.find((item) => item.value === view)?.label.toLowerCase() ?? 'quests'}`} message="Use the + button to capture a new quest." />
      ) : null}
      {items.map((item) => {
        const statusValue = questItemStatus(item);
        const occurrenceId = item.occurrence?.id;
        return (
          <QuestCard
            key={occurrenceId ?? item.quest.id}
            title={item.quest.title}
            detail={`${formatQuestDate(item)} · ${item.quest.difficulty}`}
            status={statusValue}
            mutationPending={pendingOccurrence === (occurrenceId ?? item.quest.id)}
            onPress={() => router.push(`/quests/${item.quest.id}${occurrenceId ? `?occurrenceId=${occurrenceId}` : ''}` as Href)}
            {...(item.quest.status !== 'archived' ? {
              onToggleComplete: () => {
                const mutationKey = occurrenceId ?? item.quest.id;
                if (pendingOccurrence) return;
                const action = statusValue === 'completed' ? reopenQuest : completeQuest;
                setPendingOccurrence(mutationKey);
                setMutationError(null);
                action(item.quest.id, occurrenceId)
                  .catch(() => setMutationError(`Could not ${statusValue === 'completed' ? 'reopen' : 'complete'} this quest. Please try again.`))
                  .finally(() => setPendingOccurrence(null));
              },
            } : {})}
          />
        );
      })}
    </ParchmentScreen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  viewChip: { borderColor: colors.bronze, borderRadius: radius.pill, borderWidth: 1.5, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.md },
  chip: { borderColor: colors.bronze, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center', minHeight: 40, paddingHorizontal: spacing.sm },
  chipSelected: { backgroundColor: colors.pine, borderColor: colors.pine },
  chipText: { color: colors.ink, fontSize: 13, textTransform: 'capitalize' },
  chipTextSelected: { color: colors.parchmentLight, fontWeight: '800' },
  toolbar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  toolbarButton: { borderColor: colors.pine, borderRadius: radius.sm, borderWidth: 1.5, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.md },
  toolbarText: { color: colors.pine, fontWeight: '800' },
  count: { color: colors.mutedInk },
  filters: { backgroundColor: colors.parchmentLight, borderColor: colors.bronze, borderRadius: radius.md, borderWidth: 1, gap: spacing.md, padding: spacing.md },
  filterGroup: { gap: spacing.xs },
  filterLabel: { color: colors.ink, fontWeight: '800' },
  notice: { color: colors.mutedInk, fontSize: 16 },
  error: { color: colors.danger, fontSize: 16 },
});

