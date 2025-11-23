import { Edge, Node } from 'reactflow';

export enum ComplexityLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  INTENSE = 'INTENSE'
}

export type AnalysisMode = 'EXPLAIN' | 'FLOW' | 'REVIEW';

export interface FileNodeData {
  label: string;
  complexityScore: number;
  complexityLevel: ComplexityLevel;
  linesOfCode: number;
  summary: string;
  type: 'file' | 'component' | 'service' | 'utility' | 'config' | 'folder';
  url: string;
  files?: string[]; // List of top files inside this folder for preview
  fullPath?: string; // The actual path in the repo (e.g., "src/components")
  expanded?: boolean; // Whether children are currently shown
  reasoning: string; 
  concepts?: string[]; // Educational concepts (e.g. "Recursion", "JWT")
  onAnalyze: (id: string) => void;
  onExpand?: (id: string, path: string) => void;
  analysisCache?: Record<string, string>;
  
  // Visual State
  dimmed?: boolean; // If true, this node is faded out during search focus
}

export type RepoNode = Node<FileNodeData>;

export interface RepoAnalysis {
  repoName: string;
  nodes: RepoNode[];
  edges: Edge[];
  overallComplexity: number;
  overallSummary: string;
  architectureType: string;
  fileMap: string[]; // Complete list of file paths for client-side expansion
  timestamp?: number; // When this analysis was performed/cached
  defaultBranch: string;
}

export interface SearchResult {
  nodeId: string;
  path?: string[]; // List of node IDs involved in this feature flow
  answer: string;
}