export const DEFAULT_ASSUMPTIONS = {
  annualGenerationPerKw: 1400,
  areaNeededPerKw: 90,
  averageTariffPerUnit: 7.5,
  baseCostPerKw: 60000,
  subsidySlabs: [
    { minKw: 0, maxKw: 1, amount: 30000 },
    { minKw: 1, maxKw: 2, amount: 60000 },
    { minKw: 2, maxKw: 999, amount: 78000 },
  ],
};

export function calculateSubsidy(capacityKw) {
  if (!capacityKw || capacityKw <= 0) return 0;
  if (capacityKw <= 1) return 30000;
  if (capacityKw <= 2) return 60000;
  return 78000;
}

export function calculateRecommendedCapacity(averageMonthlyUnits, availableRoofAreaSqFt) {
  const monthlyUnitsPerKw = DEFAULT_ASSUMPTIONS.annualGenerationPerKw / 12;
  const capacityNeeded = averageMonthlyUnits / monthlyUnitsPerKw;
  const maxRoofCapacity = (availableRoofAreaSqFt || 1000) / DEFAULT_ASSUMPTIONS.areaNeededPerKw;
  const rawCapacity = Math.min(capacityNeeded, maxRoofCapacity);
  const rounded = Math.round(rawCapacity * 2) / 2;
  return Math.max(1, Math.min(rounded, 25));
}

export function calculatePreliminaryEstimate({
  monthlyUnits = 300,
  monthlyBill = 2250,
  roofArea = 500,
  customCapacity = null,
}) {
  const config = DEFAULT_ASSUMPTIONS;
  const units =
    monthlyUnits && monthlyUnits > 0
      ? monthlyUnits
      : Math.round(monthlyBill / config.averageTariffPerUnit);

  const capacity =
    customCapacity && customCapacity > 0
      ? customCapacity
      : calculateRecommendedCapacity(units, roofArea);

  const yearlyGeneration = Math.round(capacity * config.annualGenerationPerKw);
  const installationCost = Math.round(capacity * config.baseCostPerKw);
  const subsidyAmount = calculateSubsidy(capacity);
  const netInstallationCost = Math.max(0, installationCost - subsidyAmount);

  const annualConsumptionUnits = units * 12;
  const effectiveUnitsSaved = Math.min(yearlyGeneration, annualConsumptionUnits);
  const yearlySavings = Math.round(effectiveUnitsSaved * config.averageTariffPerUnit);

  const paybackPeriod =
    yearlySavings > 0
      ? Math.round((netInstallationCost / yearlySavings) * 10) / 10
      : 0;

  return {
    recommendedCapacity: capacity,
    yearlyGeneration,
    installationCost,
    subsidyAmount,
    netInstallationCost,
    yearlySavings,
    paybackPeriod,
    assumptions: {
      generationPerKwYear: config.annualGenerationPerKw,
      electricityTariffPerUnit: config.averageTariffPerUnit,
      baseCostPerKw: config.baseCostPerKw,
      requiredAreaSqFt: Math.round(capacity * config.areaNeededPerKw),
      co2ReductionTonsPerYear: Math.round(yearlyGeneration * 0.00082 * 10) / 10,
    },
  };
}
