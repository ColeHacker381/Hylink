import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { openHylinkDatabase } from '@hylink/database/expo';
import {
  QuestService,
  type CreateQuestInput,
  type Quest,
  type QuestDashboard,
  type QuestFilters,
  type QuestListItem,
  type UpdateQuestInput,
} from '@hylink/domain';

interface QuestContextValue {
  readonly service: QuestService | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly revision: number;
  readonly createQuest: (input: CreateQuestInput) => Promise<Quest>;
  readonly updateQuest: (id: string, input: UpdateQuestInput) => Promise<Quest>;
  readonly completeQuest: (id: string, occurrenceId?: string) => Promise<Quest>;
  readonly reopenQuest: (id: string, occurrenceId?: string) => Promise<Quest>;
  readonly archiveQuest: (id: string) => Promise<Quest>;
  readonly deleteQuest: (id: string) => Promise<void>;
  readonly refresh: () => void;
}

const QuestContext = createContext<QuestContextValue | null>(null);
let applicationDatabase: ReturnType<typeof openHylinkDatabase> | null = null;

function getApplicationDatabase() {
  applicationDatabase ??= openHylinkDatabase();
  return applicationDatabase;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The quest database could not be opened.';
}

export function QuestProvider({ children }: PropsWithChildren) {
  const [service, setService] = useState<QuestService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    getApplicationDatabase()
      .then((database) => {
        if (!active) return;
        setService(new QuestService({ repository: database.questRepository }));
        setError(null);
      })
      .catch((reason: unknown) => {
        if (active) setError(errorMessage(reason));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const requireService = useCallback(() => {
    if (!service) throw new Error(error ?? 'Quest storage is still starting.');
    return service;
  }, [error, service]);

  const afterMutation = useCallback(async <T,>(task: (questService: QuestService) => Promise<T>): Promise<T> => {
    const result = await task(requireService());
    setRevision((value) => value + 1);
    return result;
  }, [requireService]);

  const value = useMemo<QuestContextValue>(() => ({
    service,
    loading,
    error,
    revision,
    createQuest: (input) => afterMutation((questService) => questService.createQuest(input)),
    updateQuest: (id, input) => afterMutation((questService) => questService.updateQuest(id, input)),
    completeQuest: (id, occurrenceId) => afterMutation((questService) => questService.completeQuest(id, occurrenceId)),
    reopenQuest: (id, occurrenceId) => afterMutation((questService) => questService.reopenQuest(id, occurrenceId)),
    archiveQuest: (id) => afterMutation((questService) => questService.archiveQuest(id)),
    deleteQuest: (id) => afterMutation((questService) => questService.deleteQuest(id)),
    refresh: () => setRevision((value) => value + 1),
  }), [afterMutation, error, loading, revision, service]);

  return <QuestContext.Provider value={value}>{children}</QuestContext.Provider>;
}

export function useQuestContext(): QuestContextValue {
  const value = useContext(QuestContext);
  if (!value) throw new Error('useQuestContext must be used within QuestProvider.');
  return value;
}

export function useQuestItems(filters: QuestFilters) {
  const { service, revision, loading: contextLoading, error: contextError } = useQuestContext();
  const filterKey = JSON.stringify(filters);
  const stableFilters = useMemo(() => JSON.parse(filterKey) as QuestFilters, [filterKey]);
  const queryKey = `${revision}:${filterKey}`;
  const [result, setResult] = useState<{
    readonly key: string;
    readonly items: readonly QuestListItem[];
    readonly error: string | null;
  }>({ key: '', items: [], error: null });

  useEffect(() => {
    let active = true;
    if (!service) {
      return () => { active = false; };
    }
    service.listQuests(stableFilters)
      .then((items) => { if (active) setResult({ key: queryKey, items, error: null }); })
      .catch((reason: unknown) => { if (active) setResult({ key: queryKey, items: [], error: errorMessage(reason) }); });
    return () => { active = false; };
  }, [queryKey, service, stableFilters]);

  const current = result.key === queryKey;
  return {
    items: current ? result.items : [],
    loading: service ? !current : contextLoading,
    error: contextError ?? (current ? result.error : null),
  };
}

export function useQuest(id: string | undefined) {
  const { service, revision, loading: contextLoading, error: contextError } = useQuestContext();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!service || !id) {
      return () => { active = false; };
    }
    service.getQuest(id)
      .then((result) => { if (active) setQuest(result); })
      .catch((reason: unknown) => { if (active) setError(errorMessage(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [contextError, contextLoading, id, revision, service]);

  return { quest, loading: service && id ? loading : contextLoading, error: contextError ?? error };
}

export function useQuestDashboard() {
  const { service, revision, loading: contextLoading, error: contextError } = useQuestContext();
  const [dashboard, setDashboard] = useState<QuestDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!service) {
      return () => { active = false; };
    }
    service.getDashboard()
      .then((result) => { if (active) setDashboard(result); })
      .catch((reason: unknown) => { if (active) setError(errorMessage(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [contextError, contextLoading, revision, service]);

  return { dashboard, loading: service ? loading : contextLoading, error: contextError ?? error };
}

