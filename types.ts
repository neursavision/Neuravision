export interface BusinessProfile {
  name: string;
  sector: string;
  mission: string;
  challenges: string;
}

export interface SimulationOutcome {
  kpi: string;
  baseline: number;
  projected: number;
  unit: string; // '%', '$', etc.
}

export interface SimulationScenario {
  name: string; // e.g. "Conservative", "Optimistic"
  description: string;
  outcomes: SimulationOutcome[];
}

export interface AnalysisReport {
  diagnosis: string; // Must be extensive
  actionPlan: string; // Markdown
  kpis: { name: string; value: string; target: string; status: 'good' | 'warning' | 'critical' }[];
  okrs: { objective: string; keyResults: string[] }[];
  growthProjection: { month: string; revenue: number; projected: number }[];
  operationalMaturity: { category: string; A: number; B: number; fullMark: number }[]; // For Radar Chart
  resourceAllocation: { name: string; value: number }[]; // For Pie Chart
  futureOutlook: string;
  simulations: SimulationScenario[];
  hbsAnalysis?: string; 
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  isThinking?: boolean;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  INPUT = 'INPUT',
  SUMMARY = 'SUMMARY', // Resumo Analítico
  ADVANCED_REPORT = 'ADVANCED_REPORT', // Relatório Avançado Imediato
  HBS = 'HBS', // Análise HBS
  CONSULTANT = 'CONSULTANT', // Consultor de Voz
  ANALYSIS = 'ANALYSIS'
}

export interface GeneratedVideo {
  uri: string;
  prompt: string;
}