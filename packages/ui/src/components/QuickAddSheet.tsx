import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

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

function initialDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function endOfLocalDay(value: Date | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

function mergeDate(current: Date | null, selected: Date): Date {
  const result = new Date(current ?? selected);
  result.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
  return result;
}

function mergeTime(current: Date | null, selected: Date): Date {
  const result = new Date(current ?? selected);
  result.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
  return result;
}

type PickerTarget = 'due' | 'scheduledDate' | 'scheduledTime' | 'recurrenceEnd';

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
  const [dueDate, setDueDate] = useState<Date | null>(initialDate(initialQuest?.dueAt));
  const [scheduledAt, setScheduledAt] = useState<Date | null>(initialDate(initialQuest?.scheduledAt));
  const [notes, setNotes] = useState(initialQuest?.notes ?? '');
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency | null>(initialQuest?.recurrence?.frequency ?? null);
  const [weekdays, setWeekdays] = useState<readonly number[]>(initialQuest?.recurrence?.weekdays ?? []);
  const [recurrenceEnd, setRecurrenceEnd] = useState<Date | null>(initialDate(initialQuest?.recurrence?.endsAt));
  const [picker, setPicker] = useState<PickerTarget | null>(null);
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
        dueAt: endOfLocalDay(dueDate),
        dueTimezone: dueDate ? localTimezone() : null,
        scheduledAt: scheduledAt?.toISOString() ?? null,
        priority,
        notes,
        recurrence: recurrence ? {
          frequency: recurrence,
          interval: 1,
          weekdays: recurrence === 'weekdays' ? weekdays : [],
          endsAt: endOfLocalDay(recurrenceEnd),
          timezone: localTimezone(),
        } : null,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The quest could not be saved.');
    } finally {
      setSubmitting(false);
    }
  };

  const pickerValue = picker === 'due'
    ? dueDate
    : picker === 'recurrenceEnd'
      ? recurrenceEnd
      : scheduledAt;
  const pickerMode = picker === 'scheduledTime' ? 'time' : 'date';
  const changePicker = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') setPicker(null);
    if (!selected || !picker) return;
    if (picker === 'due') setDueDate(selected);
    if (picker === 'recurrenceEnd') setRecurrenceEnd(selected);
    if (picker === 'scheduledDate') setScheduledAt((value) => mergeDate(value, selected));
    if (picker === 'scheduledTime') setScheduledAt((value) => mergeTime(value, selected));
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
                <View style={styles.dateRow}>
                  <Pressable accessibilityLabel="Choose due date" accessibilityRole="button" onPress={() => setPicker('due')} style={[styles.input, styles.dateButton]}>
                    <Text style={styles.dateText}>{dueDate ? dueDate.toLocaleDateString() : 'Choose a date'}</Text>
                  </Pressable>
                  {dueDate ? <Pressable accessibilityRole="button" onPress={() => setDueDate(null)} style={styles.clearButton}><Text style={styles.clearText}>Clear</Text></Pressable> : null}
                </View>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Scheduled time</Text>
                <View style={styles.dateRow}>
                  <Pressable accessibilityLabel="Choose scheduled date" accessibilityRole="button" onPress={() => setPicker('scheduledDate')} style={[styles.input, styles.dateButton]}>
                    <Text style={styles.dateText}>{scheduledAt ? scheduledAt.toLocaleDateString() : 'Choose date'}</Text>
                  </Pressable>
                  <Pressable accessibilityLabel="Choose scheduled time" accessibilityRole="button" onPress={() => setPicker('scheduledTime')} style={[styles.input, styles.dateButton]}>
                    <Text style={styles.dateText}>{scheduledAt ? scheduledAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Choose time'}</Text>
                  </Pressable>
                  {scheduledAt ? <Pressable accessibilityRole="button" onPress={() => setScheduledAt(null)} style={styles.clearButton}><Text style={styles.clearText}>Clear</Text></Pressable> : null}
                </View>
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
                  <View style={styles.dateRow}>
                    <Pressable accessibilityLabel="Choose recurrence end date" accessibilityRole="button" onPress={() => setPicker('recurrenceEnd')} style={[styles.input, styles.dateButton]}>
                      <Text style={styles.dateText}>{recurrenceEnd ? recurrenceEnd.toLocaleDateString() : 'No end date'}</Text>
                    </Pressable>
                    {recurrenceEnd ? <Pressable accessibilityRole="button" onPress={() => setRecurrenceEnd(null)} style={styles.clearButton}><Text style={styles.clearText}>Clear</Text></Pressable> : null}
                  </View>
                </View>
              ) : null}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput accessibilityLabel="Quest notes" multiline onChangeText={setNotes} style={[styles.input, styles.multiline]} value={notes} />
              </View>
            </View>
          ) : null}
          {picker ? (
            <View style={styles.pickerPanel}>
              <DateTimePicker
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                mode={pickerMode}
                onChange={changePicker}
                value={pickerValue ?? new Date()}
              />
              {Platform.OS === 'ios' ? <Pressable accessibilityRole="button" onPress={() => setPicker(null)} style={styles.doneButton}><Text style={styles.primaryText}>Done</Text></Pressable> : null}
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
  dateRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  dateButton: { justifyContent: 'center', minWidth: 140 },
  dateText: { color: colors.ink, fontSize: 16 },
  clearButton: { justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.sm },
  clearText: { color: colors.danger, fontWeight: '700' },
  pickerPanel: { backgroundColor: colors.parchmentLight, borderColor: colors.bronze, borderRadius: radius.md, borderWidth: 1, padding: spacing.sm },
  doneButton: { alignItems: 'center', alignSelf: 'flex-end', backgroundColor: colors.pine, borderRadius: radius.sm, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.md },
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

