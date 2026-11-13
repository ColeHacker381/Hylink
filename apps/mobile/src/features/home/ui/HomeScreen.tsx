import { GoldProgressBar, ParchmentCard, ParchmentScreen, SectionTitle } from '@hylink/ui';
import { Text } from 'react-native';

import { getHomeSnapshot } from '../application/getHomeSnapshot';

export function HomeScreen() {
  const snapshot = getHomeSnapshot();

  return (
    <ParchmentScreen title={snapshot.greeting} subtitle="Your offline adventure begins here.">
      <ParchmentCard accessibilityLabel="Today's focus quest">
        <SectionTitle eyebrow="Today's focus">{snapshot.focusQuest}</SectionTitle>
        <Text>{snapshot.openQuestCount} mock quests remain in this preview.</Text>
        <GoldProgressBar label="Daily progress" value={snapshot.progressPercent} />
      </ParchmentCard>
      <ParchmentCard>
        <SectionTitle eyebrow="Campfire note">A quiet start</SectionTitle>
        <Text>Capture a thought with the + button. Nothing leaves this device.</Text>
      </ParchmentCard>
    </ParchmentScreen>
  );
}

