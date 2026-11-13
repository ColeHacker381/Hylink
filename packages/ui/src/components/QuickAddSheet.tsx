import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  questDifficulties,
  questPriorities,
  questTypes,
  recurrenceFrequencies,
  type CreateQuestInput,
  type Quest,
  type QuestDifficulty,
  type QuestPriority,
  type QuestType,
  type RecurrenceFrequency,
} from '@hylink/domain';

import { colors, radius, spacing } from '../tokens';

interface QuickAddSheetProps {
  readonly initialQuest?: Quest;
  readonly heading?: string;
  readonly submitLabel?: string;
  readonly onClose: () => void;
  readonly onSave: (input: CreateQuestInput) => Promise<void> | void;
}

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function localTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function dateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateTimeInputValue(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  return `${dateInputValue(value)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function parseDate(value: string, endOfDay = false): string | null {
  if (!value.trim()) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) throw new Error('Dates must use YYYY-MM-DD.');
  const date = new Date(`${value.trim()}T${endOfDay ? '23:59:59' : '12:00:00'}`);
  if (Number.isNaN(date.getTime())) throw new Error('Enter a valid calendar date.');
  return date.toISOString();
}

function parseDateTime(value: string): string | null {
  if (!value.trim()) return null;
  const normalized = value.trim().replace(' ', 'T');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    throw new Error('Scheduled time must use YYYY-MM-DD HH:mm.');
  }
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) throw new Error('Enter a valid scheduled time.');
  return date.toISOString();
}

function ChoiceRow<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  readonly label: string;
  readonly options: readonly T[];
  readonly selected: T | null;
  readonly onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map((option) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: option === selected }}
            key={option}
            onPress={() => onSelect(option)}
            style={[styles.choice, option === selected && styles.choiceSelected]}
          >
            <Text style={[styles.choiceText, option === selected && styles.choiceTextSelected]}>{option}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function QuickAddSheet({
  initialQuest,
  heading = 'Capture a quest',
  submitLabel = 'Save quest',
  onClose,
  onSave,
}: QuickAddSheetProps) {
  const [title, setTitle] = useState(initialQuest?.title ?? '');
  const [description, setDescription] = useState(initialQuest?.description ?? '');
  const [type, setType] = useState<QuestType>(initialQuest?.type ?? 'side');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>(initialQuest?.difficulty ?? 'normal');
  const [priority, setPriority] = useState<QuestPriority | null>(initialQuest?.priority ?? null);
  const [dueDate, setDueDate] = useState(dateInputValue(initialQuest?.dueAt));
  const [scheduledAt, setScheduledAt] = useState(dateTimeInputValue(initialQuest?.scheduledAt));
  const [notes, setNotes] = useState(initialQuest?.notes ?? '');
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency | null>(initialQuest?.recurrence?.frequency ?? null);
  const [weekdays, setWeekdays] = useState<readonly number[]>(initialQuest?.recurrence?.weekdays ?? []);
  const [recurrenceEnd, setRecurrenceEnd] = useState(dateInputValue(initialQuest?.recurrence?.endsAt));
  const [advanced, setAdvanced] = useState(Boolean(initialQuest));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmedTitle = title.trim();

  const submit = async () => {
    if (!trimmedTitle || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSave({
        title: trimmedTitle,
        description,
        type,
        difficulty,
        dueAt: parseDate(dueDate, true),
        dueTimezone: dueDate ? localTimezone() : null,
        scheduledAt: parseDateTime(scheduledAt),
        priority,
        notes,
        recurrence: recurrence ? {
          frequency: recurrence,
          interval: 1,
          weekdays: recurrence === 'weekdays' ? weekdays : [],
          endsAt: parseDate(recurrenceEnd, true),
          timezone: localTimezone(),
        } : null,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The quest could not be saved.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>{heading}</Text>
            <Text style={styles.subtitle}>A title is all you need. Details can wait.</Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              accessibilityLabel="Quest title"
              autoFocus={!initialQuest}
              maxLength={120}
              onChangeText={setTitle}
              placeholder="What needs doing?"
              placeholderTextColor={colors.mutedInk}
              returnKeyType="done"
              style={styles.input}
              value={title}
            />
          </View>
          <Pressable accessibilityRole="button" onPress={() => setAdvanced((value) => !value)} style={styles.advancedButton}>
            <Text style={styles.advancedText}>{advanced ? 'Hide advanced options' : 'Advanced options'}</Text>
          </Pressable>
          {advanced ? (
            <View style={styles.advancedPanel}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput accessibilityLabel="Quest description" multiline onChangeText={setDescription} style={[styles.input, styles.multiline]} value={description} />
              </View>
              <ChoiceRow label="Type" options={questTypes} selected={type} onSelect={setType} />
              <ChoiceRow label="Difficulty" options={questDifficulties} selected={difficulty} onSelect={setDifficulty} />
              <ChoiceRow label="Priority" options={questPriorities} selected={priority} onSelect={setPriority} />
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Due date</Text>
                <TextInput accessibilityLabel="Due date" onChangeText={setDueDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.mutedInk} style={styles.input} value={dueDate} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Scheduled time</Text>
                <TextInput accessibilityLabel="Scheduled time" onChangeText={setScheduledAt} placeholder="YYYY-MM-DD HH:mm" placeholderTextColor={colors.mutedInk} style={styles.input} value={scheduledAt} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Recurrence</Text>
                <View style={styles.choiceRow}>
                  <Pressable accessibilityRole="button" accessibilityState={{ selected: recurrence === null }} onPress={() => setRecurrence(null)} style={[styles.choice, recurrence === null && styles.choiceSelected]}>
                    <Text style={[styles.choiceText, recurrence === null && styles.choiceTextSelected]}>none</Text>
                  </Pressable>
                  {recurrenceFrequencies.map((frequency) => (
                    <Pressable accessibilityRole="button" accessibilityState={{ selected: recurrence === frequency }} key={frequency} onPress={() => setRecurrence(frequency)} style={[styles.choice, recurrence === frequency && styles.choiceSelected]}>
                      <Text style={[styles.choiceText, recurrence === frequency && styles.choiceTextSelected]}>{frequency}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              {recurrence === 'weekdays' ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Repeat on</Text>
                  <View style={styles.choiceRow}>
                    {weekdayLabels.map((label, day) => {
                      const selected = weekdays.includes(day);
                      return (
                        <Pressable accessibilityLabel={label} accessibilityRole="button" accessibilityState={{ selected }} key={label} onPress={() => setWeekdays(selected ? weekdays.filter((value) => value !== day) : [...weekdays, day])} style={[styles.choice, selected && styles.choiceSelected]}>
                          <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}
              {recurrence ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Recurrence ends</Text>
                  <TextInput accessibilityLabel="Recurrence end date" onChangeText={setRecurrenceEnd} placeholder="YYYY-MM-DD (optional)" placeholderTextColor={colors.mutedInk} style={styles.input} value={recurrenceEnd} />
                </View>
              ) : null}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput accessibilityLabel="Quest notes" multiline onChangeText={setNotes} style={[styles.input, styles.multiline]} value={notes} />
              </View>
            </View>
          ) : null}
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={submitting} onPress={onClose} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!trimmedTitle || submitting}
              onPress={() => void submit()}
              style={({ pressed }) => [styles.primaryButton, (!trimmedTitle || submitting) && styles.disabledButton, pressed && styles.pressedButton]}
            >
              <Text style={styles.primaryText}>{submitting ? 'Saving…' : submitLabel}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.parchment, flex: 1 },
  container: { flex: 1 },
  scrollContent: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl },
  heading: { gap: spacing.sm },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800' },
  subtitle: { color: colors.mutedInk, fontSize: 16, lineHeight: 23 },
  fieldGroup: { gap: spacing.xs },
  label: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  input: { backgroundColor: colors.parchmentLight, borderColor: colors.bronze, borderRadius: radius.md, borderWidth: 2, color: colors.ink, fontSize: 17, minHeight: 52, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  advancedButton: { alignItems: 'center', alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  advancedText: { color: colors.pine, fontSize: 16, fontWeight: '800' },
  advancedPanel: { gap: spacing.md },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  choice: { borderColor: colors.bronze, borderRadius: radius.pill, borderWidth: 1.5, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.sm },
  choiceSelected: { backgroundColor: colors.pine, borderColor: colors.pine },
  choiceText: { color: colors.ink, fontSize: 13, textTransform: 'capitalize' },
  choiceTextSelected: { color: colors.parchmentLight, fontWeight: '800' },
  error: { backgroundColor: colors.parchmentLight, borderColor: colors.danger, borderRadius: radius.sm, borderWidth: 1, color: colors.danger, padding: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  secondaryButton: { alignItems: 'center', borderColor: colors.pine, borderRadius: radius.sm, borderWidth: 2, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.md },
  secondaryText: { color: colors.pine, fontSize: 16, fontWeight: '700' },
  primaryButton: { alignItems: 'center', backgroundColor: colors.pine, borderRadius: radius.sm, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.md },
  primaryText: { color: colors.parchmentLight, fontSize: 16, fontWeight: '800' },
  disabledButton: { opacity: 0.45 },
  pressedButton: { opacity: 0.82 },
});

