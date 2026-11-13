import { useLocalSearchParams } from 'expo-router';

import { QuestDetailScreen } from '../../src/features/quests/ui/QuestDetailScreen';

export default function QuestDetailRoute() {
  const params = useLocalSearchParams<{ id: string; occurrenceId?: string }>();
  return <QuestDetailScreen id={params.id} {...(params.occurrenceId ? { occurrenceId: params.occurrenceId } : {})} />;
}

