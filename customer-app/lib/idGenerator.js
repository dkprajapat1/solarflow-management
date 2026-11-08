export function generateApplicationId() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `SF-${year}-${randomSuffix}`;
}
