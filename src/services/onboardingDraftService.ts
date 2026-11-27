import { initialState, type OnboardingState } from '../pages/Onboarding/onboardingData';
import { STORAGE_KEYS, readJson, removeItem, writeJson } from './storage';

/**
 * Rascunho do onboarding: as respostas ficam salvas enquanto a pessoa preenche,
 * então recarregar a página (ou voltar ao login no passo 1) não perde nada.
 */
export function loadDraft(userId: string): OnboardingState {
  const saved = readJson<Partial<OnboardingState> | null>(STORAGE_KEYS.onboardingDraft(userId), null);
  return saved ? { ...initialState(), ...saved } : initialState();
}

export function saveDraft(userId: string, state: OnboardingState) {
  writeJson(STORAGE_KEYS.onboardingDraft(userId), state);
}

/** Chamado ao terminar o onboarding (o perfil já foi salvo na conta). */
export function clearDraft(userId: string) {
  removeItem(STORAGE_KEYS.onboardingDraft(userId));
}
