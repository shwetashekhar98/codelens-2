import { ComplexityLevel } from './types';

export const MOCK_REPO_SUGGESTIONS = [
  "facebook/react",
  "fastapi/fastapi",
  "google/generative-ai-js",
  "tensorflow/tensorflow"
];

export const COMPLEXITY_COLORS = {
  [ComplexityLevel.LOW]: '#3b82f6', // Blue 500 (Information/Safe)
  [ComplexityLevel.MODERATE]: '#22c55e', // Green 500 (Standard)
  [ComplexityLevel.HIGH]: '#f59e0b', // Amber 500 (Complex)
  [ComplexityLevel.INTENSE]: '#ef4444', // Red 500 (Very Complex)
};

export const INITIAL_NODES = [];
export const INITIAL_EDGES = [];