import { router, useLocalSearchParams } from 'expo-router';

import { QuickAddSheet } from '@hylink/ui';

import { useQuest, useQuestContext } from '../../../src/features/quests/application/QuestContext';

export default function EditQuestRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { quest, loading, error } = useQuest(id);
  const { updateQuest } = useQuestContext();

  if (loading) return null;
  if (error || !quest) return null;

  return (
    <QuickAddSheet
      heading="Edit quest"
      initialQuest={quest}
      submitLabel="Update quest"
      onClose={() => router.back()}
      onSave={async (input) => {
        await updateQuest(id, input);
        router.back();
      }}
    />
  );
}

