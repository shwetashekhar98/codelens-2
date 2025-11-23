import { RepoAnalysis } from "../types";

const DB_KEY = 'codelens_cache_v1';

// This service simulates a Database. 
// In a production app with MongoDB, these functions would call your Backend API.
export const dbService = {
  
  // CACHE: Get specific repo analysis
  getAnalysis: async (repoName: string): Promise<RepoAnalysis | null> => {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) return null;
      
      const db = JSON.parse(raw);
      const record = db[repoName];
      
      // Simple expiration check (e.g., 24 hours)
      if (record && Date.now() - record.timestamp < 86400000) {
        console.log(`[Cache Hit] Loading ${repoName} from local DB`);
        return record;
      }
      return null;
    } catch (e) {
      console.error("DB Read Error", e);
      return null;
    }
  },

  // STORE: Save full analysis to DB
  saveAnalysis: async (analysis: RepoAnalysis): Promise<void> => {
    try {
      const raw = localStorage.getItem(DB_KEY);
      const db = raw ? JSON.parse(raw) : {};
      
      db[analysis.repoName] = {
        ...analysis,
        timestamp: Date.now()
      };
      
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      console.log(`[DB] Saved ${analysis.repoName}`);
    } catch (e) {
      console.error("DB Write Error (likely QuotaExceeded)", e);
    }
  },

  // UPDATE: Auto-cache specific changes (like deep analysis or expansion)
  updateAnalysis: async (repoName: string, updates: Partial<RepoAnalysis>): Promise<void> => {
      try {
          const raw = localStorage.getItem(DB_KEY);
          if (!raw) return;

          const db = JSON.parse(raw);
          if (!db[repoName]) return;

          // Merge updates
          db[repoName] = {
              ...db[repoName],
              ...updates,
              timestamp: Date.now() // Refresh timestamp on active use
          };

          localStorage.setItem(DB_KEY, JSON.stringify(db));
          console.log(`[Auto-Cache] Updated ${repoName}`);
      } catch (e) {
          console.error("DB Update Error", e);
      }
  },

  // QUERY: Get list of all recent analyses (for History UI)
  getRecentAnalyses: async (): Promise<RepoAnalysis[]> => {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) return [];
      
      const db = JSON.parse(raw);
      return Object.values(db)
        .sort((a: any, b: any) => b.timestamp - a.timestamp) as RepoAnalysis[];
    } catch (e) {
      return [];
    }
  },

  // DELETE: Remove from DB
  clearHistory: async () => {
    localStorage.removeItem(DB_KEY);
  }
};