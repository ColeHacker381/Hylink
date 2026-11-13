import { EmptyState, ParchmentCard, ParchmentScreen, RupeeCounter, SectionTitle } from '@hylink/ui';
import { Text } from 'react-native';

import { getTreasuryPreview } from '../application/getTreasuryPreview';

export function TreasuryScreen() {
  const preview = getTreasuryPreview();

  return (
    <ParchmentScreen title="Treasury" subtitle="Virtual rewards and real finances never share a ledger.">
      <ParchmentCard>
        <SectionTitle eyebrow="Adventure rewards">Rupee pouch</SectionTitle>
        <RupeeCounter value={preview.rupees} />
        <Text>Preview currency only — it has no cash value.</Text>
      </ParchmentCard>
      <EmptyState title="No financial accounts" message="Bank connections are not part of this foundation." />
    </ParchmentScreen>
  );
}

