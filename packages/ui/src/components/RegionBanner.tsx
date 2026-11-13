import { StyleSheet, Text } from 'react-native';

import { colors } from '../tokens';
import { ParchmentCard } from './ParchmentCard';
import { SectionTitle } from './SectionTitle';

interface RegionBannerProps {
  readonly name: string;
  readonly description: string;
  readonly detail: string;
}

export function RegionBanner({ name, description, detail }: RegionBannerProps) {
  return (
    <ParchmentCard accessibilityLabel={`${name}, ${detail}`}>
      <SectionTitle eyebrow="Atlas region">{name}</SectionTitle>
      <Text style={styles.description}>{description}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </ParchmentCard>
  );
}

const styles = StyleSheet.create({
  description: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  detail: { color: colors.pine, fontWeight: '700' },
});

