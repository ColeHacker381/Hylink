import { GoldProgressBar, ParchmentCard, ParchmentScreen, SectionTitle } from '@hylink/ui';
import { Text } from 'react-native';

import { getHeroPreview } from '../application/getHeroPreview';

export function HeroScreen() {
  const hero = getHeroPreview();

  return (
    <ParchmentScreen title="Hero" subtitle="A gentle record of growth.">
      <ParchmentCard accessibilityLabel={`${hero.title}, level ${hero.level}`}>
        <SectionTitle eyebrow={`Level ${hero.level}`}>{hero.title}</SectionTitle>
        <Text>Practicing: {hero.activeSkills.join(' · ')}</Text>
        <GoldProgressBar label="Level progress" value={hero.levelProgressPercent} />
      </ParchmentCard>
    </ParchmentScreen>
  );
}

