import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readJson, writeJson } from './storage';

interface Settings {
  /** Ambient scene motion (falling snow, bubbles...). Pieces still move either way. */
  ambientMotion: boolean;
  setAmbientMotion: (on: boolean) => void;
}

const SettingsContext = createContext<Settings | null>(null);
const STORAGE_KEY = 'tc.settings';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Until the player chooses, follow the system's reduced-motion preference (and its changes).
  const [choice, setChoice] = useState<boolean | undefined>(() => readJson<{ ambientMotion?: boolean }>(STORAGE_KEY, {}).ambientMotion);
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const value = useMemo(
    () => ({
      ambientMotion: choice ?? !reduced,
      setAmbientMotion: (on: boolean) => {
        setChoice(on);
        writeJson(STORAGE_KEY, { ambientMotion: on });
      },
    }),
    [choice, reduced],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Settings {
  const settings = useContext(SettingsContext);
  if (!settings) throw new Error('useSettings must be used inside SettingsProvider');
  return settings;
}
