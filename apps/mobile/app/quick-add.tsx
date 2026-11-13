import { router } from 'expo-router';

import { QuickAddSheet } from '@hylink/ui';

import { useQuestContext } from '../src/features/quests/application/QuestContext';

export default function QuickAddRoute() {
  const { createQuest } = useQuestContext();

  return (
    <QuickAddSheet
      onClose={() => router.back()}
      onSave={async (input) => {
        await createQuest(input);
        router.back();
      }}
    />
  );
}

