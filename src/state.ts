// Game progress. Persisted to localStorage so a shared HTML file remembers
// where the player left off.

export interface GameState {
  level: number;
  unlocked: number;
  completed: number[];
  /** Level 2's best packed area — carried forward as Level 5's par. */
  l2BestArea: number | null;
  /** Level 2 configuration behind that best, re-rendered in Level 3. */
  l2Config: { n: number; slide: number } | null;
}

const KEY = "needle-wave-progress-v1";

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults(), ...JSON.parse(raw) };
  } catch {
    // Private-mode or blocked storage: play with in-memory state only.
  }
  return defaults();
}

function defaults(): GameState {
  return { level: 0, unlocked: 0, completed: [], l2BestArea: null, l2Config: null };
}

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Ignore: progress just won't survive a reload.
  }
}
