import { router } from 'expo-router';
import { useState } from 'react';

import { QuickAddSheet } from '@hylink/ui';

export default function QuickAddRoute() {
  const [savedTitle, setSavedTitle] = useState<string | null>(null);

  if (savedTitle) {
    return (
      <QuickAddSheet
        initialTitle={savedTitle}
        confirmationMessage="Quest captured for this preview. Persistence arrives in the quest milestone."
        onClose={() => router.back()}
        onSave={() => router.back()}
      />
    );
  }

  return (
    <QuickAddSheet
      onClose={() => router.back()}
      onSave={(title) => setSavedTitle(title)}
    />
  );
}

