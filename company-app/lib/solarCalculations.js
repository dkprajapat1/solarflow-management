export function calculateSubsidy(capacityKw) {
  if (!capacityKw || capacityKw <= 0) return 0;
  if (capacityKw <= 1) return 30000;
  if (capacityKw <= 2) return 60000;
  return 78000;
}
