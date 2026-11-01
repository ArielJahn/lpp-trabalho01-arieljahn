export const RULES = {
  initialRawOnions: 100,
  workerLimit: 2,
  constructionDurationMs: 8_000,
  productionIntervalMs: 5_000,
  sproutingDurationMs: 20_000,
  bedCost: 30,
  bedProduction: 10,
  curingShedCost: 60,
  curingCapacity: 10,
  canneryCost: 40,
  canneryInput: 8,
  canneryOutput: 4,
  firstUpgradeCost: 20,
  upgradeCostGrowth: 1.6,
  yieldPerUpgrade: 0.1,
} as const

export function upgradeCost(level: number): number {
  return Math.round(RULES.firstUpgradeCost * RULES.upgradeCostGrowth ** level)
}

export function yieldMultiplier(level: number): number {
  return 1 + level * RULES.yieldPerUpgrade
}
