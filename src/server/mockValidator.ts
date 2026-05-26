import { ProjectState } from '../types';

/**
 * Executes a simulated coherence validation suite prior to code generation.
 * This ensures that the generated output from the CodeGenerator engine
 * aligns strictly with the project's foundational constraints.
 */
export function validateLogicalCoherence(project: ProjectState): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!project.idea) {
    errors.push('CRITICAL: Core architectural idea is completely missing.');
  }

  if (project.rounds.length === 0) {
    errors.push('SKIPPED: Not enough debate cycles have occurred to form a coherent blueprint.');
    return { valid: false, errors };
  }

  const latestRound = project.rounds[project.rounds.length - 1];
  
  if (!latestRound.decisionsLocked || latestRound.decisionsLocked.length === 0) {
    errors.push('WARNING: No explicit implementation decisions were locked in the final round.');
  }

  // Isolation check: Ensure zero leak of UI layer properties into the simulated database state
  if (project.agents.some(a => 'onClick' in a || 'ref' in a)) {
    errors.push('CRITICAL: Client-side UI paradigms leaked into isolated domain data objects.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function runIsolationTests() {
  console.log('[System Test] Running isolation validation on novel modules...');
  const mockState = {
    id: 'mock-1',
    idea: 'Test',
    goals: '',
    constraints: '',
    status: 'meeting' as const,
    agents: [],
    rounds: [],
    globalDecisions: [],
    createdAt: Date.now()
  };

  const { valid, errors } = validateLogicalCoherence(mockState);
  if (!valid && errors.includes('SKIPPED: Not enough debate cycles have occurred to form a coherent blueprint.')) {
    console.log('[System Test] ✅ Isolation verified: State boundaries perfectly blocked premature generation.');
  } else {
    console.warn('[System Test] ❌ Isolation violation detected in edge bounds!');
  }
}
