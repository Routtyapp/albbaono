import { apiMutate } from './client';

export async function updateOnboardingStep(step: number): Promise<{ success: boolean; onboardingStep: number }> {
  return apiMutate('/api/onboarding', 'PATCH', { step });
}
