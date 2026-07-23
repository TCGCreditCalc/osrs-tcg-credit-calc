export const LEVEL_UP_REWARD_FLOOR = 1250;
export const LEVEL_UP_REWARD_CAP = 25000;
export const LEVEL_UP_PROGRESS_LEVELS = 97;
export const LEVEL_UP_CURVE_STEEPNESS = 2.5;

// Precompute XP table to prevent massive lag during long simulation loops
const XP_TABLE: number[] = [0, 0]; // 1-indexed, levels 0 and 1 are 0 XP
let total = 0;
for (let i = 1; i <= 126; i++) {
  total += Math.floor(i + 300 * Math.pow(2, i / 7.0));
  XP_TABLE[i + 1] = Math.floor(total / 4);
}

/**
 * Calculates the total experience required for a given OSRS level.
 */
export function experienceForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level > 126) return XP_TABLE[127] || 200000000;
  return XP_TABLE[level];
}

/**
 * Reverses experience into a level, up to virtual level 126.
 */
export function levelForExperience(xp: number): number {
  if (xp <= 0) return 1;
  // Linear scan is perfectly fast on a 126 element array
  for (let i = 2; i <= 126; i++) {
    if (xp < XP_TABLE[i]) {
      return i - 1;
    }
  }
  return 126;
}

/**
 * TCG Plugin Level-Up Base Credits calculation.
 */
export function levelUpReward(level: number): number {
  if (level > 99) return 0; // No level up rewards past 99

  const clamped = Math.max(level, 1);
  if (clamped <= 2) {
    return LEVEL_UP_REWARD_FLOOR;
  }
  if (clamped >= 99) {
    return LEVEL_UP_REWARD_CAP;
  }

  const progress = (clamped - 2.0) / LEVEL_UP_PROGRESS_LEVELS;
  const curve = Math.pow(progress, LEVEL_UP_CURVE_STEEPNESS);
  const multiplier = Math.pow(LEVEL_UP_REWARD_CAP / LEVEL_UP_REWARD_FLOOR, curve);
  return Math.round(LEVEL_UP_REWARD_FLOOR * multiplier);
}

/**
 * Calculates sum of level up rewards between two levels.
 */
export function getLevelUpRewards(startLevel: number, endLevel: number): number {
  let total = 0;
  for (let l = startLevel + 1; l <= endLevel; l++) {
    total += levelUpReward(l);
  }
  return total;
}

/**
 * HP XP scaling based on combat style.
 */
export function calculateCombatXp(
  xpPerHour: number,
  combatStyle: 'melee' | 'ranged' | 'magic' | 'shared'
) {
  let hpXpRate = 0;
  
  if (combatStyle === 'melee' || combatStyle === 'ranged') {
    // 4 xp per damage primary, 1.333 per damage hp
    hpXpRate = xpPerHour * (1.3333 / 4.0);
  } else if (combatStyle === 'shared') {
    // Assuming xpPerHour is total primary xp across Att+Str+Def.
    hpXpRate = xpPerHour * (1.3333 / 4.0);
  } else if (combatStyle === 'magic') {
    // Approximation for magic combat spells
    hpXpRate = xpPerHour * 0.5;
  }

  return { hpXpRate };
}
