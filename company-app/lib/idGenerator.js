export function generateQuotationId() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `SF-QT-${year}-${randomSuffix}`;
}
