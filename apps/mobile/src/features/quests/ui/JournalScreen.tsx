import { ParchmentScreen, QuestCard } from '@hylink/ui';

import { listQuestPreviews } from '../application/listQuestPreviews';

export function JournalScreen() {
  const quests = listQuestPreviews();

  return (
    <ParchmentScreen title="Quest journal" subtitle="Mock entries for the foundation preview.">
      {quests.map((quest) => (
        <QuestCard key={quest.id} title={quest.title} detail={quest.detail} status={quest.status} />
      ))}
    </ParchmentScreen>
  );
}

