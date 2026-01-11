import { createContext, useContext, ReactNode } from 'react';
import { useFactChecker } from '../hooks/useFactChecker';
import { FactCheck, ScannerStatus } from '../types';

interface FactCheckerContextType {
  status: ScannerStatus;
  claims: FactCheck[];
  error: string | null;
  currentTranscript: string;
  isListening: boolean;
  toggleListening: () => Promise<void>;
  clearClaims: () => void;
}

const FactCheckerContext = createContext<FactCheckerContextType | null>(null);

export function FactCheckerProvider({ children }: { children: ReactNode }) {
  const factChecker = useFactChecker();

  return (
    <FactCheckerContext.Provider value={factChecker}>
      {children}
    </FactCheckerContext.Provider>
  );
}

export function useFactCheckerContext() {
  const context = useContext(FactCheckerContext);
  if (!context) {
    throw new Error('useFactCheckerContext must be used within FactCheckerProvider');
  }
  return context;
}
