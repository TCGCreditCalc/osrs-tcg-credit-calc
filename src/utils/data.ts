import monstersJson from './monsters.json';

export interface Monster {
  id: string;
  name: string;
  combatLevel: number;
  hitpoints: number;
  imageUrl: string;
}

export const POPULAR_MONSTERS: Monster[] = monstersJson as Monster[];

