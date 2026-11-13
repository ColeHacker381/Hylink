import { StyleSheet, Text } from 'react-native';

import { colors } from '../tokens';
import { ParchmentCard } from './ParchmentCard';
import { SectionTitle } from './SectionTitle';

interface EmptyStateProps {
  readonly title: string;
  readonly message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <ParchmentCard accessibilityLabel={title}>
      <SectionTitle eyebrow="Open page">{title}</SectionTitle>
      <Text style={styles.message}>{message}</Text>
    </ParchmentCard>
  );
}

const styles = StyleSheet.create({
  message: { color: colors.mutedInk, fontSize: 16, lineHeight: 23 },
});

