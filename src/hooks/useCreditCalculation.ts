import { useState, useMemo, useEffect } from 'react';
import { 
  experienceForLevel, 
  levelForExperience, 
  levelUpReward, 
  calculateCombatXp 
} from '../utils/math';
import type { Monster } from '../utils/data';

export type SkillType = 'skilling' | 'melee' | 'ranged' | 'magic' | 'shared' | 'magic-defensive';

export interface MethodConfig {
  id: string;
  name: string;
  skillType: SkillType;
  startLevel: number;
  targetLevel: number;
  xpPerHour: number;
  secondarySkill?: {
    enabled: boolean;
    startLevel: number;
    xpPerHour: number;
  };
  monster?: Monster | null; 
  startHpLevel?: number;
  enableHpCredits?: boolean;
}

export interface DataPoint {
  time: number;
  level: number;
  totalCredits: number;
  creditsPerHour: number;
  packsPerHour: number;
  totalXp: number;
}

export function useCreditCalculation(initialConfig: MethodConfig) {
  const [config, setConfig] = useState<MethodConfig>(() => {
    try {
      const saved = localStorage.getItem(`tcg-calc-config-${initialConfig.id}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading config from localStorage', e);
    }
    return initialConfig;
  });

  useEffect(() => {
    localStorage.setItem(`tcg-calc-config-${config.id}`, JSON.stringify(config));
  }, [config]);

  const results = useMemo(() => {
    const { skillType, startLevel, targetLevel, xpPerHour, secondarySkill, monster } = config;
    
    // Ensure logical bounds
    const safeStartLevel = Math.max(1, Math.min(startLevel, 99));
    const safeTargetLevel = Math.max(safeStartLevel, Math.min(targetLevel, 99));

    const startXp = experienceForLevel(safeStartLevel);
    const targetXp = experienceForLevel(safeTargetLevel);
    
    // Primary State
    let currentXp = startXp;
    let previousLevel = safeStartLevel;
    
    // Combat / HP State
    const safeStartHpLevel = Math.max(1, Math.min(config.startHpLevel ?? safeStartLevel, 99));
    const isHpEnabled = config.enableHpCredits ?? true;
    const startHpLevel = safeStartHpLevel; 
    let currentHpXp = experienceForLevel(startHpLevel);
    let previousHpLevel = startHpLevel;

    // Secondary Skill State
    const secEnabled = skillType === 'skilling' && secondarySkill?.enabled;
    const startSecLevel = secondarySkill ? Math.max(1, Math.min(secondarySkill.startLevel, 99)) : 1;
    let currentSecXp = secEnabled ? experienceForLevel(startSecLevel) : 0;
    let previousSecLevel = startSecLevel;
    
    let totalCredits = 0;
    let uncreditedPrimaryXp = 0;
    let uncreditedSecXp = 0;
    
    let totalKills = 0;

    let creditsFromLevels = 0;
    let creditsFromHpLevels = 0;
    let creditsFromSecLevels = 0;
    let creditsFromKills = 0;
    let creditsFromSkillingXp = 0;

    const isCombat = skillType !== 'skilling';
    const { hpXpRate } = isCombat ? calculateCombatXp(xpPerHour, skillType as any) : { hpXpRate: 0 };
    
    const dataPoints: DataPoint[] = [];

    // Push initial datapoint
    dataPoints.push({
      time: 0,
      level: safeStartLevel,
      totalCredits: 0,
      creditsPerHour: 0,
      packsPerHour: 0,
      totalXp: startXp,
    });

    if (safeTargetLevel === safeStartLevel || xpPerHour <= 0) {
      return {
        dataPoints,
        finalCredits: 0,
        finalLevel: safeStartLevel,
        finalHpLevel: startHpLevel,
        finalSecLevel: startSecLevel,
        hoursTaken: 0,
        breakdown: {
          creditsFromLevels: 0,
          creditsFromHpLevels: 0,
          creditsFromSecLevels: 0,
          creditsFromKills: 0,
          creditsFromSkillingXp: 0
        },
        stats: {
          totalKills: 0,
          primaryXpGained: 0,
          secXpGained: 0,
          hpXpGained: 0
        }
      };
    }

    // Instead of time, we simulate very small time slices and record a datapoint every time the PRIMARY skill levels up.
    // To be perfectly accurate and simple, we'll step by 0.1 hours (6 minutes) and break when target XP is reached.
    const stepHours = 0.1;
    let t = 0;
    
    while (currentXp < targetXp) {
      // Calculate how much XP to give this tick. If we would overshoot target, cap it.
      let stepPrimaryXp = xpPerHour * stepHours;
      let actualStepHours = stepHours;
      
      if (currentXp + stepPrimaryXp > targetXp) {
        stepPrimaryXp = targetXp - currentXp;
        actualStepHours = stepPrimaryXp / xpPerHour;
      }

      t += actualStepHours;
      currentXp += stepPrimaryXp;
      
      // Calculate primary level ups
      const newLevel = levelForExperience(currentXp);
      let didPrimaryLevelUp = false;

      if (newLevel > previousLevel) {
        didPrimaryLevelUp = true;
        for (let l = previousLevel + 1; l <= Math.min(newLevel, 99); l++) {
          const reward = levelUpReward(l);
          totalCredits += reward;
          creditsFromLevels += reward;
        }
        previousLevel = newLevel;
      }

      // Combat specifics
      if (isCombat) {
        if (isHpEnabled) {
          const stepHpXp = hpXpRate * actualStepHours;
          currentHpXp += stepHpXp;
          const newHpLevel = levelForExperience(currentHpXp);
          
          if (newHpLevel > previousHpLevel) {
            for (let l = previousHpLevel + 1; l <= Math.min(newHpLevel, 99); l++) {
              const reward = levelUpReward(l);
              totalCredits += reward;
              creditsFromHpLevels += reward;
            }
            previousHpLevel = newHpLevel;
          }
        }

        if (monster) {
          const xpPerKill = 4.0 * monster.hitpoints;
          const kills = stepPrimaryXp / xpPerKill;
          totalKills += kills;
          const reward = kills * monster.combatLevel;
          totalCredits += reward;
          creditsFromKills += reward;
        }
      } else {
        // Skilling specifics (Primary)
        uncreditedPrimaryXp += stepPrimaryXp;
        const chunks = Math.floor(uncreditedPrimaryXp / 1000);
        if (chunks > 0) {
          const reward = chunks * 100;
          totalCredits += reward;
          creditsFromSkillingXp += reward;
          uncreditedPrimaryXp -= chunks * 1000;
        }

        // Secondary Skill Logic
        if (secEnabled && secondarySkill) {
          const stepSecXp = secondarySkill.xpPerHour * actualStepHours;
          currentSecXp += stepSecXp;
          const newSecLevel = levelForExperience(currentSecXp);

          if (newSecLevel > previousSecLevel) {
            for (let l = previousSecLevel + 1; l <= Math.min(newSecLevel, 99); l++) {
              const reward = levelUpReward(l);
              totalCredits += reward;
              creditsFromSecLevels += reward;
            }
            previousSecLevel = newSecLevel;
          }

          uncreditedSecXp += stepSecXp;
          const secChunks = Math.floor(uncreditedSecXp / 1000);
          if (secChunks > 0) {
            const reward = secChunks * 100;
            totalCredits += reward;
            creditsFromSkillingXp += reward;
            uncreditedSecXp -= secChunks * 1000;
          }
        }
      }

      // Add a data point if the primary skill leveled up OR if this is the absolute final tick
      if (didPrimaryLevelUp || currentXp >= targetXp) {
        const creditsPerHour = t > 0 ? totalCredits / t : 0;
        dataPoints.push({
          time: Number(t.toFixed(2)),
          level: newLevel,
          totalCredits: Math.round(totalCredits),
          creditsPerHour: Math.round(creditsPerHour),
          packsPerHour: Number((creditsPerHour / 1000).toFixed(1)),
          totalXp: Math.round(currentXp),
        });
      }
    }

    return {
      dataPoints,
      finalCredits: Math.round(totalCredits),
      finalLevel: previousLevel,
      finalHpLevel: previousHpLevel,
      finalSecLevel: previousSecLevel,
      hoursTaken: Number(t.toFixed(2)),
      breakdown: {
        creditsFromLevels: Math.round(creditsFromLevels),
        creditsFromHpLevels: Math.round(creditsFromHpLevels),
        creditsFromSecLevels: Math.round(creditsFromSecLevels),
        creditsFromKills: Math.round(creditsFromKills),
        creditsFromSkillingXp: Math.round(creditsFromSkillingXp)
      },
      stats: {
        totalKills: Math.round(totalKills),
        primaryXpGained: Math.round(currentXp - startXp),
        secXpGained: Math.round(currentSecXp - (secEnabled ? experienceForLevel(startSecLevel) : 0)),
        hpXpGained: Math.round(currentHpXp - experienceForLevel(startHpLevel)),
      }
    };
  }, [config]);

  return {
    config,
    setConfig,
    results,
  };
}
