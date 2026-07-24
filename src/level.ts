import { GameState } from "./state";

export interface LevelCtx {
  state: GameState;
  save(): void;
  /** Report the level cleared; adds its insight card and unlocks the next. */
  win(): void;
  /** Drive the header oscilloscope, 0 = scrambled, 1 = aligned. */
  setScope(alignment: number): void;
  reducedMotion: boolean;
}

export interface InsightCard {
  title: string;
  body: string;
}

export interface LevelDef {
  navTitle: string;
  year: string;
  title: string;
  lede: string;
  card: InsightCard;
  optional?: boolean;
  mount(container: HTMLElement, ctx: LevelCtx): void;
}
