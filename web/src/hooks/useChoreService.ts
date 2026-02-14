import type {
  BonusSettings,
  Chore,
  ChoreExtra,
  ChoreWeeklySummary,
  CreateChoreExtraInput,
  CreateChoreInput,
  ToggleCheckInput,
  UpdateBonusSettingsInput,
  UpdateChoreInput,
} from '@chore-tracker/contracts';
import type { ApiResult } from '../types/ApiResult';
import { useApiFetch } from './apiFetch/useApiFetch';

export const useChoreService = () => {
  const { apiFetch } = useApiFetch();

  const getWeeklySummary = async (
    weekKey?: string,
  ): Promise<ApiResult<ChoreWeeklySummary>> => {
    const qs = weekKey ? `?weekKey=${encodeURIComponent(weekKey)}` : '';
    return apiFetch<ChoreWeeklySummary>(`/chores/weekly${qs}`, { method: 'GET' });
  };

  const createChore = async (
    input: CreateChoreInput,
  ): Promise<ApiResult<Chore>> => {
    return apiFetch<Chore>('/chores', {
      method: 'POST',
      body: input,
    });
  };

  const updateChore = async (
    choreId: string,
    input: UpdateChoreInput,
  ): Promise<ApiResult<Chore>> => {
    return apiFetch<Chore>(`/chores/${encodeURIComponent(choreId)}`, {
      method: 'PATCH',
      body: input,
    });
  };

  const deleteChore = async (choreId: string): Promise<ApiResult<void>> => {
    return apiFetch<void>(`/chores/${encodeURIComponent(choreId)}`, {
      method: 'DELETE',
    });
  };

  const createExtra = async (
    input: CreateChoreExtraInput,
  ): Promise<ApiResult<ChoreExtra>> => {
    return apiFetch<ChoreExtra>('/chores/extras', {
      method: 'POST',
      body: input,
    });
  };

  const deleteExtra = async (extraId: string): Promise<ApiResult<void>> => {
    return apiFetch<void>(`/chores/extras/${encodeURIComponent(extraId)}`, {
      method: 'DELETE',
    });
  };

  const toggleCheck = async (
    input: ToggleCheckInput,
  ): Promise<ApiResult<{ checked: boolean }>> => {
    return apiFetch<{ checked: boolean }>('/chores/checks/toggle', {
      method: 'POST',
      body: input,
    });
  };

  const getBonusSettings = async (): Promise<ApiResult<BonusSettings>> => {
    return apiFetch<BonusSettings>('/chores/bonus-settings', { method: 'GET' });
  };

  const updateBonusSettings = async (
    input: UpdateBonusSettingsInput,
  ): Promise<ApiResult<BonusSettings>> => {
    return apiFetch<BonusSettings>('/chores/bonus-settings', {
      method: 'PATCH',
      body: input,
    });
  };

  return {
    getWeeklySummary,
    createChore,
    updateChore,
    deleteChore,
    createExtra,
    deleteExtra,
    toggleCheck,
    getBonusSettings,
    updateBonusSettings,
  };
};
