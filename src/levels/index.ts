// Level registry — the game's single ordered inventory.
import { LevelDef } from "../level";
import { l1 } from "./l1_needle";
import { l2 } from "./l2_squeeze";
import { l3 } from "./l3_dimension";
import { l4 } from "./l4_waves";
import { l5 } from "./l5_cutoff";
import { l6 } from "./l6_tower";
import { l7 } from "./l7_running";
import { l8 } from "./l8_finite";

export const levels: LevelDef[] = [l1, l2, l3, l4, l5, l6, l7, l8];
