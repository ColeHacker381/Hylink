import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../tokens';

interface QuickAddSheetProps {
  readonly initialTitle?: string;
  readonly confirmationMessage?: string;
  readonly onClose: () => void;
  readonly onSave: (title: string) => void;
}

export function QuickAddSheet({ confirmationMessage, initialTitle = '', onClose, onSave }: QuickAddSheetProps) {
  const [title, setTitle] = useState(initialTitle);
  const trimmedTitle = title.trim();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.title}>Capture a quest</Text>
          <Text style={styles.subtitle}>A title is all you need. Details can wait.</Text>
        </View>
        <TextInput
          accessibilityLabel="Quest title"
          autoFocus={!confirmationMessage}
          editable={!confirmationMessage}
          maxLength={120}
          onChangeText={setTitle}
          placeholder="What needs doing?"
          placeholderTextColor={colors.mutedInk}
          returnKeyType="done"
          style={styles.input}
          value={title}
        />
        {confirmationMessage ? <Text accessibilityRole="alert" style={styles.confirmation}>{confirmationMessage}</Text> : null}
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>{confirmationMessage ? 'Done' : 'Cancel'}</Text>
          </Pressable>
          {!confirmationMessage ? (
            <Pressable
              accessibilityRole="button"
              disabled={!trimmedTitle}
              onPress={() => onSave(trimmedTitle)}
              style={({ pressed }) => [styles.primaryButton, !trimmedTitle && styles.disabledButton, pressed && styles.pressedButton]}
            >
              <Text style={styles.primaryText}>Save quest</Text>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.parchment, flex: 1 },
  container: { flex: 1, gap: spacing.lg, justifyContent: 'center', padding: spacing.lg },
  heading: { gap: spacing.sm },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800' },
  subtitle: { color: colors.mutedInk, fontSize: 16, lineHeight: 23 },
  input: { backgroundColor: colors.parchmentLight, borderColor: colors.bronze, borderRadius: radius.md, borderWidth: 2, color: colors.ink, fontSize: 18, minHeight: 56, paddingHorizontal: spacing.md },
  confirmation: { backgroundColor: colors.parchmentLight, borderColor: colors.accent, borderRadius: radius.sm, borderWidth: 1, color: colors.pine, padding: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  secondaryButton: { alignItems: 'center', borderColor: colors.pine, borderRadius: radius.sm, borderWidth: 2, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.md },
  secondaryText: { color: colors.pine, fontSize: 16, fontWeight: '700' },
  primaryButton: { alignItems: 'center', backgroundColor: colors.pine, borderRadius: radius.sm, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.md },
  primaryText: { color: colors.parchmentLight, fontSize: 16, fontWeight: '800' },
  disabledButton: { opacity: 0.45 },
  pressedButton: { opacity: 0.82 },
});

