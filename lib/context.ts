export function cleanContext(text: string): string {
  return text
    .replace(/\n+/g, ' ')
    .replace(/[^\w\s₹$€£¥.,!?@#:&()\-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
