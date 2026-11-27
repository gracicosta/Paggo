import { useEffect, useState } from 'react';
import { loadDraft, saveDraft } from '../services/onboardingDraftService';
import type { OnboardingState } from '../pages/Onboarding/onboardingData';

/** Estado do onboarding que se salva sozinho no rascunho a cada mudança. */
export function useOnboardingDraft(userId: string) {
  const [state, setState] = useState<OnboardingState>(() => loadDraft(userId));

  useEffect(() => {
    saveDraft(userId, state);
  }, [state, userId]);

  return [state, setState] as const;
}
