/**
 * Generates a unique ID combining timestamp and random string
 */
export function generateId(): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${randomStr}`;
} 

