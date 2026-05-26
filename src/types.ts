export type AgentRole = {
  id: string;
  name: string;
  description: string;
};

export type RoundResponse = {
  agentId: string;
  position: string;
  reasoning: string[];
  risks: string[];
  confidence: number;
  userVote?: 'up' | 'down' | null;
};

export type RoundCritique = {
  agentId: string;
  agreeWithIds: string[];
  disagreeWithIds: string[];
  criticalInsight: string;
  revisedPosition: string;
};

export type RoundSummary = {
  roundNumber: number;
  type: 'analysis' | 'debate' | 'voting';
  responses: RoundResponse[];
  critiques?: RoundCritique[];
  moderatorSummary: string;
  decisionsLocked: string[];
  openQuestions: string[];
  userFeedback?: string;
};

export type ProjectState = {
  id: string;
  idea: string;
  goals: string;
  constraints: string;
  status: 'intake' | 'meeting' | 'completed';
  agents: AgentRole[];
  rounds: RoundSummary[];
  globalDecisions: string[];
  finalReport?: string;
  createdAt: number;
  language?: 'en' | 'zh';
  quotaWarning?: boolean;
  model?: string;
  uiStyle?: string;
};

// UI Types
export type ApiResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
